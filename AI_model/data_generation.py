"""
Unified Anomaly Detection Data Generator
=========================================
Generates a single CSV with columns that exactly mirror the `sessions` DB table.

Design Principles:
- Per-user stable features: os, resolution, hour_of_day, day_of_week, country (used for
  location-based anomaly detection — a user's routine doesn't change much day-to-day)
- Global bot-detection signals (NOT per-user): avg_keystroke_delay, mouse_velocity,
  tab_switch_count — these are population-level indicators of bot vs. human behaviour.
  Bots always have unnaturally low delays / high velocity, regardless of who the user is.
- Network volume: bytes_sent, bytes_received — global signals for data exfiltration
- Contextual flags: is_unknown_location, has_hacker_tools, attempts
"""

import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

np.random.seed(42)
random.seed(42)

# ─── CONFIG ────────────────────────────────────────────────────────────────────
NUM_USERS = 600
SESSIONS_PER_USER_MIN = 40
SESSIONS_PER_USER_MAX = 120
ANOMALY_RATE = 0.08      # 8% of sessions are attacks/bots

OS_OPTIONS = ["Windows 11", "Windows 10", "macOS Sonoma", "macOS Ventura",
              "Ubuntu 22.04", "Kali Linux", "Fedora 39"]
RESOLUTION_OPTIONS = ["1920x1080", "2560x1440", "1366x768", "2880x1800",
                      "3840x2160", "1280x800"]
COUNTRIES_NORMAL = ["India", "US", "Germany", "UK", "Singapore",
                    "France", "Australia", "Canada"]
COUNTRIES_ATTACK = ["China", "Russia", "North Korea", "Iran", "Unknown"]

HACKER_TOOLS = ["Tor", "Wireshark", "nmap", "Burp", "Hydra",
                "Metasploit", "Netcat", "Mimikatz", "sqlmap"]
NORMAL_PROCESSES = ["Chrome", "Outlook", "Slack", "Zoom", "VSCode",
                    "Word", "Excel", "Firefox", "Terminal"]

# ─── PER-USER STABLE PROFILE ───────────────────────────────────────────────────
def user_profile():
    """
    Stable characteristics a real user maintains across sessions.
    Bot/behavioural signals are NOT stored here — they're global anomaly features.
    """
    return {
        "home_country":  random.choices(COUNTRIES_NORMAL, weights=[0.4, 0.2, 0.1, 0.1, 0.05, 0.05, 0.05, 0.05])[0],
        "preferred_os":  random.sample(OS_OPTIONS[:5], k=random.randint(1, 2)),  # normal OSes only
        "resolution":    random.choice(RESOLUTION_OPTIONS),
        "typical_hours": sorted(random.sample(range(7, 23), k=4)),  # 4 hours they usually work
    }

# ─── MAIN GENERATION LOOP ──────────────────────────────────────────────────────
rows = []
session_id = 1

for user_id in range(1, NUM_USERS + 1):
    profile = user_profile()
    n_sessions = random.randint(SESSIONS_PER_USER_MIN, SESSIONS_PER_USER_MAX)

    for _ in range(n_sessions):
        is_anomaly = int(np.random.rand() < ANOMALY_RATE)

        # ── Timestamp ──
        base = datetime.now() - timedelta(days=random.randint(0, 180))
        if not is_anomaly:
            hour = random.choice(profile["typical_hours"])
        else:
            hour = random.choice([0, 1, 2, 3, 23, 22])  # odd hours for attackers
        ts = base.replace(hour=hour, minute=random.randint(0, 59),
                          second=random.randint(0, 59))

        hour_of_day = ts.hour
        day_of_week = ts.weekday()  # 0=Mon ... 6=Sun

        # ── Location & OS ──
        if not is_anomaly:
            country = profile["home_country"]
            os_used = random.choice(profile["preferred_os"])
            resolution = profile["resolution"]
            is_unknown_location = 0
            attempts = random.choices([1, 2, 3], weights=[0.8, 0.15, 0.05])[0]
        else:
            country = random.choice(COUNTRIES_ATTACK)
            os_used = random.choice(["Kali Linux", "Windows 10", "Unknown OS"])
            resolution = random.choice(["800x600", "1024x768", "1920x1080"])
            is_unknown_location = 1
            attempts = random.choices([1, 2, 4, 5, 6, 7, 10],
                                      weights=[0.05, 0.05, 0.15, 0.2, 0.2, 0.2, 0.15])[0]

        # ── Global Bot-Detection Signals (population-level, NOT per-user) ──
        # Normal humans: delay ~0.1-0.25s, velocity ~200-800px/s, some tab switches
        # Bots/tools: delay <0.02s, velocity >3000px/s, near-zero tab switches
        if not is_anomaly:
            avg_keystroke_delay = np.random.normal(0.18, 0.06)
            avg_keystroke_delay = float(np.clip(avg_keystroke_delay, 0.05, 0.6))
            mouse_velocity      = np.random.normal(450, 120)
            mouse_velocity      = float(np.clip(mouse_velocity, 80, 1200))
            tab_switch_count    = int(np.clip(np.random.poisson(3), 0, 15))
        else:
            # Bots or automated tools
            avg_keystroke_delay = float(np.random.uniform(0.001, 0.025))
            mouse_velocity      = float(np.random.uniform(3500, 9000))
            tab_switch_count    = int(random.choices([0, 1], weights=[0.85, 0.15])[0])

        # ── Network ──
        if not is_anomaly:
            bytes_sent      = int(np.random.normal(8_000, 3_000))
            bytes_sent      = max(500, bytes_sent)
            bytes_received  = int(np.random.normal(50_000, 20_000))
            bytes_received  = max(500, bytes_received)
        else:
            bytes_sent      = int(np.random.uniform(50_000_000, 2_000_000_000))  # large exfil
            bytes_received  = int(np.random.normal(5_000, 2_000))

        # ── Active Processes / Hacker Tools ──
        if not is_anomaly:
            procs = random.sample(NORMAL_PROCESSES, k=random.randint(2, 5))
            has_hacker_tools = 0
        else:
            n_tools = random.randint(1, 4)
            procs = random.sample(HACKER_TOOLS, k=n_tools) + \
                    random.sample(NORMAL_PROCESSES, k=random.randint(0, 2))
            has_hacker_tools = 1

        active_processes = ", ".join(procs)

        # ── Assemble Row ──
        rows.append({
            "session_id":           session_id,
            "user_id":              user_id,
            "timestamp":            ts.isoformat(),
            "hour_of_day":          hour_of_day,
            "day_of_week":          day_of_week,
            "country":              country,
            "os":                   os_used,
            "resolution":           resolution,
            "attempts":             attempts,
            "is_unknown_location":  is_unknown_location,
            # Global bot-detection signals (not per-user)
            "avg_keystroke_delay":  round(avg_keystroke_delay, 4),
            "mouse_velocity":       round(mouse_velocity, 2),
            "tab_switch_count":     tab_switch_count,
            # Network
            "bytes_sent":           bytes_sent,
            "bytes_received":       bytes_received,
            "has_hacker_tools":     has_hacker_tools,
            "active_processes":     active_processes,
            # Ground truth
            "is_anomaly":           is_anomaly,
        })
        session_id += 1

# ─── SAVE ──────────────────────────────────────────────────────────────────────
df = pd.DataFrame(rows)
out_path = os.path.join(os.path.dirname(__file__), "log_unified_sessions.csv")
df.to_csv(out_path, index=False)

normal_count  = (df["is_anomaly"] == 0).sum()
anomaly_count = (df["is_anomaly"] == 1).sum()
print(f"✅ Unified dataset generated: {len(df):,} sessions")
print(f"   Normal : {normal_count:,} ({100*normal_count/len(df):.1f}%)")
print(f"   Anomaly: {anomaly_count:,} ({100*anomaly_count/len(df):.1f}%)")
print(f"   Saved  : {out_path}")