import { NextResponse } from 'next/server';

// In-memory mock DB for Vercel prototyping
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalDb: any = globalThis as any;

// Per-user trusted location check (each user has their own trusted locations stored in the DB)
const TRUST_RADIUS_KM = 200; // km

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isUserTrustedLocation(lat: number, lon: number, trusted: { lat: number; lon: number }[]): boolean {
    if (!lat && !lon) return true; // no location data — can't judge
    if (!trusted || trusted.length === 0) return true; // no list configured — allow
    return trusted.some(t => haversineKm(lat, lon, t.lat, t.lon) <= TRUST_RADIUS_KM);
}

if (!globalDb.mockDb) {
    globalDb.mockDb = {
        users: {
            "priyanshi": {
                password: "password123",
                email: "priyanshi22csu393@ncuinda.edu",
                attempts: 0,
                trustedLocations: [
                    { lat: 48.8566, lon: 2.3522, label: "Paris (Home)" },
                    { lat: 51.5074, lon: -0.1278, label: "London (Office)" },
                    { lat: 50.1109, lon: 8.6821, label: "Frankfurt (Travel)" }
                ],
                telemetry: {
                    ip_address: "192.168.1.15",
                    lat: 48.8566,
                    lon: 2.3522,
                    os: "macOS Sonoma",
                    resolution: "2880x1800",
                    avg_keystroke_delay: 0.12,
                    mouse_velocity: 840,
                    tab_switch_count: 0,
                    active_processes: "Outlook, Excel, Chrome",
                    bytes_sent: 14000000,
                    risk_status: ["SAFE"]
                }
            },
            "anamika": {
                password: "admin_password",
                email: "anamika22csu015@ncuindia.edu",
                attempts: 0,
                trustedLocations: [
                    { lat: 34.0522, lon: -118.2437, label: "Los Angeles (HQ)" },
                    { lat: 37.7749, lon: -122.4194, label: "San Francisco (DC)" }
                ],
                telemetry: {
                    ip_address: "10.0.0.84",
                    lat: 34.0522,
                    lon: -118.2437,
                    os: "Kali Linux / Headless",
                    resolution: "1920x1080",
                    avg_keystroke_delay: 0.005,
                    mouse_velocity: 5200,
                    tab_switch_count: 5,
                    active_processes: "Tor Browser, Wireshark, Cmd.exe",
                    bytes_sent: 1800000000,
                    risk_status: ["ANOMALY_BOT"]
                }
            },
            "akshi": {
                password: "secure456",
                email: "akshi22csu412@ncuindia.edu",
                attempts: 0,
                trustedLocations: [
                    { lat: 40.7128, lon: -74.006, label: "New York (Home)" },
                    { lat: 42.3601, lon: -71.0589, label: "Boston (Office)" }
                ],
                telemetry: {
                    ip_address: "192.168.1.15",
                    lat: 40.7128,
                    lon: -74.0060,
                    os: "Windows 11",
                    resolution: "1920x1080",
                    avg_keystroke_delay: 0.15,
                    mouse_velocity: 600,
                    tab_switch_count: 1,
                    active_processes: "Outlook, Teams, Chrome",
                    bytes_sent: 5000000,
                    risk_status: ["SAFE"]
                }
            },
            "archit": {
                password: "archit@456",
                email: "archit22csu025@ncuindia.edu",
                attempts: 0,
                trustedLocations: [
                    { lat: 28.6139, lon: 77.2090, label: "Delhi (Home)" },
                    { lat: 28.4595, lon: 77.0266, label: "Gurugram (Office)" }
                ],
                telemetry: {
                    ip_address: "192.168.2.10",
                    lat: 28.6139,
                    lon: 77.2090,
                    os: "Windows 11",
                    resolution: "1920x1080",
                    avg_keystroke_delay: 0.13,
                    mouse_velocity: 720,
                    tab_switch_count: 0,
                    active_processes: "VS Code, Chrome, Terminal",
                    bytes_sent: 8000000,
                    risk_status: ["SAFE"]
                }
            },
            "alice_wong": {
                password: "pass789",
                email: "nischalsharma2037@gmail.com",
                attempts: 6,
                trustedLocations: [
                    { lat: 1.3521, lon: 103.8198, label: "Singapore (Home)" },
                    { lat: 22.3193, lon: 114.1694, label: "Hong Kong (Office)" },
                    { lat: 35.6762, lon: 139.6503, label: "Tokyo (Client)" }
                ],
                telemetry: {
                    ip_address: "10.0.0.84",
                    lat: 55.7558,
                    lon: 37.6173,
                    os: "Ubuntu 22.04",
                    resolution: "2560x1440",
                    avg_keystroke_delay: 0.008,
                    mouse_velocity: 7200,
                    tab_switch_count: 8,
                    active_processes: "Tor Browser, nmap, Python3",
                    bytes_sent: 2500000000,
                    risk_status: ["ANOMALY_BOT"]
                }
            }
        },
        sessions: [
            {
                id: "akshi-" + (1777912418281),
                username: "akshi",
                attempts: 5,
                telemetry: {
                    "ip_address": "192.168.3.27",
                    "lat": 32.2595,
                    "lon": -44.5234,
                    "os": "Windows 11",
                    "resolution": "1920x1080",
                    "avg_keystroke_delay": 0.044,
                    "mouse_velocity": 8090,
                    "tab_switch_count": 10,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 293927426,
                    "risk_status": [
                        "ANOMALY_BOT",
                        "BRUTE_FORCE"
                    ]
                },
                timestamp: new Date(1777912418281).toISOString()
            },
            {
                id: "archit-" + (1777910918281),
                username: "archit",
                attempts: 2,
                telemetry: {
                    "ip_address": "192.168.2.32",
                    "lat": 34.5489,
                    "lon": 114.189,
                    "os": "Windows 11",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.045,
                    "mouse_velocity": 4431,
                    "tab_switch_count": 6,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 288212017,
                    "risk_status": [
                        "ANOMALY_BOT"
                    ]
                },
                timestamp: new Date(1777910918281).toISOString()
            },
            {
                id: "anamika-" + (1777907978281),
                username: "anamika",
                attempts: 6,
                telemetry: {
                    "ip_address": "192.168.4.196",
                    "lat": 44.8511,
                    "lon": 4.5859,
                    "os": "Windows 11",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.002,
                    "mouse_velocity": 4199,
                    "tab_switch_count": 3,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 852903043,
                    "risk_status": [
                        "ANOMALY_BOT"
                    ]
                },
                timestamp: new Date(1777907978281).toISOString()
            },
            {
                id: "akshi-" + (1777907198281),
                username: "akshi",
                attempts: 5,
                telemetry: {
                    "ip_address": "192.168.5.25",
                    "lat": 42.45,
                    "lon": 109.0013,
                    "os": "Ubuntu 22.04",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.047,
                    "mouse_velocity": 8266,
                    "tab_switch_count": 4,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 1049800047,
                    "risk_status": [
                        "UNKNOWN_LOCATION"
                    ]
                },
                timestamp: new Date(1777907198281).toISOString()
            },
            {
                id: "priyanshi-" + (1777902098281),
                username: "priyanshi",
                attempts: 2,
                telemetry: {
                    "ip_address": "192.168.4.3",
                    "lat": 34.58,
                    "lon": 8.5128,
                    "os": "Kali Linux",
                    "resolution": "1920x1080",
                    "avg_keystroke_delay": 0.021,
                    "mouse_velocity": 6682,
                    "tab_switch_count": 12,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 148678066,
                    "risk_status": [
                        "ANOMALY_BOT"
                    ]
                },
                timestamp: new Date(1777902098281).toISOString()
            },
            {
                id: "archit-" + (1777906418281),
                username: "archit",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.3.74",
                    "lat": 45.3114,
                    "lon": -87.2584,
                    "os": "Kali Linux",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.103,
                    "mouse_velocity": 744,
                    "tab_switch_count": 0,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 14308712,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777906418281).toISOString()
            },
            {
                id: "anamika-" + (1777904138281),
                username: "anamika",
                attempts: 6,
                telemetry: {
                    "ip_address": "192.168.4.10",
                    "lat": 34.6173,
                    "lon": 61.5779,
                    "os": "Windows 11",
                    "resolution": "1920x1080",
                    "avg_keystroke_delay": 0.043,
                    "mouse_velocity": 5505,
                    "tab_switch_count": 7,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 2159292110,
                    "risk_status": [
                        "ANOMALY_BOT",
                        "BRUTE_FORCE"
                    ]
                },
                timestamp: new Date(1777904138281).toISOString()
            },
            {
                id: "archit-" + (1777896878281),
                username: "archit",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.1.184",
                    "lat": 24.545,
                    "lon": -98.1664,
                    "os": "macOS Sonoma",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.159,
                    "mouse_velocity": 787,
                    "tab_switch_count": 1,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 18180094,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777896878281).toISOString()
            },
            {
                id: "archit-" + (1777883618281),
                username: "archit",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.1.126",
                    "lat": 44.5572,
                    "lon": -82.1449,
                    "os": "macOS Sonoma",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.117,
                    "mouse_velocity": 766,
                    "tab_switch_count": 2,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 15329354,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777883618281).toISOString()
            },
            {
                id: "priyanshi-" + (1777904318281),
                username: "priyanshi",
                attempts: 2,
                telemetry: {
                    "ip_address": "192.168.5.120",
                    "lat": 25.5945,
                    "lon": -74.5369,
                    "os": "Windows 11",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.025,
                    "mouse_velocity": 7007,
                    "tab_switch_count": 4,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 1212569827,
                    "risk_status": [
                        "ANOMALY_BOT"
                    ]
                },
                timestamp: new Date(1777904318281).toISOString()
            },
            {
                id: "archit-" + (1777896218281),
                username: "archit",
                attempts: 2,
                telemetry: {
                    "ip_address": "192.168.1.233",
                    "lat": 25.0306,
                    "lon": -73.3638,
                    "os": "macOS Sonoma",
                    "resolution": "1920x1080",
                    "avg_keystroke_delay": 0.041,
                    "mouse_velocity": 4444,
                    "tab_switch_count": 8,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 2273528060,
                    "risk_status": [
                        "ANOMALY_BOT",
                        "BRUTE_FORCE"
                    ]
                },
                timestamp: new Date(1777896218281).toISOString()
            },
            {
                id: "priyanshi-" + (1777908458281),
                username: "priyanshi",
                attempts: 4,
                telemetry: {
                    "ip_address": "192.168.4.113",
                    "lat": 46.58,
                    "lon": 91.4921,
                    "os": "Kali Linux",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.01,
                    "mouse_velocity": 8298,
                    "tab_switch_count": 13,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 2613824535,
                    "risk_status": [
                        "ANOMALY_BOT"
                    ]
                },
                timestamp: new Date(1777908458281).toISOString()
            },
            {
                id: "akshi-" + (1777887218281),
                username: "akshi",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.2.40",
                    "lat": 34.6075,
                    "lon": 42.968,
                    "os": "Windows 11",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.198,
                    "mouse_velocity": 1015,
                    "tab_switch_count": 0,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 5589093,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777887218281).toISOString()
            },
            {
                id: "archit-" + (1777892918281),
                username: "archit",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.5.201",
                    "lat": 43.7816,
                    "lon": 22.3767,
                    "os": "Kali Linux",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.109,
                    "mouse_velocity": 1166,
                    "tab_switch_count": 2,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 15745311,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777892918281).toISOString()
            },
            {
                id: "priyanshi-" + (1777897298281),
                username: "priyanshi",
                attempts: 6,
                telemetry: {
                    "ip_address": "192.168.3.123",
                    "lat": 39.0445,
                    "lon": -89.746,
                    "os": "Windows 11",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.017,
                    "mouse_velocity": 4064,
                    "tab_switch_count": 4,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 1737865793,
                    "risk_status": [
                        "UNKNOWN_LOCATION"
                    ]
                },
                timestamp: new Date(1777897298281).toISOString()
            },
            {
                id: "anamika-" + (1777884518281),
                username: "anamika",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.2.164",
                    "lat": 31.762,
                    "lon": -110.0706,
                    "os": "Windows 11",
                    "resolution": "1920x1080",
                    "avg_keystroke_delay": 0.148,
                    "mouse_velocity": 821,
                    "tab_switch_count": 2,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 13322820,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777884518281).toISOString()
            },
            {
                id: "akshi-" + (1777854818281),
                username: "akshi",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.3.75",
                    "lat": 27.138,
                    "lon": 112.497,
                    "os": "macOS Sonoma",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.155,
                    "mouse_velocity": 970,
                    "tab_switch_count": 1,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 5954797,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777854818281).toISOString()
            },
            {
                id: "alice_wong-" + (1777905278281),
                username: "alice_wong",
                attempts: 4,
                telemetry: {
                    "ip_address": "192.168.1.111",
                    "lat": 28.4985,
                    "lon": 63.5774,
                    "os": "macOS Sonoma",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.008,
                    "mouse_velocity": 4533,
                    "tab_switch_count": 5,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 1234015300,
                    "risk_status": [
                        "UNKNOWN_LOCATION"
                    ]
                },
                timestamp: new Date(1777905278281).toISOString()
            },
            {
                id: "anamika-" + (1777869218281),
                username: "anamika",
                attempts: 5,
                telemetry: {
                    "ip_address": "192.168.1.189",
                    "lat": 28.5559,
                    "lon": 7.7808,
                    "os": "Windows 11",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.036,
                    "mouse_velocity": 7480,
                    "tab_switch_count": 5,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 2266956842,
                    "risk_status": [
                        "ANOMALY_BOT"
                    ]
                },
                timestamp: new Date(1777869218281).toISOString()
            },
            {
                id: "akshi-" + (1777846298281),
                username: "akshi",
                attempts: 5,
                telemetry: {
                    "ip_address": "192.168.5.246",
                    "lat": 20.2817,
                    "lon": 74.8835,
                    "os": "Ubuntu 22.04",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.045,
                    "mouse_velocity": 6772,
                    "tab_switch_count": 12,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 1469198362,
                    "risk_status": [
                        "ANOMALY_BOT"
                    ]
                },
                timestamp: new Date(1777846298281).toISOString()
            },
            {
                id: "alice_wong-" + (1777864418281),
                username: "alice_wong",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.5.53",
                    "lat": 45.5172,
                    "lon": -23.4039,
                    "os": "Kali Linux",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.198,
                    "mouse_velocity": 1085,
                    "tab_switch_count": 2,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 10854390,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777864418281).toISOString()
            },
            {
                id: "archit-" + (1777885958281),
                username: "archit",
                attempts: 4,
                telemetry: {
                    "ip_address": "192.168.3.98",
                    "lat": 43.5446,
                    "lon": -8.6832,
                    "os": "Ubuntu 22.04",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.039,
                    "mouse_velocity": 7018,
                    "tab_switch_count": 7,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 380756032,
                    "risk_status": [
                        "UNKNOWN_LOCATION"
                    ]
                },
                timestamp: new Date(1777885958281).toISOString()
            },
            {
                id: "alice_wong-" + (1777847738281),
                username: "alice_wong",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.2.104",
                    "lat": 41.093,
                    "lon": -110.4215,
                    "os": "macOS Sonoma",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.158,
                    "mouse_velocity": 821,
                    "tab_switch_count": 2,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 16503382,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777847738281).toISOString()
            },
            {
                id: "archit-" + (1777873778281),
                username: "archit",
                attempts: 3,
                telemetry: {
                    "ip_address": "192.168.3.206",
                    "lat": 43.0606,
                    "lon": 50.3947,
                    "os": "macOS Sonoma",
                    "resolution": "1920x1080",
                    "avg_keystroke_delay": 0.017,
                    "mouse_velocity": 5341,
                    "tab_switch_count": 10,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 2894256594,
                    "risk_status": [
                        "UNKNOWN_LOCATION"
                    ]
                },
                timestamp: new Date(1777873778281).toISOString()
            },
            {
                id: "priyanshi-" + (1777838978281),
                username: "priyanshi",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.4.219",
                    "lat": 23.7859,
                    "lon": 93.3389,
                    "os": "Ubuntu 22.04",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.169,
                    "mouse_velocity": 688,
                    "tab_switch_count": 0,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 13249461,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777838978281).toISOString()
            },
            {
                id: "alice_wong-" + (1777843418281),
                username: "alice_wong",
                attempts: 5,
                telemetry: {
                    "ip_address": "192.168.3.45",
                    "lat": 20.4449,
                    "lon": -90.5306,
                    "os": "macOS Sonoma",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.025,
                    "mouse_velocity": 7561,
                    "tab_switch_count": 9,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 1193350395,
                    "risk_status": [
                        "ANOMALY_BOT",
                        "BRUTE_FORCE"
                    ]
                },
                timestamp: new Date(1777843418281).toISOString()
            },
            {
                id: "archit-" + (1777843778281),
                username: "archit",
                attempts: 2,
                telemetry: {
                    "ip_address": "192.168.4.232",
                    "lat": 24.6192,
                    "lon": 100.0302,
                    "os": "Ubuntu 22.04",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.014,
                    "mouse_velocity": 7747,
                    "tab_switch_count": 15,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 1780901370,
                    "risk_status": [
                        "UNKNOWN_LOCATION"
                    ]
                },
                timestamp: new Date(1777843778281).toISOString()
            },
            {
                id: "priyanshi-" + (1777871918281),
                username: "priyanshi",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.4.139",
                    "lat": 34.546,
                    "lon": -102.6066,
                    "os": "Ubuntu 22.04",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.126,
                    "mouse_velocity": 834,
                    "tab_switch_count": 0,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 6809031,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777871918281).toISOString()
            },
            {
                id: "priyanshi-" + (1777885538281),
                username: "priyanshi",
                attempts: 6,
                telemetry: {
                    "ip_address": "192.168.3.65",
                    "lat": 35.5105,
                    "lon": -44.6407,
                    "os": "macOS Sonoma",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.033,
                    "mouse_velocity": 3349,
                    "tab_switch_count": 4,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 184852206,
                    "risk_status": [
                        "ANOMALY_BOT",
                        "BRUTE_FORCE"
                    ]
                },
                timestamp: new Date(1777885538281).toISOString()
            },
            {
                id: "akshi-" + (1777853258281),
                username: "akshi",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.5.97",
                    "lat": 47.3566,
                    "lon": 28.6287,
                    "os": "Windows 11",
                    "resolution": "1920x1080",
                    "avg_keystroke_delay": 0.197,
                    "mouse_velocity": 575,
                    "tab_switch_count": 2,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 12627001,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777853258281).toISOString()
            },
            {
                id: "priyanshi-" + (1777822418281),
                username: "priyanshi",
                attempts: 6,
                telemetry: {
                    "ip_address": "192.168.5.154",
                    "lat": 39.0283,
                    "lon": 103.9101,
                    "os": "macOS Sonoma",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.033,
                    "mouse_velocity": 7744,
                    "tab_switch_count": 5,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 1396282534,
                    "risk_status": [
                        "ANOMALY_BOT",
                        "BRUTE_FORCE"
                    ]
                },
                timestamp: new Date(1777822418281).toISOString()
            },
            {
                id: "anamika-" + (1777888238281),
                username: "anamika",
                attempts: 4,
                telemetry: {
                    "ip_address": "192.168.2.172",
                    "lat": 22.4089,
                    "lon": 38.2777,
                    "os": "Ubuntu 22.04",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.049,
                    "mouse_velocity": 3773,
                    "tab_switch_count": 11,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 472719731,
                    "risk_status": [
                        "ANOMALY_BOT",
                        "BRUTE_FORCE"
                    ]
                },
                timestamp: new Date(1777888238281).toISOString()
            },
            {
                id: "priyanshi-" + (1777827938281),
                username: "priyanshi",
                attempts: 3,
                telemetry: {
                    "ip_address": "192.168.2.228",
                    "lat": 43.7981,
                    "lon": 19.7213,
                    "os": "Kali Linux",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.022,
                    "mouse_velocity": 6468,
                    "tab_switch_count": 7,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 2401303676,
                    "risk_status": [
                        "UNKNOWN_LOCATION"
                    ]
                },
                timestamp: new Date(1777827938281).toISOString()
            },
            {
                id: "alice_wong-" + (1777870838281),
                username: "alice_wong",
                attempts: 2,
                telemetry: {
                    "ip_address": "192.168.2.229",
                    "lat": 43.3777,
                    "lon": 8.361,
                    "os": "Ubuntu 22.04",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.033,
                    "mouse_velocity": 4755,
                    "tab_switch_count": 4,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 728579901,
                    "risk_status": [
                        "UNKNOWN_LOCATION"
                    ]
                },
                timestamp: new Date(1777870838281).toISOString()
            },
            {
                id: "priyanshi-" + (1777863458281),
                username: "priyanshi",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.5.21",
                    "lat": 47.9886,
                    "lon": 104.262,
                    "os": "Windows 11",
                    "resolution": "1920x1080",
                    "avg_keystroke_delay": 0.143,
                    "mouse_velocity": 619,
                    "tab_switch_count": 2,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 9487942,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777863458281).toISOString()
            },
            {
                id: "akshi-" + (1777885118281),
                username: "akshi",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.4.116",
                    "lat": 30.3327,
                    "lon": 20.8657,
                    "os": "Windows 11",
                    "resolution": "1920x1080",
                    "avg_keystroke_delay": 0.179,
                    "mouse_velocity": 955,
                    "tab_switch_count": 0,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 16239700,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777885118281).toISOString()
            },
            {
                id: "alice_wong-" + (1777832498281),
                username: "alice_wong",
                attempts: 3,
                telemetry: {
                    "ip_address": "192.168.2.113",
                    "lat": 35.9512,
                    "lon": 82.1896,
                    "os": "Windows 11",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.031,
                    "mouse_velocity": 8066,
                    "tab_switch_count": 12,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 2559081108,
                    "risk_status": [
                        "ANOMALY_BOT"
                    ]
                },
                timestamp: new Date(1777832498281).toISOString()
            },
            {
                id: "anamika-" + (1777896878281),
                username: "anamika",
                attempts: 6,
                telemetry: {
                    "ip_address": "192.168.2.85",
                    "lat": 46.9598,
                    "lon": 18.5965,
                    "os": "Windows 11",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.045,
                    "mouse_velocity": 3048,
                    "tab_switch_count": 10,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 969117792,
                    "risk_status": [
                        "ANOMALY_BOT"
                    ]
                },
                timestamp: new Date(1777896878281).toISOString()
            },
            {
                id: "anamika-" + (1777805258281),
                username: "anamika",
                attempts: 4,
                telemetry: {
                    "ip_address": "192.168.2.66",
                    "lat": 26.9194,
                    "lon": 106.5947,
                    "os": "macOS Sonoma",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.041,
                    "mouse_velocity": 5967,
                    "tab_switch_count": 3,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 2644152876,
                    "risk_status": [
                        "ANOMALY_BOT",
                        "BRUTE_FORCE"
                    ]
                },
                timestamp: new Date(1777805258281).toISOString()
            },
            {
                id: "archit-" + (1777846898281),
                username: "archit",
                attempts: 2,
                telemetry: {
                    "ip_address": "192.168.5.57",
                    "lat": 29.4282,
                    "lon": -47.9174,
                    "os": "Kali Linux",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.047,
                    "mouse_velocity": 8720,
                    "tab_switch_count": 7,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 275625721,
                    "risk_status": [
                        "UNKNOWN_LOCATION"
                    ]
                },
                timestamp: new Date(1777846898281).toISOString()
            },
            {
                id: "akshi-" + (1777773218281),
                username: "akshi",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.2.217",
                    "lat": 27.6862,
                    "lon": 103.1575,
                    "os": "Ubuntu 22.04",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.164,
                    "mouse_velocity": 877,
                    "tab_switch_count": 1,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 11373465,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777773218281).toISOString()
            },
            {
                id: "akshi-" + (1777880438281),
                username: "akshi",
                attempts: 1,
                telemetry: {
                    "ip_address": "192.168.3.254",
                    "lat": 33.3479,
                    "lon": 79.8222,
                    "os": "macOS Sonoma",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.196,
                    "mouse_velocity": 903,
                    "tab_switch_count": 1,
                    "active_processes": "Chrome, Outlook",
                    "bytes_sent": 9059610,
                    "risk_status": [
                        "SAFE"
                    ]
                },
                timestamp: new Date(1777880438281).toISOString()
            },
            {
                id: "alice_wong-" + (1777897298281),
                username: "alice_wong",
                attempts: 2,
                telemetry: {
                    "ip_address": "192.168.4.177",
                    "lat": 41.8872,
                    "lon": 69.253,
                    "os": "Windows 11",
                    "resolution": "2560x1440",
                    "avg_keystroke_delay": 0.025,
                    "mouse_velocity": 5817,
                    "tab_switch_count": 13,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 1440057960,
                    "risk_status": [
                        "ANOMALY_BOT",
                        "BRUTE_FORCE"
                    ]
                },
                timestamp: new Date(1777897298281).toISOString()
            },
            {
                id: "alice_wong-" + (1777850498281),
                username: "alice_wong",
                attempts: 6,
                telemetry: {
                    "ip_address": "192.168.4.247",
                    "lat": 42.5096,
                    "lon": -95.4972,
                    "os": "macOS Sonoma",
                    "resolution": "1920x1080",
                    "avg_keystroke_delay": 0.022,
                    "mouse_velocity": 4365,
                    "tab_switch_count": 6,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 636610320,
                    "risk_status": [
                        "ANOMALY_BOT",
                        "BRUTE_FORCE"
                    ]
                },
                timestamp: new Date(1777850498281).toISOString()
            },
            {
                id: "anamika-" + (1777772498281),
                username: "anamika",
                attempts: 4,
                telemetry: {
                    "ip_address": "192.168.4.109",
                    "lat": 47.5072,
                    "lon": -17.6943,
                    "os": "Ubuntu 22.04",
                    "resolution": "2880x1800",
                    "avg_keystroke_delay": 0.036,
                    "mouse_velocity": 8270,
                    "tab_switch_count": 6,
                    "active_processes": "Tor, nmap, Wireshark",
                    "bytes_sent": 556559519,
                    "risk_status": [
                        "ANOMALY_BOT",
                        "BRUTE_FORCE"
                    ]
                },
                timestamp: new Date(1777772498281).toISOString()
            }
        ]
    };
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { action, payload } = data;
        const db = globalDb.mockDb;

        if (action === "RECORD_LOGIN") {
            const { username, password, telemetry } = payload;

            if (!db.users[username]) {
                db.users[username] = { password, attempts: 1, telemetry };
            } else {
                db.users[username].telemetry = telemetry;
            }

            // Use the override if the injection slider was used (>1), otherwise use server-side count
            const overrideAttempts = telemetry?.login_attempts_override || 0;
            const attempts = overrideAttempts > 1 ? overrideAttempts : (db.users[username].attempts || 1);

            // Location trust check — use THIS user's own trusted locations
            const loginLat = telemetry?.lat || 0;
            const loginLon = telemetry?.lon || 0;
            const userTrusted = db.users[username]?.trustedLocations || [];
            if (!isUserTrustedLocation(loginLat, loginLon, userTrusted)) {
                if (Array.isArray(telemetry.risk_status)) {
                    if (!telemetry.risk_status.includes('unknown_location')) {
                        telemetry.risk_status.push('unknown_location');
                    }
                } else {
                    telemetry.risk_status = ['unknown_location'];
                }
            }

            const newSession = {
                id: `${username}-${Date.now()}`,
                username,
                attempts,
                telemetry,
                timestamp: new Date().toISOString()
            };

            const dbFingerprint = telemetry ? `${telemetry.ip_address}|${telemetry.os}|${telemetry.resolution}` : null;

            // Check if there's an existing session (e.g. brute force attempt) from the exact same device within the last 2 hours
            let merged = false;
            if (dbFingerprint) {
                const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
                for (let i = 0; i < db.sessions.length; i++) {
                    const s = db.sessions[i];
                    const sFingerprint = s.telemetry ? `${s.telemetry.ip_address}|${s.telemetry.os}|${s.telemetry.resolution}` : null;
                    if (s.username === username && sFingerprint === dbFingerprint && new Date(s.timestamp).getTime() > twoHoursAgo) {
                        // Upgrade the existing failed attempt or session to the successful login
                        db.sessions[i] = { ...db.sessions[i], telemetry, attempts, timestamp: new Date().toISOString(), status: undefined };
                        merged = true;
                        break;
                    }
                }
            }

            if (!merged) {
                db.sessions.unshift(newSession);
                if (db.sessions.length > 100) db.sessions.pop();
            }

            return NextResponse.json({ success: true, session: merged ? newSession : newSession });
        }

        if (action === "CREATE_ACCOUNT") {
            const { username, password } = payload;

            if (!username || !password) {
                return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 });
            }

            if (db.users[username]) {
                return NextResponse.json({ success: false, error: "Username already exists" }, { status: 409 });
            }

            db.users[username] = {
                password,
                attempts: 0,
                telemetry: null
            };

            return NextResponse.json({ success: true, message: "Account created successfully" });
        }

        if (action === "VERIFY_LOGIN") {
            const { username, password } = payload;

            if (!username || !password) {
                return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 });
            }

            const user = db.users[username];
            if (!user) {
                return NextResponse.json({ success: false, error: "User not found" });
            }

            // Increment attempts on every login click (success or failure)
            user.attempts = (user.attempts || 0) + 1;

            if (user.password !== password) {
                return NextResponse.json({ success: false, error: "Incorrect password", attempts: user.attempts });
            }

            return NextResponse.json({ success: true, attempts: user.attempts });
        }

        if (action === "RECORD_FAILED_ATTEMPTS") {
            const { username, attempts, telemetry } = payload;

            const newSession = {
                id: `${username}-brute-${Date.now()}`,
                username,
                attempts,
                telemetry: telemetry || {},
                timestamp: new Date().toISOString(),
                status: "Brute-Force Attempt"
            };

            const dbFingerprint = telemetry ? `${telemetry.ip_address}|${telemetry.os}|${telemetry.resolution}` : null;

            // Deduplicate failed attempts from the same device
            let merged = false;
            if (dbFingerprint) {
                const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
                for (let i = 0; i < db.sessions.length; i++) {
                    const s = db.sessions[i];
                    const sFingerprint = s.telemetry ? `${s.telemetry.ip_address}|${s.telemetry.os}|${s.telemetry.resolution}` : null;
                    if (s.username === username && sFingerprint === dbFingerprint && new Date(s.timestamp).getTime() > twoHoursAgo) {
                        // Update existing entry instead of adding a new row
                        db.sessions[i].attempts = attempts;
                        db.sessions[i].telemetry = telemetry;
                        db.sessions[i].timestamp = new Date().toISOString();
                        merged = true;
                        break;
                    }
                }
            }

            if (!merged) {
                db.sessions.unshift(newSession);
                if (db.sessions.length > 100) db.sessions.pop();
            }

            return NextResponse.json({ success: true, session: newSession });
        }

        if (action === "GET_SESSIONS") {
            return NextResponse.json({ success: true, sessions: db.sessions });
        }

        if (action === "GET_USERS") {
            const userList = Object.entries(db.users).map(([username, userData]: [string, any]) => ({
                username,
                email: userData.email || "",
                attempts: userData.attempts || 0,
                lastIp: userData.telemetry?.ip_address || "Unknown",
                lastLocation: userData.telemetry ? {
                    lat: userData.telemetry.lat,
                    lon: userData.telemetry.lon
                } : null,
                riskStatus: userData.telemetry?.risk_status || [],
                trustedLocations: userData.trustedLocations || []
            }));
            return NextResponse.json({ success: true, users: userList });
        }

        if (action === "GET_ANALYTICS") {
            // Aggregate analytics from sessions
            const sessions = db.sessions;

            // Verdict distribution
            const verdicts = { safe: 0, warning: 0, critical: 0 };
            // IP grouping
            const ipGroups: Record<string, { count: number; verdicts: string[]; users: string[] }> = {};
            // Location grouping
            const locationGroups: Record<string, { count: number; lat: number; lon: number; users: string[]; verdicts: string[] }> = {};
            // User targeting
            const userTargets: Record<string, { attempts: number; verdict: string }> = {};
            // Threat types
            const threatTypes = { bot: 0, vpn: 0, devtools: 0, paste: 0, highData: 0, bruteForce: 0 };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sessions.forEach((s: any) => {
                const isAnomaly = s.telemetry?.risk_status?.some((r: string) => r.includes("ANOMALY")) || s.attempts > 2;
                const isSafe = s.telemetry?.risk_status?.includes("SAFE") && s.attempts <= 2;
                const verdict = isSafe ? "safe" : isAnomaly ? "critical" : "warning";

                verdicts[verdict]++;

                // IP grouping
                const ip = s.telemetry?.ip_address || "Unknown";
                if (!ipGroups[ip]) ipGroups[ip] = { count: 0, verdicts: [], users: [] };
                ipGroups[ip].count++;
                ipGroups[ip].verdicts.push(verdict);
                if (!ipGroups[ip].users.includes(s.username)) ipGroups[ip].users.push(s.username);

                // Location grouping
                if (s.telemetry?.lat && s.telemetry?.lon) {
                    const locKey = `${s.telemetry.lat.toFixed(2)},${s.telemetry.lon.toFixed(2)}`;
                    if (!locationGroups[locKey]) locationGroups[locKey] = { count: 0, lat: s.telemetry.lat, lon: s.telemetry.lon, users: [], verdicts: [] };
                    locationGroups[locKey].count++;
                    locationGroups[locKey].verdicts.push(verdict);
                    if (!locationGroups[locKey].users.includes(s.username)) locationGroups[locKey].users.push(s.username);
                }

                // User targeting
                if (!userTargets[s.username]) userTargets[s.username] = { attempts: 0, verdict: "safe" };
                userTargets[s.username].attempts += (s.attempts || 1);
                if (verdict === "critical") userTargets[s.username].verdict = "critical";
                else if (verdict === "warning" && userTargets[s.username].verdict !== "critical") userTargets[s.username].verdict = "warning";

                // Threat types
                if (s.telemetry?.risk_status?.some((r: string) => r.includes("BOT"))) threatTypes.bot++;
                if (s.telemetry?.mouse_velocity > 2000) threatTypes.bot++;
                if (s.telemetry?.tab_switch_count > 2) threatTypes.devtools++;
                if (s.telemetry?.avg_keystroke_delay < 0.05) threatTypes.paste++;
                if (s.telemetry?.bytes_sent > 100000000) threatTypes.highData++;
                if (s.attempts > 2) threatTypes.bruteForce++;
            });

            return NextResponse.json({
                success: true,
                analytics: {
                    totalSessions: sessions.length,
                    verdicts,
                    ipGroups,
                    locationGroups,
                    userTargets,
                    threatTypes,
                    uniqueIps: Object.keys(ipGroups).length,
                    bruteForceAttempts: Object.values(userTargets).filter((u: any) => u.attempts > 2).length
                }
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
