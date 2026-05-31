"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [typedText, setTypedText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const fullText = "sys.ready — awaiting auth";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    if (!username.trim() || status === "connecting") return;
    setStatus("connecting");

    await new Promise((r) => setTimeout(r, 1200));

    localStorage.setItem("bu_user", username.trim());
    setStatus("connected");

    await new Promise((r) => setTimeout(r, 600));

    try {
      router.push("/dashboard");
      // Fallback agar router kaam na kare
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch {
      window.location.href = "/dashboard";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConnect();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .bu-root {
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: #080d0a;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          position: relative;
          overflow: hidden;
        }

        /* Background grid */
        .bu-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(184,245,58,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(184,245,58,0.03) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }

        /* Corner glow */
        .bu-root::after {
          content: '';
          position: fixed;
          bottom: -120px;
          right: -120px;
          width: 360px;
          height: 360px;
          background: radial-gradient(circle, rgba(184,245,58,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .bu-card {
          background: #0c1410;
          border: 1px solid #1c2820;
          border-radius: 12px;
          width: 100%;
          max-width: 360px;
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
        }

        /* Top accent line */
        .bu-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #b8f53a55 40%, #b8f53a88 60%, transparent 100%);
        }

        /* Scanlines overlay */
        .bu-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(0,0,0,0.06) 3px,
            rgba(0,0,0,0.06) 4px
          );
          pointer-events: none;
          border-radius: 12px;
          z-index: 0;
        }

        .bu-inner { position: relative; z-index: 1; }

        /* Top bar */
        .bu-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .bu-dots { display: flex; gap: 6px; align-items: center; }

        .bu-dot {
          width: 9px; height: 9px;
          border-radius: 50%;
          background: #1a2418;
        }

        .bu-dot-green {
          background: #b8f53a;
          box-shadow: 0 0 8px #b8f53a99;
          animation: pulse-dot 2.5s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 8px #b8f53a99; }
          50% { box-shadow: 0 0 14px #b8f53acc; }
        }

        .bu-version {
          font-size: 10px;
          color: #2e4035;
          background: #0a100d;
          border: 1px solid #1a2418;
          padding: 3px 9px;
          border-radius: 4px;
          letter-spacing: 0.06em;
        }

        .bu-version em { color: #5a7a60; font-style: normal; }

        /* Brand */
        .bu-brand { margin-bottom: 18px; }

        .bu-brand-name {
          font-size: 24px;
          font-weight: 700;
          color: #b8f53a;
          letter-spacing: -0.5px;
          line-height: 1;
        }

        .bu-brand-sub {
          font-size: 10px;
          color: #334a38;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-top: 5px;
        }

        /* Divider */
        .bu-divider {
          height: 1px;
          background: linear-gradient(90deg, #1a2418, #2a3828, #1a2418);
          margin-bottom: 18px;
        }

        /* Status log */
        .bu-statuslog {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 18px;
          min-height: 18px;
        }

        .bu-log-text {
          font-size: 10px;
          color: #3a5040;
          letter-spacing: 0.04em;
        }

        .bu-log-text em { color: #6a9070; font-style: normal; }

        .bu-cursor {
          display: inline-block;
          width: 8px; height: 14px;
          background: #b8f53a;
          animation: blink 1.1s step-end infinite;
          vertical-align: -2px;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Field */
        .bu-field {
          position: relative;
          margin-bottom: 10px;
        }

        .bu-prefix {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #b8f53a;
          font-weight: 700;
          font-size: 14px;
          pointer-events: none;
          font-family: 'JetBrains Mono', monospace;
          z-index: 1;
        }

        .bu-input {
          width: 100%;
          background: #080e0a;
          border: 1px solid #1a2418;
          border-radius: 7px;
          padding: 11px 12px 11px 28px;
          color: #b8d8bc;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          -webkit-appearance: none;
        }

        .bu-input:focus {
          border-color: #b8f53a44;
          background: #0a110c;
          box-shadow: 0 0 0 3px rgba(184,245,58,0.06);
        }

        .bu-input::placeholder { color: #243028; }

        /* Button */
        .bu-btn {
          width: 100%;
          border: none;
          border-radius: 7px;
          padding: 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.06em;
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
          margin-top: 6px;
          position: relative;
          overflow: hidden;
        }

        .bu-btn-idle {
          background: #b8f53a;
          color: #0a1008;
        }

        .bu-btn-idle:hover {
          background: #ccff50;
          box-shadow: 0 4px 20px rgba(184,245,58,0.25);
          transform: translateY(-1px);
        }

        .bu-btn-idle:active { transform: scale(0.98); }

        .bu-btn-connecting {
          background: #1a2818;
          color: #5a7a50;
          cursor: not-allowed;
          border: 1px solid #253523;
        }

        .bu-btn-connected {
          background: #2a5a30;
          color: #7af57a;
          border: 1px solid #3a7040;
        }

        .bu-btn-arrow { font-size: 15px; transition: transform 0.2s; }
        .bu-btn-idle:hover .bu-btn-arrow { transform: translateX(3px); }

        /* Spinner */
        .bu-spinner {
          width: 13px; height: 13px;
          border: 2px solid #3a5040;
          border-top-color: #b8f53a;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer */
        .bu-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 16px;
        }

        .bu-hint { font-size: 10px; color: #253028; }

        .bu-hint kbd {
          background: #0a100d;
          border: 1px solid #1a2418;
          padding: 2px 6px;
          border-radius: 3px;
          color: #3a5040;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
        }

        .bu-roomtag {
          font-size: 10px;
          background: #0a100d;
          border: 1px solid #1a2418;
          padding: 3px 9px;
          border-radius: 4px;
          color: #2e4035;
        }

        .bu-roomtag span { color: #5a7a60; }

        /* Mobile tweaks */
        @media (max-width: 400px) {
          .bu-card { padding: 22px 18px; }
          .bu-brand-name { font-size: 21px; }
        }
      `}</style>

      <div className="bu-root">
        <div className="bu-card">
          <div className="bu-inner">

            {/* Top bar */}
            <div className="bu-topbar">
              <div className="bu-dots">
                <div className="bu-dot bu-dot-green" />
                <div className="bu-dot" />
                <div className="bu-dot" />
              </div>
              <div className="bu-version">
                backup-os <em>v2.4</em>
              </div>
            </div>

            {/* Brand */}
            <div className="bu-brand">
              <div className="bu-brand-name">[BackupOS]</div>
              <div className="bu-brand-sub">database backup management</div>
            </div>

            <div className="bu-divider" />

            {/* Status log with typewriter */}
            <div className="bu-statuslog">
              <span className="bu-log-text">
                $ <em>{typedText}</em>
              </span>
              <span className="bu-cursor" />
            </div>

            {/* Input */}
            <div className="bu-field">
              <span className="bu-prefix">$</span>
              <input
                ref={inputRef}
                className="bu-input"
                type="text"
                placeholder="enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                disabled={status === "connecting" || status === "connected"}
              />
            </div>

            {/* Button */}
            <button
              className={`bu-btn ${
                status === "connecting"
                  ? "bu-btn-connecting"
                  : status === "connected"
                  ? "bu-btn-connected"
                  : "bu-btn-idle"
              }`}
              onClick={handleConnect}
              disabled={status === "connecting" || status === "connected"}
            >
              {status === "connecting" ? (
                <>
                  <span className="bu-spinner" />
                  connecting...
                </>
              ) : status === "connected" ? (
                <>✓ connected — redirecting</>
              ) : (
                <>
                  connect
                  <span className="bu-btn-arrow">→</span>
                </>
              )}
            </button>

            {/* Footer */}
            <div className="bu-footer">
              <div className="bu-hint">
                <kbd>enter</kbd> to join
              </div>
              <div className="bu-roomtag">
                room: <span>backup-room</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}