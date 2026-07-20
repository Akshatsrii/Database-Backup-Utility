"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Database, Shield, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    localStorage.setItem("bu_user", username);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md p-8 relative z-10">
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 rounded-2xl shadow-2xl p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-500">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <Database size={32} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold text-slate-50 tracking-tight mb-2">BackupOS</h1>
            <p className="text-sm text-slate-400 font-medium tracking-wide">ENTERPRISE DATABASE MANAGEMENT</p>
          </div>

          <form onSubmit={handleConnect} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Username</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-indigo-400 transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Enter your handle..."
                  value={username}
                  className="w-full bg-slate-950/50 border border-slate-700 text-slate-100 placeholder:text-slate-600 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all duration-300 active:scale-[0.98]"
            >
              Secure Login
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Systems Operational
            </div>
            <span className="opacity-50">v1.0.0</span>
          </div>

        </div>

        {/* Links */}
        <div className="mt-8 text-center flex items-center justify-center gap-6 text-sm text-slate-400 font-medium">
          <Link href="/about" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
            <Shield size={14} />
            About Platform
          </Link>
          <a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a>
        </div>

      </div>
    </div>
  );
}