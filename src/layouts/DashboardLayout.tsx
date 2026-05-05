import { useState } from "react";
import { DashboardSidebar } from "@/components/components_user/Sidebar";
import { DashboardHeader } from "@/components/components_user/Header";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <DashboardSidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />
      
      <div className="flex flex-1 flex-col w-full min-w-0">
        {/* Mobile Header Toggle */}
        <header className="flex md:hidden h-14 items-center gap-4 border-b bg-background px-4">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-foreground">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold text-lg">Konveksi</span>
        </header>

        <DashboardHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
