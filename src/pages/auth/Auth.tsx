  import { useState } from "react";
  import { Sparkles, LogIn, UserPlus } from "lucide-react";
  import { Button } from "@/components/widgets/button";
  import { Input } from "@/components/widgets/input";
  import { Label } from "@/components/widgets/label";
  import { cn } from "@/lib/utils";
  import { supabase } from "@/lib/supabase";
  import { useNavigate } from "react-router-dom";

  export default function Auth() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<"login" | "register">("login");

    // REGISTER STATE
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    // LOGIN STATE
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    const [loading, setLoading] = useState(false);

    // REGISTER
    const handleRegister = async () => {
      if (!name || !email || !password) {
        alert("Lengkapi data terlebih dahulu");
        return;
      }

      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
          },
        },
      });

      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      alert("Registrasi berhasil! Silakan login.");
      setMode("login");
    };

    // LOGIN
    const handleLogin = async () => {
      if (!loginEmail || !loginPassword) {
        alert("Masukkan email dan password");
        return;
      }

      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const role = profile?.role || "user";

      // ✅ Simpan sebagai JSON
      localStorage.setItem("user", JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name ?? "",
        role: role,
      }));
      localStorage.setItem("role", role);

      // Redirect berdasarkan role
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">

          {/* Logo */}
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--hero-gradient)]">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Konveksi Pejabat</h1>
            <p className="text-sm text-muted-foreground">
              Pesan dan desain baju dengan mudah
            </p>
          </div>

          {/* TAB SWITCH */}
          <div className="grid grid-cols-2 rounded-lg bg-muted p-1">
            <button
              onClick={() => setMode("login")}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition",
                mode === "login"
                  ? "bg-card shadow text-foreground"
                  : "text-muted-foreground"
              )}
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition",
                mode === "register"
                  ? "bg-card shadow text-foreground"
                  : "text-muted-foreground"
              )}
            >
              Daftar
            </button>
          </div>

          {/* ================= LOGIN FORM ================= */}
          {mode === "login" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Masukkan password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={handleLogin} disabled={loading}>
                <LogIn className="mr-2 h-4 w-4" />
                {loading ? "Memproses..." : "Login"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Belum punya akun? Klik Daftar
              </p>
            </div>
          )}

          {/* ================= REGISTER FORM ================= */}
          {mode === "register" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input
                  placeholder="Nama Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Nomor WhatsApp</Label>
                <Input
                  placeholder="08xxxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Buat password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleRegister}
                disabled={loading}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {loading ? "Memproses..." : "Buat Akun"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Sudah punya akun? Klik Login
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }