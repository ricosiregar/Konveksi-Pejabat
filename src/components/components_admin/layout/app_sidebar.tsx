import { 
  LayoutDashboard, 
  ShoppingBag, 
  MessageSquare, 
  Package, 
  Settings, 
  LogOut,
  Shirt,
  Moon,
  Sun
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme_providers";
import { Button } from "@/components/widgets/button";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Produk", url: "/products", icon: Shirt },
  { title: "Pesanan", url: "/orders", icon: Package },
  { title: "AI Chat", url: "/chat", icon: MessageSquare },
  { title: "Pengaturan", url: "/settings", icon: Settings },
];

export const AppSidebar = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const handleToggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Shirt className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-accent-foreground">
              Konveksi
            </h1>
            <p className="text-xs text-sidebar-foreground">Pejabat</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <NavLink
                key={item.title}
                to={item.url}
                className={cn(
                  "nav-item",
                  isActive && "active"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-sidebar-border space-y-2">
          <Button
            variant="ghost"
            onClick={handleToggleTheme}
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};
