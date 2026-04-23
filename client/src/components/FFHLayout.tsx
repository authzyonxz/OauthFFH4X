import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useFFHAuth } from "@/contexts/FFHAuthContext";
import {
  LayoutDashboard, Key, Package, Users, FileText, CreditCard,
  LogOut, Shield, Menu, X, ChevronRight, Tag, Settings,
  Activity, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Keys", href: "/keys", icon: Key },
  { label: "Packages", href: "/packages", icon: Package },
  { label: "Prefixos", href: "/prefixes", icon: Tag },
  { label: "Usuários", href: "/users", icon: Users, adminOnly: true },
  { label: "Créditos", href: "/credits", icon: CreditCard, adminOnly: true },
  { label: "Logs", href: "/logs", icon: FileText, adminOnly: true },
  { label: "API Docs", href: "/api-docs", icon: Zap },
];

export default function FFHLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useFFHAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const filteredNav = navItems.filter(item => !item.adminOnly || user?.role === "admin");

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b" style={{ borderColor: "oklch(0.18 0.02 260)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.22 260 / 0.2), oklch(0.6 0.22 290 / 0.2))",
              border: "1px solid oklch(0.65 0.22 260 / 0.3)"
            }}>
            <Shield className="w-5 h-5" style={{ color: "oklch(0.65 0.22 260)" }} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide" style={{ color: "oklch(0.92 0.01 260)" }}>
              AUTH <span style={{ color: "oklch(0.65 0.22 260)" }}>FFH4X</span>
            </div>
            <div className="text-xs" style={{ color: "oklch(0.45 0.02 260)" }}>
              {user?.role === "admin" ? "Administrador" : "Revendedor"}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {filteredNav.map(item => {
          const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                isActive
                  ? "text-[oklch(0.75_0.15_260)]"
                  : "text-[oklch(0.55_0.02_260)] hover:text-[oklch(0.88_0.01_260)]"
              )}
                style={isActive ? {
                  background: "oklch(0.65 0.22 260 / 0.12)",
                  borderLeft: "2px solid oklch(0.65 0.22 260)",
                  paddingLeft: "calc(0.75rem - 2px)"
                } : {
                  borderLeft: "2px solid transparent",
                }}>
                <item.icon className={cn("w-4 h-4 flex-shrink-0 transition-colors",
                  isActive ? "text-[oklch(0.65_0.22_260)]" : "group-hover:text-[oklch(0.65_0.22_260)]"
                )} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "oklch(0.18 0.02 260)" }}>
        <div className="rounded-xl p-3 mb-3" style={{ background: "oklch(0.14 0.02 260)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, oklch(0.65 0.22 260 / 0.3), oklch(0.6 0.22 290 / 0.3))",
                color: "oklch(0.75 0.15 260)"
              }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: "oklch(0.88 0.01 260)" }}>
                {user?.username}
              </div>
              {user?.role === "reseller" && (
                <div className="text-xs" style={{ color: "oklch(0.5 0.02 260)" }}>
                  <Activity className="w-3 h-3 inline mr-1" />
                  {user.credits} créditos
                </div>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-xs h-8 hover:bg-destructive/10 hover:text-destructive"
          style={{ color: "oklch(0.5 0.02 260)" }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "oklch(0.08 0.01 260)" }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r"
        style={{
          background: "oklch(0.07 0.01 260)",
          borderColor: "oklch(0.18 0.02 260)"
        }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col border-r"
            style={{
              background: "oklch(0.07 0.01 260)",
              borderColor: "oklch(0.18 0.02 260)"
            }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b flex-shrink-0"
          style={{
            background: "oklch(0.09 0.012 260)",
            borderColor: "oklch(0.18 0.02 260)"
          }}>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: "oklch(0.65 0.22 260)" }} />
            <span className="text-sm font-bold" style={{ color: "oklch(0.92 0.01 260)" }}>AUTH FFH4X</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
