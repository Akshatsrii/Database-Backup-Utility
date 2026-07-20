import Link from "next/link";
import { ArrowLeft, Shield, Database, Zap, HardDrive, Cpu, Cloud } from "lucide-react";

export default function AboutPage() {
  const features = [
    {
      icon: <Database size={24} className="text-indigo-400" />,
      title: "Multi-Database Support",
      description: "Seamlessly backup PostgreSQL, MySQL, and MongoDB clusters with zero downtime using our smart streaming protocols."
    },
    {
      icon: <Shield size={24} className="text-emerald-400" />,
      title: "Military-Grade Security",
      description: "All backups are encrypted at rest using AES-256 and in transit via TLS 1.3. Your data never leaves the secure vault unencrypted."
    },
    {
      icon: <Zap size={24} className="text-amber-400" />,
      title: "Zstandard Compression",
      description: "Achieve up to 80% storage savings with multi-threaded Zstd compression, saving you terabytes of cloud storage costs."
    },
    {
      icon: <Cpu size={24} className="text-blue-400" />,
      title: "Automated Scheduling",
      description: "Set it and forget it. Define granular cron schedules for your backups, complete with automated retry logic and alerting."
    },
    {
      icon: <HardDrive size={24} className="text-rose-400" />,
      title: "Smart Retention",
      description: "Automatically prune old backups using grandfather-father-son (GFS) rotation policies to keep storage costs predictable."
    },
    {
      icon: <Cloud size={24} className="text-sky-400" />,
      title: "Multi-Cloud Storage",
      description: "Push your backups directly to AWS S3, Google Cloud Storage, Azure Blob, or any S3-compatible storage provider."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-emerald-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-20 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Login</span>
          </Link>
          <div className="flex items-center gap-2">
            <Database size={20} className="text-indigo-500" />
            <span className="font-bold text-lg tracking-tight">BackupOS</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        
        {/* Header Section */}
        <div className="max-w-3xl mx-auto text-center mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
            <Shield size={14} />
            Enterprise Infrastructure
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-slate-100 to-slate-500">
            Secure, Automated Database Backups
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            BackupOS is a production-grade infrastructure platform designed to handle mission-critical database backups. 
            We ensure your data is always safe, highly compressed, and readily available for disaster recovery.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div 
              key={idx}
              className="bg-slate-900/40 backdrop-blur-lg border border-slate-800/60 p-8 rounded-2xl hover:bg-slate-800/40 hover:border-indigo-500/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                {feat.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-100">{feat.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {feat.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-32 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/80 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <h2 className="text-3xl font-bold mb-4">Ready to secure your data?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Join thousands of engineering teams that trust BackupOS to handle their disaster recovery infrastructure.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-3 px-8 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
            >
              Enter Dashboard
            </Link>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 py-8 mt-20 text-center text-sm text-slate-500">
        <p>© 2026 BackupOS Infrastructure. All rights reserved.</p>
      </footer>

    </div>
  );
}
