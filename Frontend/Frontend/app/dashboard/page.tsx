"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Activity, Search, Calendar, Shield, ShieldCheck,
  Monitor, MousePointer2, Network, AlertTriangle,
  CheckCircle, X, Clock, Eye, Crosshair,
  Lock, Zap, Terminal, RefreshCw, Sun, Moon,
  Plus, Minus, LocateFixed, ArrowRight, CalendarDays,
  Code, ClipboardPaste, Globe,
  ArrowDown, ArrowUp
} from 'lucide-react';

// --- TYPES ---
export type GeoLocation = {
  lat: number;
  lng: number;
  city: string;
  country: string;
};

export type SessionModules = {
  context: {
    os: string;
    res: string;
    devToolsOpen: boolean;
    match: boolean;
  };
  hci: {
    velocity: string;
    trajectory: string;
    pasteDetected: boolean;
    human: boolean;
  };
  network: {
    ipType: string;
    proxy: string;
    protocol: string;
    download: string;
    upload: string;
    risk: string;
  };
};

export type Session = {
  id: string;
  timestamp: string;
  user: {
    name: string;
    role: string;
    ip: string;
  };
  status: string;
  verdict: 'Safe' | 'Warning' | 'Critical';
  geo: GeoLocation;
  modules: SessionModules;
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any;
  }
}

// --- COMPONENTS ---

const StatusBadge = ({ verdict }: { verdict: 'Safe' | 'Warning' | 'Critical' }) => {
  const styles = {
    Safe: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    Warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Critical: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse',
  };

  const icons = {
    Safe: <CheckCircle size={14} className="mr-1.5" />,
    Warning: <AlertTriangle size={14} className="mr-1.5" />,
    Critical: <Shield size={14} className="mr-1.5" />,
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[verdict]}`}>
      {icons[verdict]}
      {verdict.toUpperCase()}
    </span>
  );
};

interface LiveMapProps extends GeoLocation {
  verdict: 'Safe' | 'Warning' | 'Critical';
  isDarkMode: boolean;
}

// Real Live Map Component
const LiveMap = ({ lat, lng, city, country, verdict, isDarkMode }: LiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tileLayerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!window.L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      if (!isMounted) return;

      if (mapRef.current && !mapInstance.current && window.L) {
        mapInstance.current = window.L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([lat, lng], 4);

        const tileUrl = isDarkMode
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

        tileLayerRef.current = window.L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(mapInstance.current);

        const color = verdict === 'Critical' ? '#f43f5e' : verdict === 'Warning' ? '#f59e0b' : '#10b981';

        window.L.circleMarker([lat, lng], {
          radius: 6, fillColor: color, color: color, weight: 2, opacity: 1, fillOpacity: 0.8
        }).addTo(mapInstance.current);

        window.L.circleMarker([lat, lng], {
          radius: 15, fillColor: color, color: 'transparent', weight: 0, opacity: 0, fillOpacity: 0.2
        }).addTo(mapInstance.current);
      } else if (mapInstance.current) {
        mapInstance.current.setView([lat, lng], 4);
        if (tileLayerRef.current) {
          const newTileUrl = isDarkMode
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
          tileLayerRef.current.setUrl(newTileUrl);
        }
      }
    };

    initMap();

    return () => { isMounted = false; };
  }, [lat, lng, verdict, isDarkMode]);

  const handleZoomIn = () => mapInstance.current?.zoomIn();
  const handleZoomOut = () => mapInstance.current?.zoomOut();
  const handleRecenter = () => mapInstance.current?.setView([lat, lng], 4);

  return (
    <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
      <div ref={mapRef} className="absolute inset-0 z-0"></div>

      <div className="absolute top-2 right-2 z-[400] flex flex-col gap-1 shadow-lg">
        <button onClick={handleZoomIn} className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-t text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
        <button onClick={handleZoomOut} className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-b text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 border-t-0 transition-colors">
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-2 right-2 z-[400] shadow-lg">
        <button onClick={handleRecenter} className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors" title="Recenter Location">
          <LocateFixed className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-2 left-2 z-[400] bg-white/90 dark:bg-slate-950/80 backdrop-blur border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded shadow-lg pointer-events-none">
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{lat.toFixed(4)}°, {lng.toFixed(4)}°</p>
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{city}, {country}</p>
      </div>
    </div>
  );
};

// --- MAIN APPLICATION ---

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // WebSocket Integration
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/soc');

    socket.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      const newSession: Session = {
        id: `${data.username}-${data.time}`,
        timestamp: `${new Date().toISOString().split('T')[0]}T${data.time}`,
        user: {
          name: data.username || "Unknown",
          role: data.type === "FINAL_EVALUATION" ? "User" : "Streaming...",
          ip: data.ip_address
        },
        status: data.type === "LIVE_UPDATE" ? "Live" : "Locked",
        verdict: data.risk_status.includes("SAFE") ? "Safe" :
          data.risk_status.includes("ANOMALY") ? "Critical" : "Warning",
        geo: {
          lat: data.lat || 0,
          lng: data.lon || 0,
          city: "Detected",
          country: "Live"
        },
        modules: {
          context: {
            os: data.os || "Unknown",
            res: data.resolution || "Unknown",
            devToolsOpen: data.tab_switch_count > 2,
            match: true
          },
          hci: {
            velocity: `${data.mouse_velocity || 0} px/s`,
            trajectory: data.mouse_velocity > 2000 ? "Erratic" : "Human",
            pasteDetected: data.avg_keystroke_delay < 0.05,
            human: !data.risk_status.includes("Bot")
          },
          network: {
            ipType: "Residential",
            proxy: "None",
            protocol: data.protocol || "WSS",
            download: "0 MB",
            upload: `${data.bytes_sent || 0} bytes`,
            risk: data.risk_status.includes("ANOMALY") ? "High" : "Low"
          }
        }
      };

      setSessions((prev) => {
        // Find if session already exists for this user/IP and update it, else append
        const existingIndex = prev.findIndex(s => s.user.name === newSession.user.name && s.user.ip === newSession.user.ip);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = newSession;
          return updated;
        }
        return [newSession, ...prev];
      });
    };

    return () => socket.close();
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [timeRange, setTimeRange] = useState('Last 24 Hours');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handleRowClick = (session: Session) => {
    setSelectedSession(session);
    setIsPanelOpen(true);
  };

  const applyCustomDate = () => {
    if (customStart && customEnd) {
      const startObj = new Date(customStart);
      const endObj = new Date(customEnd);

      const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      const startStr = startObj.toLocaleDateString(undefined, formatOptions);
      const endStr = endObj.toLocaleDateString(undefined, formatOptions);

      setTimeRange(`${startStr} - ${endStr}`);
    }
    setIsCustomModalOpen(false);
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesSearch = s.user.name.toLowerCase().includes(search.toLowerCase()) ||
        s.user.ip.includes(search);
      const matchesRisk = filterRisk === 'All' || s.verdict === filterRisk;

      let matchesTime = true;
      const sessionTime = new Date(s.timestamp).getTime();
      const now = new Date().getTime();

      if (timeRange === 'Last 1 Hour') {
        matchesTime = sessionTime >= now - (60 * 60 * 1000);
      } else if (timeRange === 'Last 24 Hours') {
        matchesTime = sessionTime >= now - (24 * 60 * 60 * 1000);
      } else if (timeRange === 'Last 7 Days') {
        matchesTime = sessionTime >= now - (7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === 'Last 30 Days') {
        matchesTime = sessionTime >= now - (30 * 24 * 60 * 60 * 1000);
      } else if (customStart && customEnd && timeRange.includes('-')) {
        const start = new Date(customStart).getTime();
        const end = new Date(customEnd).getTime();
        matchesTime = sessionTime >= start && sessionTime <= end;
      }

      return matchesSearch && matchesRisk && matchesTime;
    });
  }, [search, filterRisk, timeRange, customStart, customEnd, sessions]);

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-300 font-sans selection:bg-blue-500/30 flex flex-col overflow-hidden transition-colors duration-300">

        {/* --- 1. GLOBAL CONTROLS & HEADER LAYER --- */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md px-6 flex items-center justify-between z-20 sticky top-0 transition-colors duration-300">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight z-10 shrink-0 hover:opacity-80 transition-opacity">
              <ShieldCheck className="w-6 h-6 text-blue-500" />
              <span>Neurometric<span className="text-blue-500">Shield</span></span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full transition-colors duration-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">CONNECTED</span>
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* --- FILTER & CONTROL BAR --- */}
        <div className="h-14 border-b border-slate-200 dark:border-slate-800/50 bg-white dark:bg-[#0B0F19] px-6 flex items-center justify-between z-10 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search user or IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm rounded-lg pl-9 pr-4 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 w-64 transition-all"
              />
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-1 transition-colors duration-300">
              {['All', 'Safe', 'Warning', 'Critical'].map(level => (
                <button
                  key={level}
                  onClick={() => setFilterRisk(level)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterRisk === level
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-transparent'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/50'
                    }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
              >
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="truncate max-w-[200px]">{timeRange}</span>
              </button>

              {isTimeDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsTimeDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                    {['Last 1 Hour', 'Last 24 Hours', 'Last 7 Days', 'Last 30 Days'].map((range) => (
                      <button
                        key={range}
                        onClick={() => {
                          setTimeRange(range);
                          setIsTimeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${timeRange === range ? 'bg-blue-50 dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                      >
                        {range}
                      </button>
                    ))}
                    <div className="border-t border-slate-200 dark:border-slate-800"></div>
                    <button
                      onClick={() => {
                        setIsCustomModalOpen(true);
                        setIsTimeDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm transition-colors text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between"
                    >
                      Custom Range...
                      <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              className="flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-500/30 w-9 h-9 rounded-lg text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all group shadow-sm"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 flex overflow-hidden relative">

          {/* --- 2. MAIN MONITORING VIEW (Surface Level) --- */}
          <div className={`flex-1 p-6 overflow-y-auto transition-all duration-300 ${isPanelOpen ? 'pr-[420px]' : ''}`}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                Active Behavior Telemetry
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                  {filteredSessions.length} SESSION{filteredSessions.length !== 1 && 'S'} FOUND
                </span>
                <div className="text-sm font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {mounted ? `${currentTime.toISOString().replace('T', ' ').substr(0, 19)} UTC` : 'Loading...'}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xl dark:shadow-2xl transition-colors duration-300">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold transition-colors duration-300">
                    <th className="p-4 pl-6">Timestamp</th>
                    <th className="p-4">Identity Summary</th>
                    <th className="p-4">Session Status</th>
                    <th className="p-4">Unified AI Verdict</th>
                    <th className="p-4 text-right pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredSessions.map((session: Session) => (
                    <tr
                      key={session.id}
                      onClick={() => handleRowClick(session)}
                      className={`group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${selectedSession?.id === session.id ? 'bg-blue-50/50 dark:bg-slate-800/50 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}`}
                    >
                      <td className="p-4 pl-6">
                        <div className="font-mono text-sm text-slate-700 dark:text-slate-300">
                          {session.timestamp.split('T')[1].substring(0, 8)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {session.timestamp.split('T')[0]}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-700">
                            {session.user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{session.user.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-mono">{session.user.ip}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600"></span>
                              <span>{session.user.role}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {session.status === 'Live' ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 w-max px-2 py-1 rounded border border-blue-200 dark:border-blue-500/20">
                            <Activity className="w-3.5 h-3.5" /> Live Stream
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 w-max px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                            <Lock className="w-3.5 h-3.5" /> Locked / Final
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge verdict={session.verdict} />
                      </td>
                      <td className="p-4 text-right pr-6">
                        <button className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 p-2 rounded-lg flex items-center gap-2 ml-auto text-sm border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                          <Eye className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Analyze</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSessions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-16 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                          <Search className="w-10 h-10 mb-3 opacity-20" />
                          <p className="text-base font-medium">No telemetry matches your filters.</p>
                          <p className="text-sm mt-1 opacity-70">Try expanding your time range or clearing the search query.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- 3. DEEP DIVE VIEW (Side-Panel) --- */}
          <div
            className={`absolute top-0 right-0 h-full w-[420px] bg-white dark:bg-[#0d1320] border-l border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-30 flex flex-col ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            {selectedSession && (
              <>
                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 transition-colors">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Telemetry Deep Dive
                    </h2>
                    <p className="text-xs font-mono text-slate-500 mt-1">ID: {selectedSession.id}</p>
                  </div>
                  <button
                    onClick={() => setIsPanelOpen(false)}
                    className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">

                  {/* User Context Summary */}
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-white font-bold border border-slate-500 dark:border-slate-600 shadow-inner">
                        {selectedSession.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-200">{selectedSession.user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{selectedSession.user.role} • {selectedSession.user.ip}</p>
                      </div>
                    </div>
                    <StatusBadge verdict={selectedSession.verdict} />
                  </div>

                  {/* Geospatial Visualization */}
                  <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold flex items-center gap-2">
                      <Crosshair className="w-3.5 h-3.5" /> Location Intelligence
                    </h3>
                    <LiveMap {...selectedSession.geo} verdict={selectedSession.verdict} isDarkMode={isDarkMode} />
                  </div>

                  {/* --- MODULE 1: CONTEXT & IDENTITY AI --- */}
                  <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden relative transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800/50 flex items-center gap-2 bg-slate-100/50 dark:bg-slate-900/30">
                      <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">Device Context & Fingerprint</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Operating System</p>
                          <p className="text-sm text-slate-800 dark:text-slate-300 font-medium mt-0.5">{selectedSession.modules.context.os}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Screen Resolution</p>
                          <p className="text-sm text-slate-800 dark:text-slate-300 font-medium mt-0.5">{selectedSession.modules.context.res}</p>
                        </div>
                      </div>

                      {/* DevTools Detection */}
                      <div className="flex items-center justify-between p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <Code className="w-4 h-4 text-slate-500" />
                          <span className="text-xs text-slate-700 dark:text-slate-300">Browser DevTools</span>
                        </div>
                        {selectedSession.modules.context.devToolsOpen ? (
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-500/20 animate-pulse">OPENED (RISK)</span>
                        ) : (
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">CLOSED</span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/50 flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Fingerprint Match:</span>
                        {selectedSession.modules.context.match ? (
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/20">CONFIRMED</span>
                        ) : (
                          <span className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-500/20">SPOOFED</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* --- MODULE 2: HCI BEHAVIOR AI --- */}
                  <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden relative transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800/50 flex items-center gap-2 bg-slate-100/50 dark:bg-slate-900/30">
                      <MousePointer2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">Behavioral Biometrics</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-slate-900/50 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Mouse Trajectory</p>
                          <p className="text-sm text-slate-800 dark:text-slate-300 mt-0.5">{selectedSession.modules.hci.trajectory}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900/50 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Pointer Velocity</p>
                          <p className="text-sm text-slate-800 dark:text-slate-300 font-mono mt-0.5">{selectedSession.modules.hci.velocity}</p>
                        </div>
                      </div>

                      {/* Paste Detection */}
                      <div className="flex items-center justify-between p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <ClipboardPaste className="w-4 h-4 text-slate-500" />
                          <span className="text-xs text-slate-700 dark:text-slate-300">Input Cadence</span>
                        </div>
                        {selectedSession.modules.hci.pasteDetected ? (
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-500/20">INSTANT PASTE</span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">NATURAL TYPING</span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/50 flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Predicted Agent:</span>
                        {selectedSession.modules.hci.human ? (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">HUMAN USER</span>
                        ) : (
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1"><Terminal className="w-3 h-3" /> AUTOMATED SCRIPT</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* --- MODULE 3: NETWORK & IP REPUTATION --- */}
                  <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden relative transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800/50 flex items-center gap-2 bg-slate-100/50 dark:bg-slate-900/30">
                      <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">Network & IP Intelligence</h3>
                    </div>
                    <div className="p-4 space-y-4">

                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Origin Network</p>
                          <p className="text-sm text-slate-900 dark:text-slate-200 font-medium mt-0.5">{selectedSession.modules.network.ipType}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Transport</p>
                          <p className="text-sm text-slate-800 dark:text-slate-300 mt-0.5">{selectedSession.modules.network.protocol}</p>
                        </div>
                      </div>

                      {/* NEW: Data Transfer Row (Rx/Tx) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-slate-900/50 p-2.5 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Rx (Download)</p>
                            <p className="text-sm text-slate-800 dark:text-slate-300 font-mono mt-0.5">{selectedSession.modules.network.download}</p>
                          </div>
                          <ArrowDown className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                        </div>
                        <div className="bg-white dark:bg-slate-900/50 p-2.5 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Tx (Upload)</p>
                            <p className="text-sm text-slate-800 dark:text-slate-300 font-mono mt-0.5">{selectedSession.modules.network.upload}</p>
                          </div>
                          <ArrowUp className={`w-4 h-4 ${parseFloat(selectedSession.modules.network.upload) > 50 && selectedSession.modules.network.upload.includes('MB') ? 'text-rose-600 dark:text-rose-500 animate-pulse' : 'text-purple-600 dark:text-purple-400'}`} />
                        </div>
                      </div>

                      {/* Proxy/VPN Detection */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Network className="w-3.5 h-3.5" /> Connection Routing
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2.5 py-1 rounded border font-medium ${selectedSession.modules.network.proxy !== 'None'
                            ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
                            : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                            }`}>
                            {selectedSession.modules.network.proxy.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/50 flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Exfiltration / Network Risk:</span>
                        <span className={`text-xs font-bold ${selectedSession.modules.network.risk === 'High' ? 'text-rose-600 dark:text-rose-400' : selectedSession.modules.network.risk === 'Medium' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {selectedSession.modules.network.risk.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>

        </main>

        {/* --- ENHANCED CUSTOM DATE MODAL --- */}
        {isCustomModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsCustomModalOpen(false)}
            ></div>

            <div className="relative bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden transform transition-all">
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>

              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="bg-blue-100 dark:bg-blue-500/20 p-1.5 rounded-lg">
                    <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Custom Time Range</h3>
                </div>
                <button
                  onClick={() => setIsCustomModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="relative group">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                  />
                </div>

                <div className="relative group">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                  />
                </div>

                {customStart && customEnd && new Date(customStart) > new Date(customEnd) && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Start date must be before end date.
                  </p>
                )}
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyCustomDate}
                  disabled={!customStart || !customEnd || new Date(customStart) > new Date(customEnd)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                  Apply Range
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}