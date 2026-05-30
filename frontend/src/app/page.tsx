"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <main className="min-h-screen flex items-center justify-center p-4">
      <div
        className="terminal-card w-full max-w-sm p-8"
        style={{ boxShadow: "0 0 0 1px #252825, 0 24px 64px rgba(0,0,0,0.6)" }}
      >
        {/* Top status line */}
        <div className="flex items-center gap-2 mb-6">
          <span
            className="status-dot"
            style={{ background: "#b8f53a", boxShadow: "0 0 6px #b8f53a" }}
          />
          <span className="text-xs tracking-widest" style={{ color: "#4a5450" }}>
            backup-os.onrender.com
          </span>
        </div>

        {/* Brand */}
        <h1
          className="text-3xl font-bold mb-1 tracking-tight"
          style={{ color: "#b8f53a" }}
        >
          [BackupOS]
        </h1>
        <p className="text-xs tracking-widest mb-8" style={{ color: "#8a9690" }}>
          database backup management platform
        </p>

        {/* Form */}
        <form onSubmit={handleConnect} className="space-y-4">
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 font-bold"
              style={{ color: "#b8f53a" }}
            >
              $
            </span>
            <input
              className="terminal-input pl-9"
              type="text"
              placeholder="enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn-acid w-full flex items-center justify-center gap-2"
          >
            connect
            <span className="text-base">→</span>
          </button>
        </form>

        {/* Hint */}
        <p className="mt-5 text-center text-xs" style={{ color: "#4a5450" }}>
          <kbd
            className="px-1.5 py-0.5 rounded text-xs border"
            style={{ borderColor: "#252825", color: "#8a9690" }}
          >
            enter
          </kbd>{" "}
          to join · room:{" "}
          <span style={{ color: "#8a9690" }}>backup-room</span>
        </p>
      </div>
    </main>
  );
}