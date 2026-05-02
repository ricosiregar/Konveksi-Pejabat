import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/widgets/button";
import { Input } from "@/components/widgets/input";
import { Label } from "@/components/widgets/label";
import { supabase } from "@/lib/supabase";

export default function Settings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (user) {
        setEmail(user.email || "");
        const meta = user.user_metadata || {};
        const displayName =
          meta.full_name ||
          meta.name ||
          meta.display_name ||
          meta.username ||
          user.email?.split("@")[0] ||
          "Pengguna";
        setName(displayName);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    localStorage.removeItem("role"); // ✅ fix: hapus role juga
    window.location.href = "/auth";
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola preferensi dan konfigurasi akun Anda
        </p>
      </div>

      <section className="space-y-4 rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <User className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="font-semibold">Profil</h2>
            <p className="text-sm text-muted-foreground">Informasi akun Anda</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nama</Label>
            <Input value={name} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
        </div>
      </section>

      <section className="flex items-center justify-between rounded-xl border bg-card p-6">
        <div>
          <h2 className="font-semibold">Keluar</h2>
          <p className="text-sm text-muted-foreground">
            Keluar dari akun Anda di perangkat ini
          </p>
        </div>
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </section>
    </div>
  );
}