import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/layout/QueryProvider";

export const metadata: Metadata = {
  title: "BackupOS — Database Backup Management",
  description: "Production-grade database backup management dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}