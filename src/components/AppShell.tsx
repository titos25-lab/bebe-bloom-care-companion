import { Link } from "@tanstack/react-router";
import { Home, BookOpen, ClipboardList, MessageCircleHeart, User, Siren } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/aprender", label: "Aprender", icon: BookOpen },
  { to: "/registos", label: "Registos", icon: ClipboardList },
  { to: "/assistente", label: "Assistente", icon: MessageCircleHeart },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background/90 px-5 py-3 backdrop-blur">
        <Link to="/inicio" className="font-display text-xl text-primary">Bebê Saudável</Link>
        {title && <span className="text-sm text-muted-foreground">{title}</span>}
        <Link to="/emergencia" className="flex items-center gap-1 rounded-full bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground">
          <Siren className="size-4" /> SOS
        </Link>
      </header>
      <main className="px-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t bg-card/95 backdrop-blur">
        <ul className="grid grid-cols-5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link to={to} className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] text-muted-foreground" activeProps={{ className: "text-primary font-semibold" }}>
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-card p-4 shadow-soft ${className}`}>{children}</div>;
}
