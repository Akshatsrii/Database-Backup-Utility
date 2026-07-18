"use client";

import { useEffect, useRef } from "react";
import { usePathname }       from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar  from "./TopBar";

// BUGFIX: pehle FADE_CSS inline <style dangerouslySetInnerHTML> se inject
// hoti thi — yeh hydration error cause karta hai (server HTML-encodes
// single quotes, client nahi karta → mismatch).
// CSS globals.css mein move kar di — wahan se aayegi.

export default function PageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname  = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="min-h-screen flex" style={{ overflow: "hidden" }}>
      <Sidebar />

      <div
        className="flex-1 flex flex-col"
        style={{ marginLeft: "224px", minWidth: 0 }}
      >
        <TopBar />

        <main
          ref={scrollRef}
          className="flex-1 p-6 overflow-y-auto"
          style={{
            paddingTop: "calc(48px + 24px)",
            height:     "100vh",
            animation:  "pw-fadein 0.18s ease-out both",
          }}
          key={pathname}
        >
          {children}
        </main>
      </div>
    </div>
  );
}