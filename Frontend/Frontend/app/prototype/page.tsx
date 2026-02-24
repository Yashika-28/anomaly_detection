"use client";
import { useState, useEffect, useRef } from "react";
import { Upload, Download, Keyboard, MousePointer2, Network, ShieldAlert, CheckCircle, Activity, PowerOff } from "lucide-react";

export default function PrototypePage() {
  // --- STATE: User Inputs ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceNotes, setWorkspaceNotes] = useState("");

  // --- STATE: Simulator Controls ---
  const [activeProcesses, setActiveProcesses] = useState("Outlook, Excel, Chrome (Google)");
  const [isBotMode, setIsBotMode] = useState(false);
  const [status, setStatus] = useState("Awaiting Login Initialization...");
  const [isMonitoring, setIsMonitoring] = useState(false);

  // --- REFS: Live Tracking Data ---
  const trackData = useRef({
    ip: "Fetching...",
    lat: 0.0,
    lon: 0.0,
    os: "Unknown",
    tabSwitches: 0,
    mouseVelocity: 0,
    totalBytes: 0,
    keystrokeDelays: [] as number[]
  });

  const lastMousePos = useRef({ x: 0, y: 0, time: Date.now() });
  const lastKeyTime = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isSubmittedRef = useRef(false);

  // --- INITIALIZATION: Hardware & Network ---
  useEffect(() => {
    trackData.current.os = navigator.platform || navigator.userAgent;

    fetch("https://api.ipify.org?format=json")
      .then(r => r.json())
      .then(data => { trackData.current.ip = data.ip; })
      .catch(() => { trackData.current.ip = "Unavailable"; });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          trackData.current.lat = pos.coords.latitude;
          trackData.current.lon = pos.coords.longitude;
        },
        () => console.warn("Location access denied.")
      );
    }
  }, []);

  // --- LIVE TRACKING LOGIC ---
  useEffect(() => {
    // Start tracking as soon as they type a username
    if (username.length > 0 && !isMonitoring && !isSubmittedRef.current) {
      setIsMonitoring(true);
      setStatus("🟢 Active Session: Monitoring Telemetry...");
      wsRef.current = new WebSocket("ws://localhost:8000/ws/tracking");
    }

    if (!isMonitoring) return;

    const handleVis = () => { if (document.hidden) trackData.current.tabSwitches++; };
    document.addEventListener("visibilitychange", handleVis);

    const handleKey = () => {
      const now = Date.now();
      if (lastKeyTime.current) {
        trackData.current.keystrokeDelays.push((now - lastKeyTime.current) / 1000);
      }
      lastKeyTime.current = now;
    };
    document.addEventListener("keydown", handleKey);

    const handleMouse = (e: MouseEvent) => {
      const now = Date.now();
      const timeDiff = now - lastMousePos.current.time;
      if (timeDiff > 50) {
        const dist = Math.sqrt(
          Math.pow(e.clientX - lastMousePos.current.x, 2) + Math.pow(e.clientY - lastMousePos.current.y, 2)
        );
        trackData.current.mouseVelocity = Math.round((dist / timeDiff) * 1000);
        lastMousePos.current = { x: e.clientX, y: e.clientY, time: now };
      }
    };
    document.addEventListener("mousemove", handleMouse);

    // WEBSOCKET STREAM (Every 1 Second)
    const streamInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN && !isSubmittedRef.current) {
        const delays = trackData.current.keystrokeDelays;
        let avgKey = delays.length ? delays.reduce((a, b) => a + b) / delays.length : 0;
        let currentMouseVel = trackData.current.mouseVelocity;

        // BOT MODE OVERRIDE
        if (isBotMode) {
          avgKey = 0.005; // 5 milliseconds per key
          currentMouseVel = 8500; // Robotic snap movements
        }

        const livePayload = {
          username: username,
          ip_address: trackData.current.ip,
          lat: trackData.current.lat,
          lon: trackData.current.lon,
          os: trackData.current.os,
          resolution: `${window.innerWidth}x${window.innerHeight}`,
          avg_keystroke_delay: avgKey,
          mouse_velocity: currentMouseVel,
          tab_switch_count: trackData.current.tabSwitches,
          active_processes: activeProcesses
        };

        const payloadString = JSON.stringify(livePayload);
        trackData.current.totalBytes += new Blob([payloadString]).size;

        wsRef.current.send(JSON.stringify({
          ...livePayload,
          bytes_sent: trackData.current.totalBytes
        }));
      }
    }, 1000);

    return () => {
      document.removeEventListener("visibilitychange", handleVis);
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousemove", handleMouse);
      clearInterval(streamInterval);
    };
  }, [username, isMonitoring, activeProcesses, isBotMode]);

  // --- ACTIONS ---
  const simulateDataTransfer = (type: "upload" | "download") => {
    // Generate a massive spike in network bytes (e.g., 5MB to 25MB)
    const spikeSize = Math.floor(Math.random() * 20000000) + 5000000;
    trackData.current.totalBytes += spikeSize;
    setStatus(`⏳ Simulating ${type}... Transferred ${(spikeSize / 1024 / 1024).toFixed(2)} MB`);

    setTimeout(() => {
      setStatus("🟢 Active Session: Monitoring Telemetry...");
    }, 2000);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    isSubmittedRef.current = true;
    setIsMonitoring(false);
    if (wsRef.current) wsRef.current.close();

    const delays = trackData.current.keystrokeDelays;
    let avgKey = delays.length ? delays.reduce((a, b) => a + b) / delays.length : 0;
    let currentMouseVel = trackData.current.mouseVelocity;

    if (isBotMode) {
      avgKey = 0.005;
      currentMouseVel = 8500;
    }

    const finalPayload = {
      username: username,
      ip_address: trackData.current.ip,
      lat: trackData.current.lat,
      lon: trackData.current.lon,
      os: trackData.current.os,
      resolution: `${window.innerWidth}x${window.innerHeight}`,
      avg_keystroke_delay: avgKey,
      mouse_velocity: currentMouseVel,
      tab_switch_count: trackData.current.tabSwitches,
      active_processes: activeProcesses,
      bytes_sent: trackData.current.totalBytes
    };

    setStatus("🔒 Finalizing Evaluation with AI Models...");

    try {
      await fetch("http://localhost:8000/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload)
      });
      setStatus("✅ Session Locked & Evaluated. Check SOC Dashboard.");
    } catch (err) {
      setStatus("❌ Backend Connection Failed.");
    }
  };

  const handleLogout = () => {
    isSubmittedRef.current = false;
    setIsMonitoring(false);
    setUsername("");
    setPassword("");
    setWorkspaceNotes("");
    setIsBotMode(false);
    trackData.current.keystrokeDelays = [];
    trackData.current.tabSwitches = 0;
    trackData.current.totalBytes = 0;
    if (wsRef.current) wsRef.current.close();
    setStatus("Awaiting Login Initialization...");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-8 font-sans">

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="text-blue-500 w-8 h-8" />
            UEBA Prototype Engine
          </h1>
          <p className="text-slate-500 mt-2">Interact naturally on the left, inject threats on the right.</p>
        </div>
        <div className={`px-4 py-2 rounded-full font-bold border ${isMonitoring ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800 animate-pulse' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
          {status}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ================= LEFT SIDE: LIVE WORKSPACE ================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
            <CheckCircle className="text-emerald-500 w-5 h-5" />
            1. Employee Workspace
          </h2>

          <form onSubmit={handleFinalSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                  placeholder="e.g. jsmith"
                  disabled={isSubmittedRef.current}
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                  placeholder="••••••••"
                  disabled={isSubmittedRef.current}
                  required
                />
              </div>
            </div>

            {/* Typing Pad */}
            <div>
              <label className="block text-xs uppercase text-slate-500 font-bold mb-1 flex items-center gap-2">
                <Keyboard className="w-4 h-4" /> Scratchpad (Metrics Generator)
              </label>
              <textarea
                rows={4}
                value={workspaceNotes}
                onChange={(e) => setWorkspaceNotes(e.target.value)}
                placeholder="Type here to simulate natural keystroke variations..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none"
                disabled={!isMonitoring || isSubmittedRef.current}
              />
            </div>

            {/* Data Transfer Simulation */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() => simulateDataTransfer("download")}
                disabled={!isMonitoring || isSubmittedRef.current}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
              >
                <Download className="w-5 h-5" /> Download Report
              </button>
              <button
                type="button"
                onClick={() => simulateDataTransfer("upload")}
                disabled={!isMonitoring || isSubmittedRef.current}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
              >
                <Upload className="w-5 h-5" /> Backup Database
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800 flex gap-4">
              <button
                type="submit"
                disabled={isSubmittedRef.current || username.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmittedRef.current ? "Session Evaluated" : "Submit Authentication"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="bg-rose-900/50 hover:bg-rose-900 text-rose-400 font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 border border-rose-800"
              >
                <PowerOff className="w-5 h-5" /> Terminate
              </button>
            </div>
          </form>
        </div>

        {/* ================= RIGHT SIDE: THREAT INJECTION ================= */}
        <div className="bg-[#0f141e] border border-rose-900/30 rounded-xl p-6 shadow-[0_0_30px_rgba(225,29,72,0.05)]">
          <h2 className="text-xl font-bold text-rose-500 mb-6 flex items-center gap-2 border-b border-rose-900/50 pb-2">
            <ShieldAlert className="text-rose-500 w-5 h-5" />
            2. Threat Injection Engine
          </h2>
          <p className="text-sm text-slate-400 mb-6">Manipulate telemetry payloads before they reach the AI models to test detection accuracy.</p>

          <div className="space-y-6">

            {/* Endpoint Spoofing */}
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
              <label className="block text-xs uppercase text-amber-500 font-bold mb-2 flex items-center gap-2">
                <Network className="w-4 h-4" /> Spoof Endpoint Processes
              </label>
              <select
                value={activeProcesses}
                onChange={(e) => setActiveProcesses(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                disabled={isSubmittedRef.current}
              >
                <option value="Outlook, Excel, Chrome (Google)">[Normal] Outlook, Excel, Chrome</option>
                <option value="Chrome (YouTube, Spotify), Slack">[Warning] Distracted / High Bandwidth</option>
                <option value="Tor Browser, Wireshark, Cmd.exe">[Critical] Tor Browser, Wireshark, Cmd</option>
              </select>
              <p className="text-xs text-slate-500 mt-2">Changes the 'Apps' data sent to the Network GMM model.</p>
            </div>

            {/* Behavior Override */}
            <div className={`p-4 rounded-lg border transition-colors ${isBotMode ? 'bg-rose-950/30 border-rose-800' : 'bg-slate-900/50 border-slate-800'}`}>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs uppercase font-bold flex items-center gap-2 text-rose-400">
                  <MousePointer2 className="w-4 h-4" /> Automated Bot Script
                </label>
                <button
                  type="button"
                  onClick={() => setIsBotMode(!isBotMode)}
                  disabled={isSubmittedRef.current}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isBotMode ? 'bg-rose-600' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBotMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <p className="text-sm text-slate-400 mb-3">Overrides your physical input. Sets Keystroke Delay to <span className="text-white font-mono">0.005s</span> and Mouse Velocity to <span className="text-white font-mono">8,500 px/s</span>.</p>

              {isBotMode && (
                <div className="bg-rose-900/20 text-rose-400 p-3 rounded text-xs font-mono border border-rose-900/50">
                  &gt; INJECTING SYNTHETIC INPUT PATTERNS...<br />
                  &gt; OVERRIDING HCI BIOMETRICS...
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}