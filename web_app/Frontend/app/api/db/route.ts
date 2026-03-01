import { NextResponse } from 'next/server';

// In-memory mock DB for Vercel prototyping
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalDb: any = globalThis as any;

if (!globalDb.mockDb) {
    globalDb.mockDb = {
        users: {
            "marcus_aurelius": {
                password: "password123",
                email: "nischalsharma2037@gmail.com",
                attempts: 1,
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
            "sys_admin_sim": {
                password: "admin_password",
                email: "nischalsharma2037@gmail.com",
                attempts: 4,
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
            "john_doe": {
                password: "secure456",
                email: "nischalsharma2037@gmail.com",
                attempts: 2,
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
            "alice_wong": {
                password: "pass789",
                email: "nischalsharma2037@gmail.com",
                attempts: 6,
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
                id: "sys_admin_sim-" + (Date.now() - 1000 * 60 * 15),
                username: "sys_admin_sim",
                attempts: 4,
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
                },
                timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
            },
            {
                id: "marcus_aurelius-" + (Date.now() - 1000 * 60 * 60 * 2),
                username: "marcus_aurelius",
                attempts: 1,
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
                },
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
            },
            {
                id: "john_doe-" + (Date.now() - 1000 * 60 * 45),
                username: "john_doe",
                attempts: 2,
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
                },
                timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
            },
            {
                id: "alice_wong-" + (Date.now() - 1000 * 60 * 30),
                username: "alice_wong",
                attempts: 6,
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
                },
                timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
            },
            {
                id: "alice_wong-brute-" + (Date.now() - 1000 * 60 * 25),
                username: "alice_wong",
                attempts: 6,
                telemetry: {
                    ip_address: "10.0.0.84",
                    lat: 34.0522,
                    lon: -118.2437,
                    os: "Ubuntu 22.04",
                    resolution: "2560x1440",
                    avg_keystroke_delay: 0.003,
                    mouse_velocity: 9000,
                    tab_switch_count: 12,
                    active_processes: "Hydra, Burp Suite, Firefox",
                    bytes_sent: 3200000000,
                    risk_status: ["ANOMALY_BOT", "BRUTE_FORCE"]
                },
                timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString()
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

            const newSession = {
                id: `${username}-${Date.now()}`,
                username,
                attempts,
                telemetry,
                timestamp: new Date().toISOString()
            };

            db.sessions.unshift(newSession);

            if (db.sessions.length > 100) db.sessions.pop();

            return NextResponse.json({ success: true, session: newSession });
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

            db.sessions.unshift(newSession);
            if (db.sessions.length > 100) db.sessions.pop();

            return NextResponse.json({ success: true, session: newSession });
        }

        if (action === "GET_SESSIONS") {
            return NextResponse.json({ success: true, sessions: db.sessions });
        }

        if (action === "GET_USERS") {
            const userList = Object.entries(db.users).map(([username, userData]: [string, any]) => ({
                username,
                attempts: userData.attempts || 0,
                lastIp: userData.telemetry?.ip_address || "Unknown",
                lastLocation: userData.telemetry ? {
                    lat: userData.telemetry.lat,
                    lon: userData.telemetry.lon
                } : null,
                riskStatus: userData.telemetry?.risk_status || []
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
