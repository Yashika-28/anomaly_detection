"use client";
import { useState, useEffect, useRef } from "react";

export default function PrototypePage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Gathering hardware/network info...");

  const trackData = useRef({
    ip: "Fetching...",
    lat: 0.0,
    lon: 0.0,
    os: "Unknown",
    tabSwitches: 0,
    mouseVelocity: 0,
    totalBytes: 0, // Will now track real packet sizes
    keystrokeDelays: [] as number[]
  });

  const lastMousePos = useRef({ x: 0, y: 0, time: Date.now() });
  const lastKeyTime = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  // NEW: A ref to immediately stop the WebSocket from overwriting the final AI verdict
  const isSubmittedRef = useRef(false);

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
          setStatus("Ready. Monitoring live behavior...");
        },
        () => setStatus("Location access denied. Monitoring behavior...")
      );
    }

    wsRef.current = new WebSocket("ws://localhost:8000/ws/tracking");

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
          Math.pow(e.clientX - lastMousePos.current.x, 2) + 
          Math.pow(e.clientY - lastMousePos.current.y, 2)
        );
        trackData.current.mouseVelocity = Math.round((dist / timeDiff) * 1000); 
        lastMousePos.current = { x: e.clientX, y: e.clientY, time: now };
      }
    };
    document.addEventListener("mousemove", handleMouse);

    // STREAM DATA EVERY SECOND (Unless submitted)
    const streamInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN && username.length > 0 && !isSubmittedRef.current) {
        const delays = trackData.current.keystrokeDelays;
        const avgKey = delays.length ? delays.reduce((a,b)=>a+b)/delays.length : 0;

        // 1. Build the payload first
        const livePayload = {
          username: username,
          ip_address: trackData.current.ip,
          lat: trackData.current.lat,
          lon: trackData.current.lon,
          os: trackData.current.os,
          resolution: `${window.innerWidth}x${window.innerHeight}`,
          avg_keystroke_delay: avgKey,
          mouse_velocity: trackData.current.mouseVelocity,
          tab_switch_count: trackData.current.tabSwitches
        };

        // 2. Calculate its exact size in bytes before sending
        const payloadString = JSON.stringify(livePayload);
        const actualPacketSizeBytes = new Blob([payloadString]).size;
        
        // 3. Accumulate the real network transfer data
        trackData.current.totalBytes += actualPacketSizeBytes;

        // 4. Send the payload with the accurate byte count
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
      wsRef.current?.close();
    };
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // STOP THE WEBSOCKET IMMEDIATELY
    isSubmittedRef.current = true;
    if (wsRef.current) {
      wsRef.current.close();
    }

    const delays = trackData.current.keystrokeDelays;
    
    const finalPayload = {
      username: username,
      ip_address: trackData.current.ip,
      lat: trackData.current.lat,
      lon: trackData.current.lon,
      os: trackData.current.os,
      resolution: `${window.innerWidth}x${window.innerHeight}`,
      avg_keystroke_delay: delays.length ? delays.reduce((a,b)=>a+b)/delays.length : 0,
      mouse_velocity: trackData.current.mouseVelocity,
      tab_switch_count: trackData.current.tabSwitches,
      bytes_sent: 0 // Placeholder
    };

    // Calculate the size of the POST request
    const postPayloadString = JSON.stringify(finalPayload);
    const postPacketSizeBytes = new Blob([postPayloadString]).size;
    trackData.current.totalBytes += postPacketSizeBytes;
    
    // Assign the final exact tally
    finalPayload.bytes_sent = trackData.current.totalBytes;

    setStatus("Sending data to AI...");

    await fetch("http://localhost:8000/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalPayload)
    });
    
    setStatus("Login evaluated! Check SOC. (Live tracking frozen)");
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h2>Prototype Login Panel</h2>
      <p style={{ color: 'red', fontWeight: 'bold' }}>{status}</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '15px' }}>
        <input type="text" placeholder="Type Username to start streaming..." value={username} onChange={(e) => setUsername(e.target.value)} style={{ padding: '10px' }} required disabled={isSubmittedRef.current} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '10px' }} required disabled={isSubmittedRef.current} />
        <button type="submit" style={{ padding: '10px', backgroundColor: isSubmittedRef.current ? 'gray' : 'blue', color: 'white' }} disabled={isSubmittedRef.current}>
          {isSubmittedRef.current ? "Session Closed" : "Sign In"}
        </button>
      </form>
    </div>
  );
}