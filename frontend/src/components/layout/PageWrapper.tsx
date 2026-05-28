"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const FADE_CSS = `
@keyframes pw-fadein {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0);   }
}
`;

export default function PageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname   = usePathname();
  const scrollRef  = useRef<HTMLDivElement>(null);

  /* scroll content area to top on route change */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FADE_CSS }} />

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
              /* keep content scrollable without moving the sidebar/topbar */
              height: "100vh",
              /* fade-in on every route change keyed by pathname */
              animation: "pw-fadein 0.18s ease-out both",
            }}
            key={pathname}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}