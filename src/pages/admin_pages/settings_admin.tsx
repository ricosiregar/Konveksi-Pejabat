import { useEffect, useState } from "react";
import { User, Store, LogOut, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

export default function AdminSettings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setEmail(data.user.email || "");
        setName(data.user.user_metadata?.full_name || "Admin");
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/auth");
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-gray-500 mt-1">Kelola akun dan konfigurasi sistem</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="rounded-xl bg-orange-100 p-2">
            <User className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Profil Admin</h2>
            <p className="text-sm text-gray-400">Informasi akun administrator</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama</label>
            <input
              value={name}
              disabled
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
            <input
              value={email}
              disabled
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700"
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1.5">
          <Shield className="h-3.5 w-3.5 text-orange-600" />
          <span className="text-xs font-semibold text-orange-700">Role: Administrator</span>
        </div>
      </div>

      {/* Logout */}
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Keluar dari Admin Panel</h2>
          <p className="text-sm text-gray-500 mt-0.5">Sesi Anda akan berakhir</p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}