import { useState } from "react";
import { DashboardSidebar } from "@/components/components_user/Sidebar";
import { DashboardHeader } from "@/components/components_user/Header";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Menu,
  ShoppingBag,
  LayoutGrid,
  ShoppingCart,
  MessageSquare,
  ClipboardList,
  X,
} from "lucide-react";

// ✅ Bottom nav items untuk mobile — sesuaikan path dengan route yang ada
const mobileNavItems = [
  { to: "/catalog",  icon: LayoutGrid,     label: "Katalog"  },
  { to: "/cart",     icon: ShoppingCart,   label: "Keranjang" },
  { to: "/orders",   icon: ClipboardList,  label: "Pesanan"  },
  { to: "/chat",     icon: MessageSquare,  label: "AI Chat"  },
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden relative">

      {/* ── Mobile Overlay ─────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop + mobile drawer) ─────────────────── */}
      <DashboardSidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />

      {/* ── Main Content ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col w-full min-w-0">

        {/* ── Mobile Top Header ─────────────────────────────── */}
        <header className="flex md:hidden h-14 items-center justify-between border-b border-orange-100 bg-white px-4 sticky top-0 z-30 shadow-sm shadow-orange-50">
          {/* Kiri: burger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-orange-50 text-orange-500 active:scale-95 transition-transform"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Tengah: logo / brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 shadow-sm shadow-orange-300">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <span
              className="font-bold text-base tracking-tight text-gray-900"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Konveksi<span className="text-orange-500">.</span>
            </span>
          </div>

          {/* Kanan: placeholder biar tengah tetap center */}
          <div className="h-9 w-9" />
        </header>

        {/* ── Desktop Header ────────────────────────────────── */}
        <div className="hidden md:block">
          <DashboardHeader />
        </div>

        {/* ── Page Content ──────────────────────────────────── */}
        {/* pb-20 di mobile biar konten tidak ketutup bottom nav */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 w-full pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ──────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-30 md:hidden">
        {/* Frosted glass effect */}
        <div className="mx-3 mb-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-orange-100 shadow-xl shadow-orange-100/50 px-2 py-2">
          <div className="flex items-center justify-around">
            {mobileNavItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  className="flex flex-col items-center gap-0.5 flex-1 py-1 group"
                >
                  <div
                    className={`
                      flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-200
                      ${isActive
                        ? "bg-orange-500 shadow-md shadow-orange-200 scale-105"
                        : "bg-transparent group-active:bg-orange-50"
                      }
                    `}
                  >
                    <Icon
                      className={`h-5 w-5 transition-colors duration-200 ${
                        isActive ? "text-white" : "text-gray-400 group-hover:text-orange-400"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-semibold tracking-wide transition-colors duration-200 ${
                      isActive ? "text-orange-500" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

    </div>
  );
}