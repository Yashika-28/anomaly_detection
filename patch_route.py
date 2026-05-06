import re
import json
import random
import time

route_file = '/home/nischal-sharma/anomaly_detection/web_app/Frontend/app/api/db/route.ts'

with open(route_file, 'r') as f:
    content = f.read()

start_idx = content.find('sessions: [')
if start_idx == -1:
    print("Could not find sessions array")
    exit(1)

end_idx = content.find('    };\n}', start_idx)
if end_idx == -1:
    end_idx = content.find('    };\n}', start_idx - 100)

if end_idx == -1:
    brackets = 0
    in_sessions = False
    for i in range(start_idx, len(content)):
        if content[i] == '[':
            brackets += 1
            in_sessions = True
        elif content[i] == ']':
            brackets -= 1
        
        if in_sessions and brackets == 0:
            end_idx = i + 1
            break

if end_idx == -1:
    print("Could not find end of sessions array")
    exit(1)

users = ["priyanshi", "anamika", "akshi", "archit", "alice_wong"]
statuses = [["SAFE"], ["ANOMALY_BOT"], ["ANOMALY_BOT", "BRUTE_FORCE"], ["SAFE"], ["UNKNOWN_LOCATION"]]

now = int(time.time() * 1000)

new_sessions = []
for i in range(45):
    u = random.choice(users)
    risk = random.choice(statuses)
    is_safe = "SAFE" in risk
    attempts = 1 if is_safe else random.randint(2, 6)
    
    tel = {
        "ip_address": f"192.168.{random.randint(1, 5)}.{random.randint(1, 255)}",
        "lat": round(random.uniform(20.0, 50.0), 4),
        "lon": round(random.uniform(-120.0, 120.0), 4),
        "os": random.choice(["Windows 11", "macOS Sonoma", "Ubuntu 22.04", "Kali Linux"]),
        "resolution": random.choice(["1920x1080", "2560x1440", "2880x1800"]),
        "avg_keystroke_delay": round(random.uniform(0.1, 0.2) if is_safe else random.uniform(0.001, 0.05), 3),
        "mouse_velocity": random.randint(500, 1200) if is_safe else random.randint(3000, 9000),
        "tab_switch_count": random.randint(0, 2) if is_safe else random.randint(3, 15),
        "active_processes": "Chrome, Outlook" if is_safe else "Tor, nmap, Wireshark",
        "bytes_sent": random.randint(5000000, 20000000) if is_safe else random.randint(100000000, 3000000000),
        "risk_status": risk
    }
    
    session_time = now - (i * 1000 * 60 * random.randint(5, 60))
    
    tel_str = json.dumps(tel, indent=20)
    
    session_str = f"""            {{
                id: "{u}-" + ({session_time}),
                username: "{u}",
                attempts: {attempts},
                telemetry: {tel_str.strip()},
                timestamp: new Date({session_time}).toISOString()
            }}"""
    
    new_sessions.append(session_str)

sessions_code = "sessions: [\n" + ",\n".join(new_sessions) + "\n        ]"

new_content = content[:start_idx] + sessions_code + content[end_idx:]

with open(route_file, 'w') as f:
    f.write(new_content)

print("Successfully replaced sessions!")
