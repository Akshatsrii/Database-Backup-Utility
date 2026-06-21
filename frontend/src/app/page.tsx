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
    // ❌ <style> tag YAHAN BILKUL NAHI HONA CHAHIYE
    // ✅ Sirf className use karo — CSS globals.css se aayega
    <div className="bu-root">
      <div className="bu-card">
        <div className="bu-inner">

          <div className="bu-topbar">
            <div className="bu-dots">
              <span className="bu-dot bu-dot-green" />
              <span className="bu-dot" />
              <span className="bu-dot" />
            </div>
            <span className="bu-version">v<em>1.0.0</em></span>
          </div>

          <div className="bu-brand">
            <p className="bu-brand-name">[BackupOS]</p>
            <p className="bu-brand-sub">database backup platform</p>
          </div>

          <div className="bu-divider" />

          <div className="bu-statuslog">
            <span className="bu-log-text">
              <em>$</em> ready to connect
            </span>
            <span className="bu-cursor" />
          </div>

          <form onSubmit={handleConnect}>
            <div className="bu-field">
              <span className="bu-prefix">$</span>
              <input
                className="bu-input"
                type="text"
                placeholder="enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>

            <button type="submit" className="bu-btn bu-btn-idle">
              connect
              <span className="bu-btn-arrow">→</span>
            </button>
          </form>

          <div className="bu-footer">
            <span className="bu-hint">
              <kbd>enter</kbd> to join
            </span>
            <span className="bu-roomtag">
              room: <span>backup-room</span>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}