import { cn } from "@/lib/utils";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  ShoppingCart,
  Package,
  Clock,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import {
  getSessions,
  deleteSession,
  formatRelativeTime,
  type ChatSession,
} from "@/services/chat_service";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: MessageSquare, label: "Chat AI", path: "/chat" },
  { icon: ShoppingBag, label: "Katalog Produk", path: "/catalog" },
  { icon: ShoppingCart, label: "Keranjang", path: "/cart", showBadge: true },
  { icon: Package, label: "Pesanan", path: "/orders" },
  { icon: Settings, label: "Pengaturan", path: "/settings" },
];

export function DashboardSidebar({ 
  mobileOpen, 
  setMobileOpen 
}: { 
  mobileOpen?: boolean; 
  setMobileOpen?: (open: boolean) => void 
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const location = useLocation();
  const navigate = useNavigate();
  const isOnChat = location.pathname === "/chat";

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (userId && isOnChat) {
      loadHistory();
    }
  }, [userId, isOnChat]);

  useEffect(() => {
    if (!userId || !isOnChat) return;

    const channel = supabase
      .channel("chat_sessions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_sessions",
          filter: `user_id=eq.${userId}`,
        },
        () => loadHistory()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, isOnChat]);

  const loadHistory = async () => {
    if (!userId) return;
    setLoadingHistory(true);
    const data = await getSessions(userId);
    setSessions(data);
    setLoadingHistory(false);
  };

  const handleNewChat = () => {
    navigate("/chat", { state: { newSession: Date.now() } });
  };

  const handleDeleteSession = async (
    e: React.MouseEvent,
    sessionId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleLoadSession = (session: ChatSession) => {
    navigate("/chat", { state: { sessionId: session.id } });
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 md:relative md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--hero-gradient)]">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight"></span>
        )}
        <button 
          className="ml-auto md:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
          onClick={() => setMobileOpen?.(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            onClick={() => setMobileOpen?.(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70"
              )
            }
          >
            <div className="relative shrink-0">
              <item.icon className="h-5 w-5" />
              {item.showBadge && cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </div>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Chat History */}
      {!collapsed && isOnChat && (
        <div className="flex flex-col flex-1 overflow-hidden px-3 pb-3">
          <div className="flex items-center justify-between py-2 mt-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              <Clock className="h-3.5 w-3.5" />
              <span>Riwayat Chat</span>
            </div>
            <button
              onClick={handleNewChat}
              title="Chat baru"
              className="flex h-6 w-6 items-center justify-center rounded-md text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-0.5 overflow-y-auto flex-1">
            {loadingHistory ? (
              <div className="flex flex-col gap-1 mt-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-sidebar-accent/40 animate-pulse" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-[11px] text-sidebar-foreground/30 text-center mt-4">
                Belum ada riwayat chat
              </p>
            ) : (
              sessions.map((session) => (
                // ✅ Ganti button luar jadi div untuk hindari button-in-button
                <div
                  key={session.id}
                  onClick={() => handleLoadSession(session)}
                  onMouseEnter={() => setHoveredId(session.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group flex w-full items-start justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-sidebar-accent cursor-pointer"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="line-clamp-1 text-xs font-medium text-sidebar-foreground/80 group-hover:text-sidebar-foreground">
                      {session.title}
                    </span>
                    <span className="text-[10px] text-sidebar-foreground/40">
                      {formatRelativeTime(session.updated_at)}
                    </span>
                  </div>
                  {hoveredId === session.id && (
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="ml-1 shrink-0 flex h-5 w-5 items-center justify-center rounded text-sidebar-foreground/40 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!isOnChat && <div className="flex-1" />}

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md transition-colors hover:bg-sidebar-accent"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        {!collapsed && (
          <p className="text-xs text-sidebar-foreground/50">Powered by N8N</p>
        )}
      </div>
    </aside>
  );
}