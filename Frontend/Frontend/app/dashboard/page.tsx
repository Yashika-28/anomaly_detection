"use client";
import { useEffect, useState } from "react";

export default function SOCDashboard() {
  const [sessions, setSessions] = useState<Record<string, any>>({});
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/soc");

    ws.onopen = () => setConnectionStatus("🟢 Connected to Live Feed");
    ws.onclose = () => setConnectionStatus("🔴 Disconnected");
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setSessions((prev) => ({
        ...prev,
        [data.username]: data // Overwrites live data with final evaluation when submitted
      }));
    };

    return () => ws.close();
  }, []);

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh', color: '#000' }}>
      <h1 style={{ color: '#111827' }}>SOC Live Monitoring Dashboard</h1>
      <p style={{ fontWeight: 'bold' }}>Status: {connectionStatus}</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', backgroundColor: '#ffffff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ backgroundColor: '#1f2937', color: '#ffffff', textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>Time</th>
            <th style={{ padding: '12px' }}>User</th>
            <th style={{ padding: '12px' }}>Location (Lat/Lon)</th>
            <th style={{ padding: '12px' }}>Real IP & OS</th>
            <th style={{ padding: '12px' }}>Network</th>
            <th style={{ padding: '12px' }}>Behavior (Type/Mouse/Tabs)</th>
            <th style={{ padding: '12px' }}>AI Verdict</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(sessions).map((log, index) => {
            // Highlight row slightly if evaluation is complete
            const isFinal = log.type === 'FINAL_EVALUATION';
            
            return (
              <tr key={index} style={{ 
                borderBottom: '1px solid #e5e7eb', 
                backgroundColor: isFinal ? '#f3f4f6' : '#ffffff',
                color: '#111827' // Explicitly set text color to dark gray/black
              }}>
                <td style={{ padding: '12px' }}>{log.time}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{log.username}</td>
                <td style={{ padding: '12px' }}>{log.lat?.toFixed(2)}, {log.lon?.toFixed(2)}</td>
                <td style={{ padding: '12px', fontSize: '0.9em' }}>
                  {log.ip_address} <br/> 
                  <span style={{ color: '#4b5563' }}>{log.os}</span> {/* Full OS string shown here */}
                </td>
                <td style={{ padding: '12px' }}>{log.protocol} | {log.bytes_sent} bytes</td>
                <td style={{ padding: '12px' }}>
                  {log.avg_keystroke_delay?.toFixed(3)}s | {log.mouse_velocity} px/s | {log.tab_switch_count} tabs
                </td>
                <td style={{ padding: '12px', color: log.color, fontWeight: 'bold' }}>
                  {log.risk_status}
                </td>
              </tr>
            );
          })}
          {Object.keys(sessions).length === 0 && (
            <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Waiting for incoming traffic...</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}