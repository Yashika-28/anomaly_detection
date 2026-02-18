import pandas as pd
import numpy as np
from faker import Faker
import random
from datetime import datetime, timedelta

fake = Faker()
Faker.seed(42)
random.seed(42)

# --- CONFIGURATION ---
NUM_USERS = 500
DAYS_OF_DATA = 30
ANOMALY_RATE = 0.03 # 3% Attack Rate (Realistic is low)

# --- 1. DIVERSE DEVICE POOL (Real UA Strings) ---
# We use a list of common real-world User Agents to prevent overfitting
REAL_USER_AGENTS = {
    "Windows": [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59",
        "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" # Windows 7
    ],
    "MacOS": [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15"
    ],
    "Linux": [
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36",
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0"
    ],
    "iOS": [
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
    ],
    "Android": [
        "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
    ]
}

RESOLUTIONS = ["1920x1080", "1366x768", "1440x900", "1536x864", "2560x1440", "390x844", "414x896"]

# --- 2. GENERATE USER PROFILES ---
user_db = {}
for i in range(NUM_USERS):
    user_id = f"user_{i+1:03d}"
    
    # Randomize Home Location (Not just US - Diversity!)
    home_country = random.choice(['US', 'GB', 'DE', 'FR', 'IN', 'CA', 'AU'])
    local = fake.local_latlng(country_code=home_country)
    
    # Assign a "Primary" OS and Browser (Users tend to stick to one ecosystem)
    primary_os = random.choice(list(REAL_USER_AGENTS.keys()))
    primary_ua = random.choice(REAL_USER_AGENTS[primary_os])
    
    user_db[user_id] = {
        "home_country": home_country,
        "home_city": local[2],
        "home_lat": float(local[0]),
        "home_lon": float(local[1]),
        "usual_os": primary_os,
        "usual_ua": primary_ua,
        "usual_res": random.choice(RESOLUTIONS),
        "avg_txn": random.randint(20, 1000),
        "avg_typing_speed": random.uniform(0.15, 0.35) # Seconds per key (Human range)
    }

# --- 3. GENERATE LOGS ---
data_login, data_behavior, data_transaction, data_network = [], [], [], []

print(f"Generating data for {NUM_USERS} users...")

start_date = datetime.now() - timedelta(days=DAYS_OF_DATA)

# Iterate through users and time
for user_id in user_db:
    profile = user_db[user_id]
    current_time = start_date
    
    while current_time < datetime.now():
        login_id = fake.uuid4()
        is_attack = random.random() < ANOMALY_RATE
        
        # ==========================================
        # MODULE 1: LOGIN (The Gatekeeper)
        # ==========================================
        
        # Scenario A: Attack (The "Hacker")
        if is_attack:
            # 50% chance it's a "Script Kiddie" (Linux/Bot UA)
            if random.random() > 0.5:
                ua_string = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" # Bot
                os_type = "Bot"
                res = "800x600"
            else:
                # 50% chance it's a standard hacker (Using random Windows UA)
                os_type = "Windows"
                ua_string = random.choice(REAL_USER_AGENTS["Windows"])
                res = "1024x768"

            # Location spoofing (Impossible Travel)
            country = random.choice(['RU', 'CN', 'KP', 'BR', 'NG'])
            city = fake.city()
            login_status = random.choice(["Failed", "Failed", "Success"]) # Hackers fail often
            auth_method = "Password"

        # Scenario B: Legitimate User (The "Human")
        else:
            # 90% chance they use their main device, 10% chance they use a secondary one (e.g., phone)
            if random.random() > 0.9:
                # Secondary device (Valid behavior, don't flag as attack!)
                os_type = "iOS" if profile["usual_os"] != "iOS" else "Windows"
                ua_string = random.choice(REAL_USER_AGENTS[os_type])
                res = "390x844" if os_type == "iOS" else "1920x1080"
            else:
                # Primary device
                os_type = profile["usual_os"]
                ua_string = profile["usual_ua"]
                res = profile["usual_res"]

            country = profile["home_country"]
            city = profile["home_city"]
            login_status = "Success"
            auth_method = "Biometric" if os_type in ["iOS", "Android"] else "Password"

        data_login.append({
            "login_id": login_id,
            "user_id": user_id,
            "timestamp": current_time,
            "country": country,
            "city": city,
            "user_agent": ua_string,      # REAL DATA
            "os": os_type,
            "resolution": res,
            "login_status": login_status,
            "auth_method": auth_method,
            "is_anomaly": 1 if is_attack else 0
        })

        # ==========================================
        # MODULE 2: BEHAVIOR (The Human Element)
        # ==========================================
        
        if is_attack:
            # Bot behavior: Perfect, consistent, fast
            mouse_speed = random.randint(4000, 8000) # Super fast
            keystroke = 0.005 # Machine speed
            entropy = 0.1 # Low entropy (repetitive actions)
        else:
            # Human behavior: Messy, slow, inconsistent
            mouse_speed = int(np.random.normal(300, 100)) # Normal speed
            keystroke = np.random.normal(profile["avg_typing_speed"], 0.05)
            entropy = random.uniform(0.6, 0.95) # High entropy (random clicks)

        data_behavior.append({
            "login_id": login_id,
            "user_id": user_id,
            "mouse_velocity_px_sec": abs(mouse_speed),
            "avg_keystroke_delay": abs(round(keystroke, 4)),
            "session_entropy": round(entropy, 2),
            "tab_switch_count": random.randint(0, 10)
        })

        # ==========================================
        # MODULE 3: NETWORK (The Wire)
        # ==========================================
        
        if is_attack:
            # Exfiltration or Scanning
            bytes_out = random.randint(10_000_000, 100_000_000) # 10MB+
            port = random.choice([21, 22, 3389]) # FTP, SSH, RDP
            protocol = "UDP" # Fast transfer
        else:
            # Normal Browsing
            bytes_out = random.randint(1000, 150000) # KB range
            port = 443 # HTTPS
            protocol = "TCP"

        data_network.append({
            "login_id": login_id,
            "user_id": user_id,
            "bytes_sent": bytes_out,
            "destination_port": port,
            "protocol": protocol,
            "packet_loss_rate": round(random.uniform(0, 0.05), 3)
        })

        # Advance time (Randomize next login time between 4 hours and 3 days)
        current_time += timedelta(hours=random.randint(4, 72))

# --- SAVE FILES ---
df_login = pd.DataFrame(data_login)
df_behav = pd.DataFrame(data_behavior)
df_txn = pd.DataFrame(data_transaction)
df_net = pd.DataFrame(data_network)

df_login.to_csv("log_login_500users.csv", index=False)
df_behav.to_csv("log_behavior_500users.csv", index=False)
df_net.to_csv("log_network_500users.csv", index=False)

print(f"DONE. Generated 3 CSVs.")
print(f"Total Logins: {len(df_login)}")
print(f"Attacks Simulated: {df_login['is_anomaly'].sum()}")