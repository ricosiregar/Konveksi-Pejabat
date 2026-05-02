import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

// ── Loading spinner kecil saat cek session ──
const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

// Guard untuk halaman USER - harus login
export const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<"loading" | "auth" | "unauth">("loading");

  useEffect(() => {
    // Cek Supabase session langsung, bukan localStorage
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "auth" : "unauth");
    });

    // Listen perubahan auth (logout, expire, dll)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? "auth" : "unauth");
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (status === "loading") return <LoadingScreen />;
  if (status === "unauth") return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

// Guard untuk halaman ADMIN - harus login + role admin
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<"loading" | "auth" | "unauth" | "forbidden">("loading");

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        setStatus("unauth");
        return;
      }

      // Cek role dari tabel profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      const role = profile?.role || "user";

      // Sync localStorage supaya konsisten
      localStorage.setItem("role", role);

      setStatus(role === "admin" ? "auth" : "forbidden");
    };

    checkAdmin();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setStatus("unauth");
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (status === "loading") return <LoadingScreen />;
  if (status === "unauth") return <Navigate to="/auth" replace />;
  if (status === "forbidden") return <Navigate to="/" replace />;
  return <>{children}</>;
};