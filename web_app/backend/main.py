from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import datetime
import random
import smtplib
import math
from email.message import EmailMessage
import os
from dotenv import load_dotenv
from email_template import get_otp_email_html, get_otp_email_text, get_brute_force_email_html, get_brute_force_email_text

# Import database manager functions
from db_manager import (
    init_db, create_account, verify_login, record_login, 
    record_failed_attempts, get_sessions, get_users, get_analytics,
    reset_password, get_user_email
)

# Import ML pipeline
from ml_pipeline import ml_score, load_models, train_models, models_ready

load_dotenv()

# --- Trusted office/home locations (global fallback) ---
# Each user has their own trusted locations stored in the frontend DB.
# If user_trusted_locations is NOT passed in the evaluate payload,
# no location check is done (the DB-side already flagged it).

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def is_trusted_location(lat, lon, trusted_locs):
    """Check if lat/lon is within 200km of any location in trusted_locs list."""
    if not trusted_locs:
        return True  # no list provided — skip location check
    if not lat and not lon:
        return True
    return any(haversine_km(lat, lon, t['lat'], t['lon']) <= 200 for t in trusted_locs)


app = FastAPI()

@app.on_event("startup")
def startup_event():
    init_db()
    # Load ML models — non-fatal, falls back to rule-based if not found
    loaded = load_models()
    if loaded:
        print("[ML] Models loaded successfully — using ML-based threat scoring.")
    else:
        print("[ML] Models not found — using rule-based scoring. Run /api/retrain to train.")

# --- NEW: OTP Storage & Email Config ---
active_otps = {}
forgot_password_otps = {}

# Replace these sample credentials with your actual Gmail address and App Password
SENDER_EMAIL = "neurometric.alert@gmail.com"
SENDER_PASSWORD = "ufgu ***"

def is_example_email(email: str | None) -> bool:
    if not email:
        return False
    email = email.lower().strip()
    domain = email.split("@")[-1] if "@" in email else email
    mock_domains = ["example.com", "domain.com", "ncuindia.edu", "company.com", "corp.com", "test.com"]
    return any(dom in domain for dom in mock_domains)

def send_otp_email(target_email: str, otp: str, username: str = "User"):
    if is_example_email(target_email):
        print("\n" + "="*80)
        print(f"🔑 [MOCK EMAIL BYPASS] MFA OTP for user '{username}':")
        print(f"   Email: {target_email}")
        print(f"   Code:  {otp}")
        print("="*80 + "\n")
        return True

    msg = EmailMessage()
    msg.set_content(get_otp_email_text(otp, username))
    msg.add_alternative(get_otp_email_html(otp, username), subtype='html')
    msg['Subject'] = '🔐 NeurometricShield: Verification Code Required'
    msg['From'] = SENDER_EMAIL
    msg['To'] = target_email

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"OTP {otp} sent successfully to {target_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.soc_connections: list[WebSocket] = []

    async def connect_soc(self, websocket: WebSocket):
        await websocket.accept()
        self.soc_connections.append(websocket)

    def disconnect_soc(self, websocket: WebSocket):
        self.soc_connections.remove(websocket)

    async def broadcast_to_soc(self, message: dict):
        for connection in self.soc_connections:
            await connection.send_json(message)

manager = ConnectionManager()

# --- 1. LIVE TRACKING ENDPOINT ---
@app.websocket("/ws/tracking")
async def websocket_tracking_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()

            # Handle logout signal separately
            if data.get("type") == "LOGOUT_SIGNAL":
                logout_event = {
                    "type": "SESSION_ENDED",
                    "username": data.get("username", "Unknown"),
                    "ip_address": data.get("ip_address", ""),
                    "os": data.get("os", ""),
                    "resolution": data.get("resolution", ""),
                    "time": datetime.datetime.now().strftime("%H:%M:%S"),
                    "risk_status": "locked/final (signedout)",
                    "color": "#64748b"
                }
                await manager.broadcast_to_soc(logout_event)
                continue

            if data.get("is_login_flow"):
                # Skip tracking broadcast during login - let /api/evaluate handle single log
                continue
            
            data["time"] = datetime.datetime.now().strftime("%H:%M:%S")
            data["type"] = "LIVE_UPDATE"
            data["protocol"] = "TCP"
            # Preserve bytes_sent and bytes_received from client
            if "bytes_sent" not in data:
                data["bytes_sent"] = 0
            if "bytes_received" not in data:
                data["bytes_received"] = 0
            
            t = CustomThresholds()
            score_data = calculate_threat_score(data, t)
            data["threat_score"] = score_data["threat_score"]
            data["risk_status"] = f"Monitoring... (Score: {score_data['threat_score']})"
            data["color"] = "#d97706" # Orange color for monitoring
            
            if score_data["threat_score"] >= 0.7:
                await websocket.send_json({"type": "BLOCK_USER", "threat_score": score_data["threat_score"]})
                data["risk_status"] = f"CRITICAL ANOMALY (Blocked - Score: {score_data['threat_score']})"
                data["color"] = "#dc2626"

            await manager.broadcast_to_soc(data)
    except WebSocketDisconnect:
        pass

# --- 2. FINAL EVALUATION ENDPOINT ---
class CustomThresholds(BaseModel):
    bot_mouse_velocity: float = 3000
    bot_keystroke_delay: float = 0.05
    suspicious_attempts: int = 4      # OTP triggered at this many attempts
    brute_force_attempts: int = 4     # Brute-force critical at this many attempts
    high_data_mb: float = 50

def _rule_based_score(data: dict, t: CustomThresholds) -> dict:
    """
    Rule-based fallback threat scorer.
    Used ONLY when ML models are not loaded.
    """
    is_bot = data.get("avg_keystroke_delay", 1.0) < t.bot_keystroke_delay or data.get("mouse_velocity", 0) > t.bot_mouse_velocity
    is_distracted = "Slack" in data.get("active_processes", "") or data.get("tab_switch_count", 0) > 2
    behavior_anomaly = 1.0 if is_bot else (0.5 if is_distracted else 0.0)

    attempts = max(data.get("attempts", 1), data.get("login_attempts_override", 1))
    has_excessive_attempts = attempts >= t.suspicious_attempts
    is_brute_force = attempts >= t.brute_force_attempts
    login_anomaly = 1.0 if is_brute_force else (0.8 if has_excessive_attempts else 0.0)

    is_hacker = any(tool in data.get("active_processes", "") for tool in ["Tor", "Wireshark", "nmap", "Burp", "Hydra", "Metasploit", "Netcat"])
    bytes_sent_mb = data.get("bytes_sent", 0) / (1024 * 1024)
    is_high_data = bytes_sent_mb >= t.high_data_mb
    network_anomaly = 1.0 if is_hacker else (0.8 if is_high_data else 0.0)

    weights = (0.3, 0.5, 0.2)
    threat_score = round(
        weights[0] * login_anomaly + weights[1] * behavior_anomaly + weights[2] * network_anomaly,
        3
    )

    if threat_score < 0.4:
        verdict = 'SAFE'
        color = '#16a34a'
    elif threat_score < 0.7:
        verdict = 'WARNING (MFA Recommended)'
        color = '#f59e0b'
    else:
        verdict = 'CRITICAL (Block)'
        color = '#dc2626'

    return {'threat_score': threat_score, 'verdict': verdict, 'color': color}


def calculate_threat_score(data: dict, t: CustomThresholds) -> dict:
    """
    Primary threat scorer. Uses trained ML models when available,
    falls back to rule-based logic otherwise.
    """
    # Enrich data dict with flags ml_score needs
    procs = data.get("active_processes", "")
    HACKER_TOOLS = {"Tor", "Wireshark", "nmap", "Burp", "Hydra",
                    "Metasploit", "Netcat", "Mimikatz", "sqlmap"}
    data["has_hacker_tools"] = int(any(tool in procs for tool in HACKER_TOOLS))
    data["is_unknown_location"] = data.get("is_unknown_location", 0)

    ml_result = ml_score(data)
    if ml_result is not None:
        return ml_result

    # Fallback
    return _rule_based_score(data, t)

class LoginPayload(BaseModel):
    username: str
    ip_address: str
    lat: float
    lon: float
    os: str
    resolution: str
    avg_keystroke_delay: float
    mouse_velocity: float
    tab_switch_count: int
    bytes_sent: int
    bytes_received: int = 0
    active_processes: str = ""
    attempts: int
    login_attempts_override: int
    email: str | None = "user@example.com"
    custom_thresholds: CustomThresholds | None = None
    user_trusted_locations: list | None = None
    is_login_flow: bool = False

@app.post("/api/evaluate")
async def evaluate_login(payload: LoginPayload):
    current_time = datetime.datetime.now().strftime("%H:%M:%S")
    
    full_record = payload.dict() 
    full_record["time"] = current_time
    full_record["type"] = "FINAL_EVALUATION"
    full_record["protocol"] = "HTTPS (POST)"

    # Use custom thresholds from payload if provided, otherwise use defaults
    t = payload.custom_thresholds or CustomThresholds()
    score_data = calculate_threat_score(payload.dict(), t)
    threat_score = score_data["threat_score"]
    print(f"DEBUG EVALUATE: username={payload.username} threat_score={threat_score} score_data={score_data}")
    verdict      = score_data["verdict"]   # "SAFE" | "WARNING (MFA Recommended)" | "CRITICAL (Block)"
    full_record["threat_score"] = threat_score
    full_record["color"]        = score_data["color"]

    # ── Action derivation from ML threat score ──
    # CRITICAL  (≥ 0.70) → block outright
    # WARNING   (≥ 0.40) → trigger MFA (OTP email)
    # SAFE      (<  0.40) → let through
    #
    # Hard-override: even if ML says WARNING, always send MFA email
    # when brute-force is detected (many attempts) — belt-and-suspenders.
    is_brute_force = (
        payload.attempts >= t.brute_force_attempts
        or payload.login_attempts_override >= t.brute_force_attempts
    )

    if is_brute_force:
        full_record["risk_status"] = "WARNING (MFA Triggered - Brute Force)"
        full_record["color"] = "#f59e0b"
        action = "mfa_required"
        otp = str(random.randint(100000, 999999))
        active_otps[payload.username] = otp
        send_otp_email(payload.email, otp, payload.username)
    elif threat_score >= 0.75:
        full_record["risk_status"] = "CRITICAL ANOMALY (Blocked)"
        action = "blocked"
    elif threat_score >= 0.40:
        full_record["risk_status"] = "WARNING (MFA Triggered)"
        action = "mfa_required"
        otp = str(random.randint(100000, 999999))
        active_otps[payload.username] = otp
        send_otp_email(payload.email, otp, payload.username)
    else:
        full_record["risk_status"] = "SAFE (Authenticated)"
        action = "success"

    # Location trust check — append flag if login is from an unfamiliar location
    is_unknown_location = not is_trusted_location(payload.lat, payload.lon, payload.user_trusted_locations or [])
    if is_unknown_location:
        full_record["risk_status"] = str(full_record.get("risk_status", "")) + " | UNKNOWN_LOCATION"

    # Always broadcast 1 combined log to SOC dashboard
    full_record["risk_status"] = full_record["risk_status"] + " (streaming)" if "SAFE" in full_record["risk_status"] else full_record["risk_status"]
    await manager.broadcast_to_soc(full_record)

    return {
        "status": action,
        "message": "Evaluation complete",
        "scoring_mode": "ml" if models_ready() else "rule-based",
        "threat_score": threat_score,
        "is_mock_email": is_example_email(payload.email),
        "email": payload.email
    }



# --- NEW: OTP Verification Endpoint ---
class VerifyPayload(BaseModel):
    username: str
    otp: str
    ip_address: str = "Verified"
    lat: float = 0.0
    lon: float = 0.0
    os: str = "Unknown"
    resolution: str = "Unknown"
    avg_keystroke_delay: float = 0.0
    mouse_velocity: float = 0.0
    tab_switch_count: int = 0
    active_processes: str = "Identity Confirmed"
    bytes_sent: int = 0
    protocol: str = "HTTPS"
    attempts: int = 1

@app.post("/api/verify-otp")
async def verify_otp(payload: VerifyPayload):
    # Check if user has an active OTP and if it matches
    if payload.username in active_otps and str(active_otps[payload.username]) == payload.otp:
        del active_otps[payload.username] # Clear the OTP so it can't be reused
        
        # Broadcast to SOC that they passed
        await manager.broadcast_to_soc({
            "time": datetime.datetime.now().strftime("%H:%M:%S"),
            "username": payload.username,
            "type": "FINAL_EVALUATION",
            "risk_status": "MFA PASSED (Authenticated)",
            "color": "#16a34a",
            "lat": payload.lat, "lon": payload.lon, "ip_address": payload.ip_address, 
            "os": payload.os, "resolution": payload.resolution, 
            "protocol": payload.protocol, "bytes_sent": payload.bytes_sent, 
            "avg_keystroke_delay": payload.avg_keystroke_delay, "mouse_velocity": payload.mouse_velocity, 
            "tab_switch_count": payload.tab_switch_count, "active_processes": payload.active_processes,
            "attempts": payload.attempts
        })
        return {"status": "success"}
    return {"status": "failed", "message": "Invalid OTP"}

class AlertPayload(BaseModel):
    email: str
    username: str
    attempts: int

@app.post("/api/alert-brute-force")
async def alert_brute_force(payload: AlertPayload):
    if is_example_email(payload.email):
        print("\n" + "="*80)
        print(f"🚨 [MOCK EMAIL BYPASS] Brute Force Alert for user '{payload.username}':")
        print(f"   Email:    {payload.email}")
        print(f"   Attempts: {payload.attempts}")
        print("="*80 + "\n")
        return {"status": "success", "is_mock_email": True}

    msg = EmailMessage()
    msg.set_content(get_brute_force_email_text(payload.attempts, payload.username))
    msg.add_alternative(get_brute_force_email_html(payload.attempts, payload.username), subtype='html')
    msg['Subject'] = '🚨 NeurometricShield: Critical Security Alert (Brute Force Detected)'
    msg['From'] = SENDER_EMAIL
    msg['To'] = payload.email

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Brute force alert sent successfully to {payload.email}")
        return {"status": "success"}
    except Exception as e:
        print(f"Failed to send alert email: {e}")
        return {"status": "error"}


# --- DATABASE & FORGOT PASSWORD ENDPOINTS ---

class DbPayload(BaseModel):
    action: str
    payload: dict | None = None

@app.post("/api/db")
async def db_endpoint(payload: DbPayload):
    action = payload.action
    p = payload.payload or {}
    
    if action == "GET_USERS":
        return get_users()
    elif action == "GET_SESSIONS":
        return get_sessions()
    elif action == "GET_ANALYTICS":
        return get_analytics()
    elif action == "CREATE_ACCOUNT":
        username = p.get("username")
        password = p.get("password")
        email = p.get("email")
        trusted_locations = p.get("trustedLocations", [])
        return create_account(username, password, email, trusted_locations)
    elif action == "VERIFY_LOGIN":
        username = p.get("username")
        password = p.get("password")
        return verify_login(username, password)
    elif action == "RECORD_LOGIN":
        username = p.get("username")
        password = p.get("password")
        telemetry = p.get("telemetry", {})
        return record_login(username, password, telemetry)
    elif action == "RECORD_FAILED_ATTEMPTS":
        username = p.get("username")
        attempts = p.get("attempts", 1)
        telemetry = p.get("telemetry", {})
        return record_failed_attempts(username, attempts, telemetry)
    elif action == "RESET_PASSWORD":
        username = p.get("username")
        password = p.get("password")
        return reset_password(username, password)
    else:
        return {"success": False, "error": "Invalid action"}


# ─── ML RETRAIN ENDPOINT ──────────────────────────────────────────────────────
@app.post("/api/retrain")
async def retrain_models(background_tasks: BackgroundTasks):
    """
    Triggers model retraining using all sessions currently in the DB
    augmented with synthetic data. Runs in background so the API
    stays responsive during training.
    """
    db_path = os.path.join(os.path.dirname(__file__), "anomaly_detection.db")

    def _do_retrain():
        print("[ML] Retraining started...")
        success = train_models(db_path=db_path)
        if success:
            load_models()  # hot-reload into memory
            print("[ML] Retraining complete — new models loaded.")
        else:
            print("[ML] Retraining failed.")

    background_tasks.add_task(_do_retrain)
    return {"status": "queued", "message": "Model retraining started in background. This may take 30-60 seconds."}

def send_reset_email(target_email: str, otp: str, username: str = "User"):
    if is_example_email(target_email):
        print("\n" + "="*80)
        print(f"🔑 [MOCK EMAIL BYPASS] Password Reset Code for user '{username}':")
        print(f"   Email: {target_email}")
        print(f"   Code:  {otp}")
        print("="*80 + "\n")
        return True

    msg = EmailMessage()
    msg.set_content(f"Hello {username},\n\nYou requested a password reset for your NeurometricShield account. Use the verification code below to set a new password:\n\n{otp}\n\nThis code will expire in 10 minutes. If you did not request a password reset, please ignore this email.\n\nBest regards,\nNeurometricShield Team")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 30px;">
      <div style="max-width: 500px; background: #0f172a; color: #ffffff; padding: 25px; border-radius: 8px; border: 1px solid #1e293b; margin: auto;">
        <h2 style="color: #ffffff; text-align: center; margin-bottom: 5px;">Neurometric<span style="color: #3b82f6;">Shield</span></h2>
        <p style="color: #94a3b8; text-align: center; font-size: 14px; margin-top: 0;">Password Reset Request</p>
        <hr style="border-color: #1e293b; margin: 20px 0;">
        <p>Hello <strong>{username}</strong>,</p>
        <p>We received a request to reset your password. Use the verification code below to complete the reset:</p>
        <div style="background-color: #1e293b; border: 1px solid #334155; padding: 20px; text-align: center; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #38bdf8; margin: 20px 0;">
          {otp}
        </div>
        <p style="font-size: 13px; color: #94a3b8;">This code will expire in 10 minutes. If you did not make this request, you can safely ignore this email.</p>
      </div>
    </body>
    </html>
    """
    msg.add_alternative(html_content, subtype='html')
    msg['Subject'] = '🔑 NeurometricShield: Password Reset Code'
    msg['From'] = SENDER_EMAIL
    msg['To'] = target_email

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Password reset email sent to {target_email}")
        return True
    except Exception as e:
        print(f"Failed to send password reset email to {target_email}: {e}")
        return False

class ForgotRequestPayload(BaseModel):
    username: str

class ForgotResetPayload(BaseModel):
    username: str
    otp: str
    new_password: str

@app.post("/api/forgot-password/request")
async def forgot_password_request(payload: ForgotRequestPayload):
    username = payload.username
    email = get_user_email(username)
    if not email:
        return {"status": "error", "message": "User not found or has no email registered"}
    
    otp = str(random.randint(100000, 999999))
    forgot_password_otps[username] = otp
    print(f"FORGOT_PASSWORD_OTP for {username}: {otp}")
    
    send_reset_email(email, otp, username)
    is_mock = is_example_email(email)
    return {
        "status": "success", 
        "message": "Verification code sent to your registered email",
        "is_mock_email": is_mock,
        "email": email
    }

@app.post("/api/forgot-password/reset")
async def forgot_password_reset(payload: ForgotResetPayload):
    username = payload.username
    otp = payload.otp
    new_password = payload.new_password
    
    if username in forgot_password_otps and str(forgot_password_otps[username]) == str(otp):
        del forgot_password_otps[username]
        res = reset_password(username, new_password)
        if res["success"]:
            return {"status": "success", "message": "Password reset successfully"}
        else:
            return {"status": "error", "message": res.get("error", "Failed to reset password")}
    
    return {"status": "error", "message": "Invalid OTP code"}


@app.websocket("/ws/soc")
async def websocket_soc_endpoint(websocket: WebSocket):
    await manager.connect_soc(websocket)
    try:
        while True:
            await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect_soc(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

