"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Keyboard,
  MousePointer2,
  Globe2,
  Database,
  AppWindow,
  Cpu,
  BrainCircuit,
  Server,
  ShieldCheck,
  Activity,
  Zap,
  Lock,
  Unlock,
  AlertTriangle,
  Github,
  Mail,
  Sun,
  Moon,
  ArrowRight,
  Network,
  Phone,
  Fingerprint,
  Radio
} from "lucide-react";

// --- Custom Interactive Neural Network Background ---
const NeuralBackground = ({ theme }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];
    let mouse = { x: null as number | null, y: null as number | null, radius: 150 };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const handleMouseMove = (e: any) => {
      mouse.x = e.x;
      mouse.y = e.y;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);

    class Particle {
      x: number;
      y: number;
      directionX: number;
      directionY: number;
      size: number;
      color: string;

      constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
      }
      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
      update() {
        if (!canvas) return;
        if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;

        // Mouse collision/repulsion
        let dx = (mouse.x as number) - this.x;
        let dy = (mouse.y as number) - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (mouse.x != null && distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouse.radius - distance) / mouse.radius;
          const directionX = forceDirectionX * force * 5;
          const directionY = forceDirectionY * force * 5;
          this.x -= directionX;
          this.y -= directionY;
        } else {
          this.x += this.directionX;
          this.y += this.directionY;
        }
        this.draw();
      }
    }

    const init = () => {
      if (!canvas) return;
      particles = [];
      let numberOfParticles = (canvas.height * canvas.width) / 12000;
      const isDark = theme === "dark";
      // Restored back to blue/slate
      const particleColor = isDark ? "rgba(96, 165, 250, 0.4)" : "rgba(37, 99, 235, 0.3)";

      for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 1;
        let x = (Math.random() * ((canvas.width - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * ((canvas.height - size * 2) - (size * 2)) + size * 2);
        let directionX = (Math.random() * 1.5) - 0.75;
        let directionY = (Math.random() * 1.5) - 0.75;
        particles.push(new Particle(x, y, directionX, directionY, size, particleColor));
      }
    };

    const connect = () => {
      if (!canvas || !ctx) return;
      const isDark = theme === "dark";
      let opacityValue = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
            + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
          if (distance < (canvas.width / 10) * (canvas.height / 10)) {
            opacityValue = 1 - (distance / 15000);
            // Restored back to indigo/blue connection lines
            ctx.strokeStyle = isDark
              ? `rgba(99, 102, 241, ${opacityValue * 0.4})`
              : `rgba(79, 70, 229, ${opacityValue * 0.2})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      if (!canvas || !ctx) return;
      animationFrameId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      connect();
    };

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  // Adjusting opacity depending on theme
  return <canvas ref={canvasRef} className={`absolute inset-0 z-[1] ${theme === 'dark' ? 'opacity-70' : 'opacity-40'} transition-opacity duration-700`} />;
};

// --- Data Config ---
// Restored colors to their original state (blue/emerald/amber/red)
const triadData = [
  {
    id: 0,
    title: "Contextual Identity",
    algorithm: "One-Class SVM",
    description: "Prevents 'Impossible Travel' and device spoofing by analyzing Geolocation, IP reputation, OS fingerprints, and time-of-day patterns.",
    icon: Globe2,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 1,
    title: "HCI Biometrics",
    algorithm: "Deep Autoencoder",
    description: "Catches hijacked sessions by mapping micro-keystroke delays, mouse velocity, and screen navigation entropy.",
    icon: BrainCircuit,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 2,
    title: "Endpoint Telemetry",
    algorithm: "Gaussian Mixture Models",
    description: "Detects insider threats by calculating the probability density of raw packet bytes and background processes.",
    icon: Server,
    color: "from-teal-500 to-emerald-500",
  },
];

const teamData = [
  { name: "Yashika", role: "Lead ML Engineer", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yashika&backgroundColor=b6e3f4" },
  { name: "Alex Chen", role: "Frontend Architect", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=c0aede" },
  { name: "Sarah Jones", role: "Security Analyst", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=ffdfbf" },
  { name: "David Kim", role: "Backend Developer", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David&backgroundColor=d1d4f9" }
];

export default function App() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [theme, setTheme] = useState("dark"); // Default to dark mode

  // FIX FOR DARK MODE: Sync the theme correctly with the document class so Tailwind 'dark:' prefix triggers globally
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    // FULL HEIGHT GLOBAL WRAPPER: Implements a global gradient and continuous scrolling background.
    <div className="relative min-h-screen text-slate-900 dark:text-neutral-100 font-sans selection:bg-blue-500/30 overflow-x-hidden transition-colors duration-700 ease-in-out">

      {/* 
        Continuous Global Background with Grid layer
        - Background is a smooth gradient that morphs between light and dark modes.
        - The Grid is overlaid seamlessly. 
      */}
      <div className="fixed inset-0 z-[-1] transition-colors duration-700 pointer-events-none
        bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 
        dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-40 dark:opacity-20 transition-opacity duration-700
          bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] 
          dark:bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] 
          bg-[size:60px_60px]">
        </div>
      </div>

      {/* Navbar / Theme Toggle */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center p-6 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md border-b border-slate-200 dark:border-neutral-800/40 transition-colors duration-700">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight z-10 transition-colors duration-700">
          <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-500 transition-colors duration-700" />
          <span>Neurometric<span className="text-blue-600 dark:text-blue-500 transition-colors duration-700">Shield</span></span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-slate-200 dark:bg-neutral-800/50 text-slate-600 dark:text-neutral-300 hover:scale-110 transition-all z-10 duration-700 shadow-sm border border-slate-300 dark:border-neutral-700"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </nav>

      {/* --- SECTION 1: THE HERO --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden bg-transparent">

        {/* Interactive Neural Canvas Background overrides the lower z-index continuous grid just for the hero */}
        <NeuralBackground theme={theme} />

        {/* Static Gradients for depth */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
          <motion.div
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-blue-500/30 dark:bg-blue-600/30 blur-[100px] rounded-full"
          />
          <motion.div
            animate={{ opacity: [0.05, 0.2, 0.05] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-40 -left-40 w-[30rem] h-[30rem] bg-indigo-500/30 dark:bg-indigo-600/30 blur-[100px] rounded-full"
          />
        </div>

        <div className="w-full max-w-5xl flex flex-col items-center z-10 pt-20 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center justify-center px-4 py-1.5 mb-8 text-sm font-medium text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-500/50 rounded-full shadow-lg backdrop-blur-md transition-colors duration-700"
          >
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Neural Telemetry Online
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-center mb-6 text-slate-900 dark:text-white leading-tight drop-shadow-sm transition-colors duration-700"
          >
            Beyond Passwords.<br />
            <motion.span
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
              className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 dark:from-blue-400 dark:via-indigo-400 dark:to-cyan-400 inline-block"
            >
              True Zero-Trust Security.
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-lg sm:text-xl text-slate-700 dark:text-neutral-300/80 text-center max-w-3xl mb-12 leading-relaxed bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/40 dark:border-white/10 shadow-lg transition-colors duration-700"
          >
            Welcome to <strong>Neurometric Shield</strong>. An enterprise-grade UEBA platform that doesn't just check who logs in, but analyzes <em>how</em> they behave using multi-dimensional Machine Learning.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 w-full justify-center"
          >
            <a href="/prototype" target="_blank" className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg blur opacity-40 dark:opacity-70 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
              <div className="relative flex items-center justify-center px-8 py-4 bg-slate-900 dark:bg-neutral-950 border border-slate-800 dark:border-neutral-900 rounded-lg text-white font-medium hover:bg-slate-800 dark:hover:bg-neutral-900 transition-all w-full sm:w-auto shadow-xl">
                <Activity className="w-5 h-5 mr-2 text-blue-400" />
                Launch Live Prototype
              </div>
            </a>

            <a href="/dashboard" target="_blank">
              <div className="flex items-center justify-center px-8 py-4 bg-white/90 dark:bg-neutral-900/40 backdrop-blur-sm border border-slate-200 dark:border-neutral-700/50 rounded-lg text-slate-700 dark:text-neutral-200 font-medium hover:bg-white dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white transition-all w-full sm:w-auto shadow-lg">
                <ShieldCheck className="w-5 h-5 mr-2 text-slate-600 dark:text-neutral-400 transition-colors duration-700" />
                Enter SOC Dashboard
              </div>
            </a>
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 2: ADAPTIVE ACCESS --- */}
      {/* Background set to transparent / semi-transparent to allow main grid gradient through */}
      <section className="py-24 px-6 sm:px-12 bg-transparent relative z-10 transition-colors duration-700 border-t border-slate-200/50 dark:border-neutral-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">Continuous <span className="text-blue-600 dark:text-blue-400 transition-colors duration-700">Risk Assessment.</span></h2>
            <p className="text-slate-600 dark:text-neutral-400 max-w-2xl mx-auto transition-colors duration-700">
              Authentication isn't a single event. Our AI calculates continuous neurometric confidence, adapting security policies dynamically.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Proper Login */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-emerald-200 dark:border-emerald-900/50 p-8 rounded-2xl relative overflow-hidden group hover:shadow-[0_0_30px_rgba(52,211,153,0.15)] transition-all duration-500 shadow-md"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center transition-colors duration-700">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider transition-colors duration-700">Verified</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-3 dark:text-white transition-colors duration-700">Frictionless Access</h3>

              <div className="space-y-2 mb-4 transition-colors duration-700">
                <div className="flex justify-between text-xs font-mono border-b border-slate-200 dark:border-neutral-800/50 pb-1 transition-colors duration-700">
                  <span className="text-slate-500 dark:text-neutral-400 transition-colors duration-700">Biometric Signature:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold transition-colors duration-700">ALIGNED</span>
                </div>
                <div className="flex justify-between text-xs font-mono border-b border-slate-200 dark:border-neutral-800/50 pb-1 transition-colors duration-700">
                  <span className="text-slate-500 dark:text-neutral-400 transition-colors duration-700">Network Telemetry:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold transition-colors duration-700">NORMATIVE</span>
                </div>
              </div>

              <p className="text-slate-600 dark:text-neutral-400 text-sm transition-colors duration-700">
                Behavior perfectly matches the user's historical baseline. System access is seamlessly granted without interrupting workflow.
              </p>
            </motion.div>

            {/* Semi Login */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-amber-200 dark:border-amber-900/50 p-8 rounded-2xl relative overflow-hidden group hover:shadow-[0_0_30px_rgba(251,191,36,0.15)] transition-all duration-500 shadow-md"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center transition-colors duration-700">
                  <Radio className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider transition-colors duration-700">Diverging</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-3 dark:text-white transition-colors duration-700">Stepped-Up Auth</h3>

              <div className="space-y-2 mb-4 transition-colors duration-700">
                <div className="flex justify-between text-xs font-mono border-b border-slate-200 dark:border-neutral-800/50 pb-1 transition-colors duration-700">
                  <span className="text-slate-500 dark:text-neutral-400 transition-colors duration-700">Behavioral Drift:</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold transition-colors duration-700">ELEVATED</span>
                </div>
                <div className="flex justify-between text-xs font-mono border-b border-slate-200 dark:border-neutral-800/50 pb-1 transition-colors duration-700">
                  <span className="text-slate-500 dark:text-neutral-400 transition-colors duration-700">Action Required:</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold transition-colors duration-700">MFA PROMPT</span>
                </div>
              </div>

              <p className="text-slate-600 dark:text-neutral-400 text-sm transition-colors duration-700">
                Valid credentials but unusual rhythm or location detected. User is temporarily restricted until supplementary identity proofing is provided.
              </p>
            </motion.div>

            {/* Abnormal Login */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-red-200 dark:border-red-900/50 p-8 rounded-2xl relative overflow-hidden group hover:shadow-[0_0_30px_rgba(248,113,113,0.15)] transition-all duration-500 shadow-md"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center transition-colors duration-700">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 uppercase tracking-wider transition-colors duration-700">Critical</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-3 dark:text-white transition-colors duration-700">Session Terminated</h3>

              <div className="space-y-2 mb-4 transition-colors duration-700">
                <div className="flex justify-between text-xs font-mono border-b border-slate-200 dark:border-neutral-800/50 pb-1 transition-colors duration-700">
                  <span className="text-slate-500 dark:text-neutral-400 transition-colors duration-700">Threat Vector:</span>
                  <span className="text-red-600 dark:text-red-400 font-bold transition-colors duration-700">HOSTILE BOT</span>
                </div>
                <div className="flex justify-between text-xs font-mono border-b border-slate-200 dark:border-neutral-800/50 pb-1 transition-colors duration-700">
                  <span className="text-slate-500 dark:text-neutral-400 transition-colors duration-700">SOC Status:</span>
                  <span className="text-red-600 dark:text-red-400 font-bold transition-colors duration-700">ALERT DISPATCHED</span>
                </div>
              </div>

              <p className="text-slate-600 dark:text-neutral-400 text-sm transition-colors duration-700">
                Overt anomaly matching attack signatures (e.g., impossible travel, automated navigation). Connection is severed instantly.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- SECTION 3: THE CORE TRIAD --- */}
      {/* Background translucent to show the seamless page gradient */}
      <section className="py-24 px-6 sm:px-12 bg-slate-50/50 dark:bg-neutral-900/30 backdrop-blur-sm border-t border-slate-200/50 dark:border-neutral-800/50 relative z-10 transition-colors duration-700">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">Powered by a Multi-Dimensional <span className="text-blue-500 dark:text-blue-400 transition-colors duration-700">AI Ensemble.</span></h2>
            <p className="text-slate-600 dark:text-neutral-400 max-w-2xl mx-auto transition-colors duration-700">Three specialized ML engines working in harmony to establish a baseline of normal behavior.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-5 flex flex-col gap-4"
            >
              {triadData.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSlide(index)}
                  className={`text-left p-6 rounded-xl border transition-all duration-500 backdrop-blur-sm ${activeSlide === index
                    ? "bg-white dark:bg-neutral-800/80 border-slate-300 dark:border-neutral-600 shadow-xl shadow-blue-900/10"
                    : "bg-white/40 border-slate-200 dark:border-neutral-800/50 hover:border-slate-300 dark:hover:border-neutral-700 hover:bg-white/80 dark:hover:bg-neutral-800/50 text-slate-500 dark:text-neutral-500"
                    }`}
                >
                  <h3 className={`text-xl font-bold mb-1 transition-colors duration-500 ${activeSlide === index ? "text-slate-900 dark:text-white" : ""}`}>
                    {item.title}
                  </h3>
                  <p className={`text-sm font-mono transition-colors duration-500 ${activeSlide === index ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-neutral-500"}`}>{item.algorithm}</p>
                </button>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7 relative h-[450px] rounded-2xl border border-slate-200/50 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md overflow-hidden flex flex-col items-center justify-center p-8 transition-colors duration-700 shadow-xl"
            >
              {/* PLACEHOLDER FOR AI MODEL GRAPHICS */}
              <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI2NjdWEzMyIvPjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI2Q0ZDRkOCIvPjwvc3ZnPg==')] transition-colors duration-700"></div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="flex flex-col items-center text-center max-w-md z-10"
                >
                  <div className={`w-28 h-28 rounded-2xl mb-8 flex items-center justify-center bg-gradient-to-tr ${triadData[activeSlide].color} shadow-lg shadow-blue-500/20 transition-all duration-700`}>
                    {(() => {
                      const Icon = triadData[activeSlide].icon;
                      return <Icon className="w-14 h-14 text-white" />;
                    })()}
                  </div>

                  <div className="w-full h-32 mb-6 bg-slate-100/50 dark:bg-neutral-950/50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-neutral-800 overflow-hidden relative transition-colors duration-700">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    <p className="text-xs text-slate-500 dark:text-neutral-500 font-mono relative z-10 p-2 transition-colors duration-700">Insert {triadData[activeSlide].algorithm} Chart</p>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 transition-colors duration-700">{triadData[activeSlide].title}</h3>
                  <p className="text-slate-600 dark:text-neutral-400 leading-relaxed transition-colors duration-700">
                    {triadData[activeSlide].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- SECTION 4: MEET THE TEAM --- */}
      <section className="py-24 px-6 sm:px-12 bg-transparent relative z-10 transition-colors duration-700 border-t border-slate-200/50 dark:border-neutral-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">Meet The <span className="text-emerald-500 dark:text-emerald-400 transition-colors duration-700">Architects.</span></h2>
            <p className="text-slate-600 dark:text-neutral-400 max-w-2xl mx-auto transition-colors duration-700">The engineering and security minds behind the Neurometric Shield infrastructure.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamData.map((member, i) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                key={i}
                className="flex flex-col items-center bg-white/60 dark:bg-neutral-900/50 backdrop-blur-sm border border-slate-200/60 dark:border-neutral-800/60 p-8 rounded-2xl hover:border-slate-300 dark:hover:border-neutral-700 transition-all duration-500 hover:shadow-lg group shadow-sm"
              >
                <div className="w-24 h-24 mb-6 rounded-full border-4 border-white dark:border-neutral-800 shadow-md overflow-hidden bg-slate-200 dark:bg-neutral-800 group-hover:scale-105 transition-transform duration-500">
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 transition-colors duration-700">{member.name}</h3>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-4 transition-colors duration-700">{member.role}</p>

                <div className="flex gap-3 text-slate-400 dark:text-neutral-500 transition-colors duration-700">
                  <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors duration-300"><Github className="w-5 h-5" /></a>
                  <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors duration-300"><Mail className="w-5 h-5" /></a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 5: FOOTER & CONTACT --- */}
      <footer className="pt-24 pb-12 px-6 sm:px-12 bg-slate-100/80 dark:bg-neutral-950/80 backdrop-blur-md border-t border-slate-200/50 dark:border-neutral-900/50 relative z-10 transition-colors duration-700">
        <div className="max-w-6xl mx-auto">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-20 border-b border-slate-200 dark:border-neutral-800/50 pb-20 transition-colors duration-700">
            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white transition-colors duration-700">Ready to secure your perimeter?</h3>
              <p className="text-slate-600 dark:text-neutral-400 mb-8 max-w-md transition-colors duration-700">
                Experience Neurometric Shield in action. Explore the interactive SOC dashboard or test the anomaly engine directly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <a href="/prototype" className="w-full">
                  <div className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors shadow-lg">
                    Live Prototype <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </a>
                <a href="/dashboard" className="w-full">
                  <div className="flex items-center justify-center px-6 py-3 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg text-slate-900 dark:text-white font-medium transition-colors">
                    Open Dashboard
                  </div>
                </a>
              </div>
            </motion.div>

            {/* Contact / Links */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col md:items-end justify-center"
            >
              <div className="space-y-6 w-full md:w-auto">

                {/* GitHub */}
                <a href="https://github.com/Yashika-28/anomaly_detection" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors group">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-slate-200 dark:bg-neutral-900 border border-transparent dark:group-hover:border-blue-500/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-all duration-300">
                    <Github className="w-5 h-5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white transition-colors">Open Source</h4>
                    <p className="text-sm">View repository on GitHub</p>
                  </div>
                </a>

                {/* Email */}
                <a href="mailto:contact@yourdomain.com" className="flex items-center gap-4 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors group">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-slate-200 dark:bg-neutral-900 border border-transparent dark:group-hover:border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-all duration-300">
                    <Mail className="w-5 h-5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white transition-colors">Contact the Team</h4>
                    <p className="text-sm">contact@neurometricshield.com</p>
                  </div>
                </a>

                {/* Phone */}
                <a href="tel:+1234567890" className="flex items-center gap-4 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors group">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-slate-200 dark:bg-neutral-900 border border-transparent dark:group-hover:border-purple-500/30 flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-all duration-300">
                    <Phone className="w-5 h-5 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white transition-colors">Direct Line</h4>
                    <p className="text-sm">+1 (234) 567-890</p>
                  </div>
                </a>

              </div>
            </motion.div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 dark:text-neutral-500 transition-colors duration-700">
            <div className="flex items-center gap-2 mb-4 md:mb-0 font-bold dark:text-neutral-300 transition-colors">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-500 transition-colors duration-700" />
              Neurometric Shield
            </div>
            <p>
              © {new Date().getFullYear()} Neurometric Shield UEBA. Created by Yashika & Team. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}