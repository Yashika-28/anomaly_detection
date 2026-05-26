import sqlite3
import os
import json
import math
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(__file__), "anomaly_detection.db")
TRUST_RADIUS_KM = 200

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def is_user_trusted_location(lat, lon, trusted_locations):
    if not lat or not lon:
        return True
    if not trusted_locations:
        return True
    return any(haversine_km(lat, lon, t['lat'], t['lon']) <= TRUST_RADIUS_KM for t in trusted_locations)

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Create Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        email TEXT,
        attempts INTEGER DEFAULT 0
    )
    """)

    # Create Trusted Locations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trusted_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        label TEXT,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
    )
    """)

    # Create Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        timestamp TEXT NOT NULL,
        status TEXT,
        ip_address TEXT,
        lat REAL,
        lon REAL,
        os TEXT,
        resolution TEXT,
        avg_keystroke_delay REAL,
        mouse_velocity REAL,
        tab_switch_count INTEGER,
        bytes_sent INTEGER,
        bytes_received INTEGER,
        active_processes TEXT,
        risk_status TEXT, -- Comma-separated or JSON list
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
    )
    """)
    conn.commit()

    # Check if empty to seed
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        print("Seeding initial database...")
        
        # Seed users
        initial_users = {
            "priyanshi": {
                "password": "password123",
                "email": "priyanshi22csu393@ncuindia.edu",
                "attempts": 0,
                "trustedLocations": [
                    { "lat": 48.8566, "lon": 2.3522, "label": "Paris (Home)" },
                    { "lat": 51.5074, "lon": -0.1278, "label": "London (Office)" },
                    { "lat": 50.1109, "lon": 8.6821, "label": "Frankfurt (Travel)" }
                ]
            },
            "anamika": {
                "password": "admin_password",
                "email": "anamika22csu015@ncuindia.edu",
                "attempts": 0,
                "trustedLocations": [
                    { "lat": 34.0522, "lon": -118.2437, "label": "Los Angeles (HQ)" },
                    { "lat": 37.7749, "lon": -122.4194, "label": "San Francisco (DC)" }
                ]
            },
            "akshi": {
                "password": "secure456",
                "email": "akshi22csu412@ncuindia.edu",
                "attempts": 0,
                "trustedLocations": [
                    { "lat": 40.7128, "lon": -74.006, "label": "New York (Home)" },
                    { "lat": 42.3601, "lon": -71.0589, "label": "Boston (Office)" }
                ]
            },
            "archit": {
                "password": "archit@456",
                "email": "archit22csu025@ncuindia.edu",
                "attempts": 0,
                "trustedLocations": [
                    { "lat": 28.6139, "lon": 77.2090, "label": "Delhi (Home)" },
                    { "lat": 28.4595, "lon": 77.0266, "label": "Gurugram (Office)" }
                ]
            },
            "alice_wong": {
                "password": "pass789",
                "email": "nischalsharma2037@gmail.com",
                "attempts": 6,
                "trustedLocations": [
                    { "lat": 1.3521, "lon": 103.8198, "label": "Singapore (Home)" },
                    { "lat": 22.3193, "lon": 114.1694, "label": "Hong Kong (Office)" },
                    { "lat": 35.6762, "lon": 139.6503, "label": "Tokyo (Client)" }
                ]
            }
        }

        for username, u in initial_users.items():
            cursor.execute(
                "INSERT INTO users (username, password, email, attempts) VALUES (?, ?, ?, ?)",
                (username, u["password"], u["email"], u["attempts"])
            )
            for loc in u["trustedLocations"]:
                cursor.execute(
                    "INSERT INTO trusted_locations (username, lat, lon, label) VALUES (?, ?, ?, ?)",
                    (username, loc["lat"], loc["lon"], loc["label"])
                )

        # Seed some initial historical sessions
        # (This is from route.ts's dummy session list)
        mock_sessions_raw = [
            {
                "id": "akshi-1777912418281",
                "username": "akshi",
                "attempts": 5,
                "timestamp": "2026-05-26T12:00:00Z",
                "status": "Brute-Force Attempt",
                "telemetry": {
                    "ip_address": "192.168.3.27", "lat": 32.2595, "lon": -44.5234,
                    "os": "Windows 11", "resolution": "1920x1080", "avg_keystroke_delay": 0.044,
                    "mouse_velocity": 8090, "tab_switch_count": 10, "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 293927426, "bytes_received": 50000, "risk_status": ["ANOMALY_BOT", "BRUTE_FORCE"]
                }
            },
            {
                "id": "archit-1777910918281",
                "username": "archit",
                "attempts": 2,
                "timestamp": "2026-05-26T11:45:00Z",
                "status": None,
                "telemetry": {
                    "ip_address": "192.168.2.32", "lat": 34.5489, "lon": 114.189,
                    "os": "Windows 11", "resolution": "2560x1440", "avg_keystroke_delay": 0.045,
                    "mouse_velocity": 4431, "tab_switch_count": 6, "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 288212017, "bytes_received": 10000, "risk_status": ["ANOMALY_BOT"]
                }
            },
            {
                "id": "anamika-1777907978281",
                "username": "anamika",
                "attempts": 6,
                "timestamp": "2026-05-26T11:30:00Z",
                "status": None,
                "telemetry": {
                    "ip_address": "192.168.4.196", "lat": 44.8511, "lon": 4.5859,
                    "os": "Windows 11", "resolution": "2880x1800", "avg_keystroke_delay": 0.002,
                    "mouse_velocity": 4199, "tab_switch_count": 3, "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 852903043, "bytes_received": 45000, "risk_status": ["ANOMALY_BOT"]
                }
            },
            {
                "id": "akshi-1777907198281",
                "username": "akshi",
                "attempts": 5,
                "timestamp": "2026-05-26T11:00:00Z",
                "status": None,
                "telemetry": {
                    "ip_address": "192.168.5.25", "lat": 42.45, "lon": 109.0013,
                    "os": "Ubuntu 22.04", "resolution": "2880x1800", "avg_keystroke_delay": 0.047,
                    "mouse_velocity": 8266, "tab_switch_count": 4, "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 1049800047, "bytes_received": 9000, "risk_status": ["UNKNOWN_LOCATION"]
                }
            },
            {
                "id": "priyanshi-1777902098281",
                "username": "priyanshi",
                "attempts": 2,
                "timestamp": "2026-05-26T10:15:00Z",
                "status": None,
                "telemetry": {
                    "ip_address": "192.168.4.3", "lat": 34.58, "lon": 8.5128,
                    "os": "Kali Linux", "resolution": "1920x1080", "avg_keystroke_delay": 0.021,
                    "mouse_velocity": 6682, "tab_switch_count": 12, "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 148678066, "bytes_received": 15000, "risk_status": ["ANOMALY_BOT"]
                }
            },
            {
                "id": "archit-1777906418281",
                "username": "archit",
                "attempts": 1,
                "timestamp": "2026-05-26T09:30:00Z",
                "status": None,
                "telemetry": {
                    "ip_address": "192.168.3.74", "lat": 45.3114, "lon": -87.2584,
                    "os": "Kali Linux", "resolution": "2880x1800", "avg_keystroke_delay": 0.103,
                    "mouse_velocity": 744, "tab_switch_count": 0, "active_processes": "Chrome, Outlook",
                    "bytes_sent": 14308712, "bytes_received": 2000000, "risk_status": ["SAFE"]
                }
            },
            {
                "id": "anamika-1777904138281",
                "username": "anamika",
                "attempts": 6,
                "timestamp": "2026-05-26T09:00:00Z",
                "status": "Brute-Force Attempt",
                "telemetry": {
                    "ip_address": "192.168.4.10", "lat": 34.6173, "lon": 61.5779,
                    "os": "Windows 11", "resolution": "1920x1080", "avg_keystroke_delay": 0.043,
                    "mouse_velocity": 5505, "tab_switch_count": 7, "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 2159292110, "bytes_received": 80000, "risk_status": ["ANOMALY_BOT", "BRUTE_FORCE"]
                }
            },
            {
                "id": "archit-1777896878281",
                "username": "archit",
                "attempts": 1,
                "timestamp": "2026-05-26T08:15:00Z",
                "status": None,
                "telemetry": {
                    "ip_address": "192.168.1.184", "lat": 24.545, "lon": -98.1664,
                    "os": "macOS Sonoma", "resolution": "2560x1440", "avg_keystroke_delay": 0.159,
                    "mouse_velocity": 787, "tab_switch_count": 1, "active_processes": "Chrome, Outlook",
                    "bytes_sent": 18180094, "bytes_received": 3500000, "risk_status": ["SAFE"]
                }
            },
            {
                "id": "priyanshi-1777897298281",
                "username": "priyanshi",
                "attempts": 6,
                "timestamp": "2026-05-26T07:45:00Z",
                "status": None,
                "telemetry": {
                    "ip_address": "192.168.3.123", "lat": 39.0445, "lon": -89.746,
                    "os": "Windows 11", "resolution": "2880x1800", "avg_keystroke_delay": 0.017,
                    "mouse_velocity": 4064, "tab_switch_count": 4, "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 1737865793, "bytes_received": 20000, "risk_status": ["UNKNOWN_LOCATION"]
                }
            },
            {
                "id": "anamika-1777884518281",
                "username": "anamika",
                "attempts": 1,
                "timestamp": "2026-05-26T07:00:00Z",
                "status": None,
                "telemetry": {
                    "ip_address": "192.168.2.164", "lat": 31.762, "lon": -110.0706,
                    "os": "Windows 11", "resolution": "1920x1080", "avg_keystroke_delay": 0.148,
                    "mouse_velocity": 821, "tab_switch_count": 2, "active_processes": "Chrome, Outlook",
                    "bytes_sent": 13322820, "bytes_received": 1400000, "risk_status": ["SAFE"]
                }
            },
            {
                "id": "alice_wong-1777905278281",
                "username": "alice_wong",
                "attempts": 4,
                "timestamp": "2026-05-26T06:15:00Z",
                "status": None,
                "telemetry": {
                    "ip_address": "192.168.1.111", "lat": 28.4985, "lon": 63.5774,
                    "os": "macOS Sonoma", "resolution": "2560x1440", "avg_keystroke_delay": 0.008,
                    "mouse_velocity": 4533, "tab_switch_count": 5, "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 1234015300, "bytes_received": 1000000, "risk_status": ["UNKNOWN_LOCATION"]
                }
            }
        ]

        for s in mock_sessions_raw:
            tel = s["telemetry"]
            cursor.execute("""
            INSERT INTO sessions (
                id, username, attempts, timestamp, status,
                ip_address, lat, lon, os, resolution,
                avg_keystroke_delay, mouse_velocity, tab_switch_count,
                bytes_sent, bytes_received, active_processes, risk_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                s["id"], s["username"], s["attempts"], s["timestamp"], s["status"],
                tel["ip_address"], tel["lat"], tel["lon"], tel["os"], tel["resolution"],
                tel["avg_keystroke_delay"], tel["mouse_velocity"], tel["tab_switch_count"],
                tel["bytes_sent"], tel.get("bytes_received", 0), tel["active_processes"],
                ",".join(tel["risk_status"])
            ))
            
        conn.commit()
    conn.close()

def create_account(username, password, email=None, trusted_locations=None):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT username FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            return {"success": False, "error": "Username already exists", "status": 409}
        
        cursor.execute(
            "INSERT INTO users (username, password, email, attempts) VALUES (?, ?, ?, ?)",
            (username, password, email, 0)
        )
        if trusted_locations:
            for loc in trusted_locations:
                cursor.execute(
                    "INSERT INTO trusted_locations (username, lat, lon, label) VALUES (?, ?, ?, ?)",
                    (username, loc["lat"], loc["lon"], loc.get("label", "Trusted Location"))
                )
        conn.commit()
        return {"success": True, "message": "Account created successfully"}
    except Exception as e:
        print(f"Error in create_account: {e}")
        return {"success": False, "error": "An unexpected database error occurred. Please try again.", "status": 500}
    finally:
        conn.close()

def verify_login(username, password):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT password, attempts FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        if not row:
            return {"success": False, "error": "User not found"}
        
        db_pwd = row["password"]
        db_attempts = (row["attempts"] or 0) + 1
        
        # Increment attempts on every login click
        cursor.execute("UPDATE users SET attempts = ? WHERE username = ?", (db_attempts, username))
        conn.commit()

        if db_pwd != password:
            return {"success": False, "error": "Incorrect password", "attempts": db_attempts}
        
        return {"success": True, "attempts": db_attempts}
    except Exception as e:
        print(f"Error in verify_login: {e}")
        return {"success": False, "error": "An unexpected authentication error occurred."}
    finally:
        conn.close()

def record_login(username, password, telemetry):
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Verify user exists or insert
        cursor.execute("SELECT attempts FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        if not row:
            cursor.execute("INSERT INTO users (username, password, email, attempts) VALUES (?, ?, ?, ?)",
                           (username, password, None, 1))
            attempts = 1
        else:
            attempts = row["attempts"] or 1
            
        override_attempts = telemetry.get("login_attempts_override", 0)
        final_attempts = override_attempts if override_attempts > 1 else attempts

        # Get trusted locations
        cursor.execute("SELECT lat, lon FROM trusted_locations WHERE username = ?", (username,))
        trusted = [{"lat": r["lat"], "lon": r["lon"]} for r in cursor.fetchall()]

        # Perform trusted location check
        login_lat = telemetry.get("lat", 0.0)
        login_lon = telemetry.get("lon", 0.0)
        risk_list = telemetry.get("risk_status", [])
        if isinstance(risk_list, str):
            risk_list = [risk_list]
        elif not isinstance(risk_list, list):
            risk_list = []

        if not is_user_trusted_location(login_lat, login_lon, trusted):
            if "unknown_location" not in risk_list:
                risk_list.append("unknown_location")

        ip = telemetry.get("ip_address", "Unknown")
        os_str = telemetry.get("os", "Unknown")
        res = telemetry.get("resolution", "Unknown")
        fp = f"{ip}|{os_str}|{res}"

        # Deduplicate/merge session if from the same device in the last 2 hours
        timestamp = datetime.now().isoformat() + "Z"
        merged = False
        two_hours_ago = datetime.utcnow()
        # Find sessions to merge
        cursor.execute("SELECT id, timestamp, ip_address, os, resolution FROM sessions WHERE username = ?", (username,))
        for s in cursor.fetchall():
            s_fp = f"{s['ip_address']}|{s['os']}|{s['resolution']}"
            try:
                s_time = datetime.fromisoformat(s['timestamp'].replace("Z", ""))
                diff_hours = (datetime.utcnow() - s_time).total_seconds() / 3600.0
            except:
                diff_hours = 999.0
            
            if s_fp == fp and diff_hours <= 2.0:
                # Update existing
                cursor.execute("""
                UPDATE sessions SET 
                    attempts = ?, timestamp = ?, status = NULL,
                    ip_address = ?, lat = ?, lon = ?, os = ?, resolution = ?,
                    avg_keystroke_delay = ?, mouse_velocity = ?, tab_switch_count = ?,
                    bytes_sent = ?, bytes_received = ?, active_processes = ?, risk_status = ?
                WHERE id = ?
                """, (
                    final_attempts, timestamp,
                    ip, login_lat, login_lon, os_str, res,
                    telemetry.get("avg_keystroke_delay", 0.0),
                    telemetry.get("mouse_velocity", 0.0),
                    telemetry.get("tab_switch_count", 0),
                    telemetry.get("bytes_sent", 0),
                    telemetry.get("bytes_received", 0),
                    telemetry.get("active_processes", ""),
                    ",".join(risk_list),
                    s["id"]
                ))
                merged = True
                session_id = s["id"]
                break

        if not merged:
            session_id = f"{username}-{int(datetime.now().timestamp() * 1000)}"
            cursor.execute("""
            INSERT INTO sessions (
                id, username, attempts, timestamp, status,
                ip_address, lat, lon, os, resolution,
                avg_keystroke_delay, mouse_velocity, tab_switch_count,
                bytes_sent, bytes_received, active_processes, risk_status
            ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session_id, username, final_attempts, timestamp,
                ip, login_lat, login_lon, os_str, res,
                telemetry.get("avg_keystroke_delay", 0.0),
                telemetry.get("mouse_velocity", 0.0),
                telemetry.get("tab_switch_count", 0),
                telemetry.get("bytes_sent", 0),
                telemetry.get("bytes_received", 0),
                telemetry.get("active_processes", ""),
                ",".join(risk_list)
            ))

        conn.commit()
        return {"success": True, "session": {"id": session_id, "username": username, "timestamp": timestamp}}
    except Exception as e:
        print(f"Error in record_login: {e}")
        return {"success": False, "error": "Failed to log session telemetry details."}
    finally:
        conn.close()

def record_failed_attempts(username, attempts, telemetry):
    conn = get_db()
    cursor = conn.cursor()
    try:
        ip = telemetry.get("ip_address", "Unknown") if telemetry else "Unknown"
        login_lat = telemetry.get("lat", 0.0) if telemetry else 0.0
        login_lon = telemetry.get("lon", 0.0) if telemetry else 0.0
        os_str = telemetry.get("os", "Unknown") if telemetry else "Unknown"
        res = telemetry.get("resolution", "Unknown") if telemetry else "Unknown"
        fp = f"{ip}|{os_str}|{res}"
        
        timestamp = datetime.now().isoformat() + "Z"
        merged = False
        
        # Merge if device matches in last 2 hours
        cursor.execute("SELECT id, timestamp, ip_address, os, resolution FROM sessions WHERE username = ?", (username,))
        for s in cursor.fetchall():
            s_fp = f"{s['ip_address']}|{s['os']}|{s['resolution']}"
            try:
                s_time = datetime.fromisoformat(s['timestamp'].replace("Z", ""))
                diff_hours = (datetime.utcnow() - s_time).total_seconds() / 3600.0
            except:
                diff_hours = 999.0

            if s_fp == fp and diff_hours <= 2.0:
                cursor.execute("""
                UPDATE sessions SET 
                    attempts = ?, timestamp = ?, status = 'Brute-Force Attempt',
                    ip_address = ?, lat = ?, lon = ?, os = ?, resolution = ?,
                    avg_keystroke_delay = ?, mouse_velocity = ?, tab_switch_count = ?,
                    bytes_sent = ?, bytes_received = ?, active_processes = ?, risk_status = ?
                WHERE id = ?
                """, (
                    attempts, timestamp,
                    ip, login_lat, login_lon, os_str, res,
                    telemetry.get("avg_keystroke_delay", 0.0) if telemetry else 0.0,
                    telemetry.get("mouse_velocity", 0.0) if telemetry else 0.0,
                    telemetry.get("tab_switch_count", 0) if telemetry else 0,
                    telemetry.get("bytes_sent", 0) if telemetry else 0,
                    telemetry.get("bytes_received", 0) if telemetry else 0,
                    telemetry.get("active_processes", "") if telemetry else "",
                    ",".join(telemetry.get("risk_status", [])) if telemetry else "",
                    s["id"]
                ))
                merged = True
                session_id = s["id"]
                break

        if not merged:
            session_id = f"{username}-brute-{int(datetime.now().timestamp() * 1000)}"
            cursor.execute("""
            INSERT INTO sessions (
                id, username, attempts, timestamp, status,
                ip_address, lat, lon, os, resolution,
                avg_keystroke_delay, mouse_velocity, tab_switch_count,
                bytes_sent, bytes_received, active_processes, risk_status
            ) VALUES (?, ?, ?, ?, 'Brute-Force Attempt', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session_id, username, attempts, timestamp,
                ip, login_lat, login_lon, os_str, res,
                telemetry.get("avg_keystroke_delay", 0.0) if telemetry else 0.0,
                telemetry.get("mouse_velocity", 0.0) if telemetry else 0.0,
                telemetry.get("tab_switch_count", 0) if telemetry else 0,
                telemetry.get("bytes_sent", 0) if telemetry else 0,
                telemetry.get("bytes_received", 0) if telemetry else 0,
                telemetry.get("active_processes", "") if telemetry else "",
                ",".join(telemetry.get("risk_status", [])) if telemetry else ""
            ))

        conn.commit()
        return {"success": True, "session": {"id": session_id, "username": username, "timestamp": timestamp}}
    except Exception as e:
        print(f"Error in record_failed_attempts: {e}")
        return {"success": False, "error": "Failed to record failed login attempts."}
    finally:
        conn.close()

def get_sessions():
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM sessions ORDER BY timestamp DESC LIMIT 100")
        sessions = []
        for r in cursor.fetchall():
            rs_str = r["risk_status"]
            rs_list = rs_str.split(",") if rs_str else []
            sessions.append({
                "id": r["id"],
                "username": r["username"],
                "attempts": r["attempts"],
                "timestamp": r["timestamp"],
                "status": r["status"],
                "telemetry": {
                    "ip_address": r["ip_address"],
                    "lat": r["lat"],
                    "lon": r["lon"],
                    "os": r["os"],
                    "resolution": r["resolution"],
                    "avg_keystroke_delay": r["avg_keystroke_delay"],
                    "mouse_velocity": r["mouse_velocity"],
                    "tab_switch_count": r["tab_switch_count"],
                    "bytes_sent": r["bytes_sent"],
                    "bytes_received": r["bytes_received"],
                    "active_processes": r["active_processes"],
                    "risk_status": rs_list
                }
            })
        return {"success": True, "sessions": sessions}
    except Exception as e:
        print(f"Error in get_sessions: {e}")
        return {"success": False, "error": "Failed to retrieve active sessions list."}
    finally:
        conn.close()

def get_users():
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT username, email, attempts FROM users")
        users = []
        for r in cursor.fetchall():
            username = r["username"]
            
            # Get trusted locations
            cursor.execute("SELECT lat, lon, label FROM trusted_locations WHERE username = ?", (username,))
            trusted = [{"lat": tl["lat"], "lon": tl["lon"], "label": tl["label"]} for tl in cursor.fetchall()]
            
            # Get last session telemetry
            cursor.execute("SELECT * FROM sessions WHERE username = ? ORDER BY timestamp DESC LIMIT 1", (username,))
            last_s = cursor.fetchone()
            
            if last_s:
                rs_str = last_s["risk_status"]
                rs_list = rs_str.split(",") if rs_str else []
                telemetry = {
                    "ip_address": last_s["ip_address"],
                    "lat": last_s["lat"],
                    "lon": last_s["lon"],
                    "os": last_s["os"],
                    "resolution": last_s["resolution"],
                    "avg_keystroke_delay": last_s["avg_keystroke_delay"],
                    "mouse_velocity": last_s["mouse_velocity"],
                    "tab_switch_count": last_s["tab_switch_count"],
                    "bytes_sent": last_s["bytes_sent"],
                    "bytes_received": last_s["bytes_received"],
                    "active_processes": last_s["active_processes"],
                    "risk_status": rs_list
                }
            else:
                telemetry = None
                
            users.append({
                "username": username,
                "email": r["email"] or "",
                "attempts": r["attempts"] or 0,
                "lastIp": telemetry["ip_address"] if telemetry else "Unknown",
                "lastLocation": {"lat": telemetry["lat"], "lon": telemetry["lon"]} if telemetry else None,
                "riskStatus": telemetry["risk_status"] if telemetry else [],
                "trustedLocations": trusted
            })
        return {"success": True, "users": users}
    except Exception as e:
        print(f"Error in get_users: {e}")
        return {"success": False, "error": "Failed to retrieve registered user profiles."}
    finally:
        conn.close()

def get_analytics():
    res = get_sessions()
    if not res["success"]:
        return res
    
    sessions = res["sessions"]
    verdicts = {"safe": 0, "warning": 0, "critical": 0}
    ip_groups = {}
    location_groups = {}
    user_targets = {}
    threat_types = {"bot": 0, "vpn": 0, "devtools": 0, "paste": 0, "highData": 0, "bruteForce": 0}

    for s in sessions:
        tel = s["telemetry"]
        risk_str = " ".join(tel.get("risk_status", [])).upper()
        attempts = s.get("attempts", 1)
        
        is_anomaly = "ANOMALY" in risk_str or "UNKNOWN" in risk_str or attempts > 2
        is_safe = "SAFE" in risk_str and attempts <= 2
        
        if is_safe:
            verdict = "safe"
        elif is_anomaly:
            verdict = "critical"
        else:
            verdict = "warning"
            
        verdicts[verdict] += 1
        
        # IP Grouping
        ip = tel.get("ip_address", "Unknown")
        if ip not in ip_groups:
            ip_groups[ip] = {"count": 0, "verdicts": [], "users": []}
        ip_groups[ip]["count"] += 1
        ip_groups[ip]["verdicts"].append(verdict)
        if s["username"] not in ip_groups[ip]["users"]:
            ip_groups[ip]["users"].append(s["username"])
            
        # Location Grouping
        lat = tel.get("lat")
        lon = tel.get("lon")
        if lat is not None and lon is not None:
            loc_key = f"{round(lat, 2)},{round(lon, 2)}"
            if loc_key not in location_groups:
                location_groups[loc_key] = {"count": 0, "lat": lat, "lon": lon, "users": [], "verdicts": []}
            location_groups[loc_key]["count"] += 1
            location_groups[loc_key]["verdicts"].append(verdict)
            if s["username"] not in location_groups[loc_key]["users"]:
                location_groups[loc_key]["users"].append(s["username"])
                
        # User targeting
        user = s["username"]
        if user not in user_targets:
            user_targets[user] = {"attempts": 0, "verdict": "safe"}
        user_targets[user]["attempts"] += attempts
        if verdict == "critical":
            user_targets[user]["verdict"] = "critical"
        elif verdict == "warning" and user_targets[user]["verdict"] != "critical":
            user_targets[user]["verdict"] = "warning"
            
        # Threat types
        if any("BOT" in r.upper() for r in tel.get("risk_status", [])):
            threat_types["bot"] += 1
        if tel.get("mouse_velocity", 0.0) > 2000:
            threat_types["bot"] += 1
        if tel.get("tab_switch_count", 0) > 2:
            threat_types["devtools"] += 1
        if tel.get("avg_keystroke_delay", 1.0) < 0.05:
            threat_types["paste"] += 1
        if tel.get("bytes_sent", 0) > 100000000:
            threat_types["highData"] += 1
        if attempts > 2:
            threat_types["bruteForce"] += 1

    return {
        "success": True,
        "analytics": {
            "totalSessions": len(sessions),
            "verdicts": verdicts,
            "ipGroups": ip_groups,
            "locationGroups": location_groups,
            "userTargets": user_targets,
            "threatTypes": threat_types,
            "uniqueIps": len(ip_groups),
            "bruteForceAttempts": len([u for u in user_targets.values() if u["attempts"] > 2])
        }
    }

def get_user_email(username):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT email FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        return row["email"] if row else None
    except:
        return None
    finally:
        conn.close()

def reset_password(username, new_password):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT username FROM users WHERE username = ?", (username,))
        if not cursor.fetchone():
            return {"success": False, "error": "User not found"}
        
        cursor.execute("UPDATE users SET password = ?, attempts = 0 WHERE username = ?", (new_password, username))
        conn.commit()
        return {"success": True, "message": "Password reset successfully"}
    except Exception as e:
        print(f"Error in reset_password: {e}")
        return {"success": False, "error": "Failed to reset password."}
    finally:
        conn.close()
