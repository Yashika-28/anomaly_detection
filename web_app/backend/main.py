from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import datetime
import random
import smtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv
from email_template import get_otp_email_html, get_otp_email_text

load_dotenv()

app = FastAPI()

# --- NEW: OTP Storage & Email Config ---
active_otps = {}

SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "neurometric.alert@gmail.com")
SENDER_PASSWORD = os.environ.get("SENDER_PASSWORD", "1234")

def send_otp_email(target_email: str, otp: str, username: str = "User"):
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
    except Exception as e:
        print(f"Failed to send email: {e}")

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
            data["time"] = datetime.datetime.now().strftime("%H:%M:%S")
            data["type"] = "LIVE_UPDATE"
            data["risk_status"] = "Monitoring..."
            data["color"] = "#d97706" # Orange color for monitoring
            
            # Add mock network data so the table isn't empty during live tracking
            data["bytes_sent"] = random.randint(500, 2000)
            data["protocol"] = "TCP"
            
            await manager.broadcast_to_soc(data)
    except WebSocketDisconnect:
        pass

# --- 2. FINAL EVALUATION ENDPOINT ---
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
    active_processes: str = ""
    attempts: int
    login_attempts_override: int
    email: str | None = "nischalsharma2037@gmail.com"

@app.post("/api/evaluate")
async def evaluate_login(payload: LoginPayload):
    current_time = datetime.datetime.now().strftime("%H:%M:%S")
    
    full_record = payload.dict() 
    full_record["time"] = current_time
    full_record["type"] = "FINAL_EVALUATION"
    full_record["protocol"] = "HTTPS (POST)"

    # AI EVALUATION LOGIC WITH ADAPTIVE MFA
    is_bot = payload.avg_keystroke_delay < 0.05 or payload.mouse_velocity > 3000
    is_hacker = "Tor" in payload.active_processes or "Wireshark" in payload.active_processes or "nmap" in payload.active_processes or "Burp" in payload.active_processes or "Hydra" in payload.active_processes
    has_excessive_attempts = payload.attempts > 2 or payload.login_attempts_override > 2
    is_distracted = "Slack" in payload.active_processes or payload.tab_switch_count > 2

    # Priority: If excessive login attempts, ALWAYS trigger MFA (never block)
    # This prevents denial-of-service by brute-forcing someone's account
    if has_excessive_attempts or is_distracted:
        full_record["risk_status"] = "WARNING (MFA Triggered)"
        full_record["color"] = "#f59e0b" # Orange/Amber
        action = "mfa_required"
        
        # Generate and send OTP
        otp = str(random.randint(100000, 999999))
        active_otps[payload.username] = otp
        send_otp_email(payload.email, otp, payload.username)
    elif is_bot or is_hacker:
        full_record["risk_status"] = "CRITICAL ANOMALY (Blocked)"
        full_record["color"] = "#dc2626" # Red
        action = "blocked"
    else:
        full_record["risk_status"] = "SAFE (Authenticated)"
        full_record["color"] = "#16a34a" # Green
        action = "success"

    await manager.broadcast_to_soc(full_record)
    return {"status": action, "message": "Evaluation complete"}

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
    msg = EmailMessage()
    msg.set_content(f"SECURITY ALERT\n\nThere have been {payload.attempts} failed login attempts for the account '{payload.username}'.\n\nIf this was not you, someone may be trying to guess your password. We recommend changing your password immediately.")
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