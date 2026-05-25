import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className, style }: CardProps) {
  return (
    <div
      className={cn("terminal-card p-5", className)}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div
      className={cn("flex items-center justify-between mb-4 pb-3 border-b", className)}
      style={{ borderColor: "#252825" }}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs tracking-widest uppercase" style={{ color: "#4a5450" }}>
      {children}
    </p>
  );
}