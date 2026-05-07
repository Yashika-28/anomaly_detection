import datetime
from datetime import timedelta
import asyncio

# Import your manager, but mock it if running standalone
try:
    from main import manager
except ImportError:
    class MockManager:
        async def broadcast_to_soc(self, data):
            print(f"BROADCAST: {data['username']} - {data['time']}")
    manager = MockManager()

async def generate_sample_logs():
    # 10 Hardcoded, highly realistic scenarios to cycle through.
    # This guarantees your demo looks professional and consistent.
    TEMPLATES = [
        {"username": "priyanshi", "os": "Windows 11", "ip": "192.168.1.15", "lat": 28.6139, "lon": 77.2090, "apps": "Chrome, Outlook", "attempts": 1, "delay": 0.12, "mouse": 1200, "tabs": 1, "bytes": 1500000, "status": "SAFE (Authenticated)", "color": "#16a34a", "score": 0.12},
        {"username": "archit", "os": "Kali Linux", "ip": "185.15.56.22", "lat": 55.7558, "lon": 37.6173, "apps": "Tor, nmap, Wireshark", "attempts": 1, "delay": 0.02, "mouse": 6000, "tabs": 0, "bytes": 85000000, "status": "CRITICAL ANOMALY (Blocked)", "color": "#dc2626", "score": 0.95},
        {"username": "anamika", "os": "macOS Sonoma", "ip": "192.168.1.42", "lat": 12.9716, "lon": 77.5946, "apps": "Slack, Spotify", "attempts": 1, "delay": 0.15, "mouse": 1500, "tabs": 12, "bytes": 5000000, "status": "WARNING (Distracted User)", "color": "#f59e0b", "score": 0.55},
        {"username": "alice_wong", "os": "Windows 11", "ip": "192.168.1.88", "lat": 37.7749, "lon": -122.4194, "apps": "VS Code, Terminal", "attempts": 6, "delay": 0.11, "mouse": 1100, "tabs": 2, "bytes": 2000000, "status": "WARNING (MFA Triggered)", "color": "#f59e0b", "score": 0.65},
        {"username": "akshi", "os": "Ubuntu 22.04", "ip": "192.168.1.95", "lat": 28.5355, "lon": 77.3910, "apps": "Chrome, Excel", "attempts": 1, "delay": 0.18, "mouse": 900, "tabs": 1, "bytes": 1200000, "status": "SAFE (Authenticated)", "color": "#16a34a", "score": 0.10},
        {"username": "priyanshi", "os": "macOS Sonoma", "ip": "192.168.1.110", "lat": 19.0760, "lon": 72.8777, "apps": "Chrome, Slack", "attempts": 1, "delay": 0.14, "mouse": 1350, "tabs": 3, "bytes": 2500000, "status": "SAFE (Authenticated)", "color": "#16a34a", "score": 0.18},
        {"username": "unknown_hacker", "os": "Parrot OS", "ip": "103.45.67.89", "lat": 39.9042, "lon": 116.4074, "apps": "Metasploit, Netcat", "attempts": 12, "delay": 0.01, "mouse": 8000, "tabs": 0, "bytes": 150000000, "status": "CRITICAL ANOMALY (Blocked)", "color": "#dc2626", "score": 0.99},
        {"username": "archit", "os": "Windows 11", "ip": "192.168.1.16", "lat": 28.6139, "lon": 77.2090, "apps": "Chrome, YouTube", "attempts": 1, "delay": 0.16, "mouse": 1800, "tabs": 15, "bytes": 12000000, "status": "WARNING (Distracted User)", "color": "#f59e0b", "score": 0.45},
        {"username": "alice_wong", "os": "macOS Sonoma", "ip": "192.168.1.88", "lat": 37.7749, "lon": -122.4194, "apps": "Safari, Slack", "attempts": 1, "delay": 0.13, "mouse": 1150, "tabs": 2, "bytes": 1800000, "status": "SAFE (Authenticated)", "color": "#16a34a", "score": 0.15},
        {"username": "anamika", "os": "Windows 11", "ip": "185.20.10.5", "lat": 51.5072, "lon": -0.1276, "apps": "Hydra, Burp", "attempts": 8, "delay": 0.05, "mouse": 3500, "tabs": 0, "bytes": 45000000, "status": "WARNING (MFA Triggered)", "color": "#f59e0b", "score": 0.85}
    ]

    # Exact time offsets in minutes mapped out to guarantee logs land in the specific dashboard widgets.
    # Total = 45 logs.
    OFFSETS_MINUTES = [
        # Last 1 Hour (5 logs - spaced by minutes)
        2, 12, 25, 40, 55,
        # Last 24 Hours (10 logs - spaced by hours)
        90, 180, 300, 450, 600, 750, 900, 1050, 1200, 1350,
        # Last 7 Days (15 logs - spaced by half days)
        1500, 2000, 2800, 3500, 4300, 5000, 5700, 6500, 7200, 7900, 8600, 9000, 9500, 10000, 10050,
        # Last 30 Days (15 logs - spaced by days)
        11000, 13000, 15000, 18000, 21000, 24000, 27000, 30000, 33000, 36000, 38000, 40000, 41000, 42000, 43000
    ]

    now = datetime.datetime.now()

    for i, offset in enumerate(OFFSETS_MINUTES):
        # Pick a template (cycles 1 through 10 repeatedly)
        t = TEMPLATES[i % len(TEMPLATES)]
        
        # Dynamically shift the time into the past based on the offset
        log_time = now - timedelta(minutes=offset)
        
        # Use a standard format that UI dashboards easily parse for charts/graphs
        formatted_time = log_time.strftime('%Y-%m-%d %H:%M:%S')

        log_data = {
            'type': 'SAMPLE_LOG_' + str(i+1).zfill(2),
            'username': t["username"],
            'ip_address': t["ip"],
            'lat': t["lat"],
            'lon': t["lon"],
            'os': t["os"],
            'resolution': "1920x1080" if i % 2 == 0 else "2560x1440",
            'avg_keystroke_delay': t["delay"],
            'mouse_velocity': t["mouse"],
            'tab_switch_count': t["tabs"],
            'active_processes': t["apps"],
            'bytes_sent': t["bytes"],
            'attempts': t["attempts"],
            'risk_status': f'{t["status"]} | Log #{i+1}',
            'color': t["color"],
            'time': formatted_time,               # The dynamically adjusted text string
            'timestamp': log_time.isoformat(),    # Added standard ISO format just in case frontend needs it
            'protocol': 'HTTPS' if i % 2 == 0 else 'TCP',
            'threat_score': t["score"]
        }
        
        await manager.broadcast_to_soc(log_data)
        
        # IMPORTANT: The asyncio.sleep(0.05) has been removed here. 
        # This solves the issue of the dashboard "typing out" slowly in front of the user when refreshed.
        # Now, all 45 items are blasted over the websocket instantly.

if __name__ == '__main__':
    asyncio.run(generate_sample_logs())