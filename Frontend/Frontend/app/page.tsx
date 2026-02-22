import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 sm:p-12 font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 blur-3xl rounded-full"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 bg-blue-600/20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-teal-600/10 blur-3xl rounded-full"></div>
      </div>

      <div className="w-full max-w-4xl flex flex-col items-center">
        <div className="inline-flex items-center justify-center px-4 py-1.5 mb-8 text-sm font-medium text-purple-300 bg-purple-900/30 border border-purple-500/30 rounded-full shadow-lg backdrop-blur-sm">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          System Active
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 leading-tight">
          UEBA Monitoring
        </h1>

        <p className="text-lg sm:text-xl text-neutral-400 text-center max-w-2xl mb-12 leading-relaxed">
          Advanced User and Entity Behavior Analytics. Detect anomalies, monitor threats, and secure your infrastructure with real-time intelligence.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          <Link href="/prototype" target="_blank" className="group relative w-full">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative flex flex-col h-full p-8 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors z-10">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Open Prototype</h2>
              <p className="text-sm text-neutral-400 flex-grow">
                Explore the latest experimental features and analytical models.
              </p>
              <div className="mt-6 flex items-center text-sm font-medium text-blue-400">
                Launch App <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link href="/dashboard" target="_blank" className="group relative w-full">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-blue-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative flex flex-col h-full p-8 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors z-10">
              <div className="h-12 w-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-6 border border-teal-500/20 text-teal-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">SOC Dashboard</h2>
              <p className="text-sm text-neutral-400 flex-grow">
                Access the main Security Operations Center monitoring view.
              </p>
              <div className="mt-6 flex items-center text-sm font-medium text-teal-400">
                Launch App <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}