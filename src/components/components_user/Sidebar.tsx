import { cn } from "@/lib/utils";
import { NavLink, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: MessageSquare, label: "Chat AI", path: "/chat" },
  { icon: ShoppingBag, label: "Katalog Produk", path: "/catalog" },
  { icon: ShoppingCart, label: "Keranjang", path: "/cart", showBadge: true },
  { icon: Package, label: "Pesanan", path: "/orders" },
  { icon: Settings, label: "Pengaturan", path: "/settings" },
];

// Dummy history chat — nanti bisa diganti dengan state/context real
const chatHistory = [
  { id: "1", label: "Jersey merah hitam tim A", time: "Hari ini" },
  { id: "2", label: "Kemeja kantor biru navy", time: "Kemarin" },
  { id: "3", label: "Kaos outing pantai", time: "2 hari lalu" },
  { id: "4", label: "Seragam batik perusahaan", time: "Minggu lalu" },
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const location = useLocation();
  const isOnChat = location.pathname === "/chat";

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
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
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
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

      {/* Chat History Section — only visible when not collapsed & on /chat */}
      {!collapsed && isOnChat && (
        <div className="flex flex-col flex-1 overflow-hidden px-3 pb-3">
          {/* Divider + header */}
          <div className="flex items-center justify-between py-2 mt-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              <Clock className="h-3.5 w-3.5" />
              <span>Riwayat Chat</span>
            </div>
            <button
              title="Chat baru"
              className="flex h-6 w-6 items-center justify-center rounded-md text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* History list */}
          <div className="flex flex-col gap-0.5 overflow-y-auto flex-1">
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                className="group flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors hover:bg-sidebar-accent"
              >
                <span className="line-clamp-1 text-xs font-medium text-sidebar-foreground/80 group-hover:text-sidebar-foreground">
                  {chat.label}
                </span>
                <span className="text-[10px] text-sidebar-foreground/40">
                  {chat.time}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spacer when not on chat page */}
      {!isOnChat && <div className="flex-1" />}

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md transition-colors hover:bg-sidebar-accent"
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