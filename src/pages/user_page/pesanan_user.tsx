import { useEffect, useState } from "react";
import { Package, Clock, CheckCircle, Loader2, ArrowRight, MapPin, PackageCheck } from "lucide-react"; // <-- Tambah PackageCheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/widgets/card";
import { Badge } from "@/components/widgets/badge";
import { Separator } from "@/components/widgets/separator";
import { Button } from "@/components/widgets/button";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type OrderItem = {
  product_id: string;
  product_name: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  notes: string;
  total_price: number;
  // Tambahkan "picked_up" di tipe status
  status: "pending" | "confirmed" | "processing" | "completed" | "picked_up";
  items: OrderItem[];
  created_at: string;
};

const statusConfig = {
  pending: {
    label: "Menunggu Konfirmasi",
    icon: Clock,
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  confirmed: {
    label: "Dikonfirmasi",
    icon: CheckCircle,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  processing: {
    label: "Sedang Diproses",
    icon: Loader2,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  completed: {
    label: "Siap Diambil",
    icon: CheckCircle,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  // Tambahkan konfigurasi visual untuk status baru
  picked_up: {
    label: "Pesanan Selesai & Diambil",
    icon: PackageCheck,
    color: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setOrders(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // --- FUNGSI UPDATE STATUS KE SUPABASE ---
  const handleConfirmPickup = async (orderId: string) => {
    // Validasi sederhana agar user tidak salah klik
    if (!window.confirm("Apakah Anda yakin sudah mengambil pesanan ini secara langsung di workshop?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "picked_up" })
        .eq("id", orderId);

      if (error) throw error;

      // Update state React agar UI langsung berubah tanpa perlu refresh page
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: "picked_up" } : order
        )
      );
    } catch (error) {
      console.error("Gagal mengupdate pesanan:", error);
      alert("Terjadi kesalahan saat mengupdate status pesanan.");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Belum Ada Pesanan</h2>
          <p className="text-muted-foreground mb-6">
            Anda belum memiliki pesanan. Mulai belanja sekarang!
          </p>
          <Button asChild>
            <Link to="/catalog">
              Lihat Katalog
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Pesanan Saya
        </h1>
        <p className="mt-1 text-muted-foreground">
          {orders.length} pesanan ditemukan
        </p>
      </div>

      <div className="space-y-6">
        {orders.map((order, index) => {
          const status = statusConfig[order.status] ?? statusConfig.pending;
          const StatusIcon = status.icon;

          return (
            <Card
              key={order.id}
              className="animate-fade-in opacity-0 overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="bg-muted/30">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base font-mono">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("gap-1.5 px-3 py-1 w-fit", status.color)}
                  >
                    <StatusIcon
                      className={cn(
                        "h-3.5 w-3.5",
                        order.status === "processing" && "animate-spin"
                      )}
                    />
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Info pelanggan */}
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Nama: </span>
                    <span className="font-medium">{order.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Telepon: </span>
                    <span className="font-medium">{order.customer_phone}</span>
                  </div>
                  {order.notes && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Catatan: </span>
                      <span>{order.notes}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Item pesanan */}
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.color} • {item.size} • {item.quantity}x
                        </p>
                      </div>
                      <p className="font-medium shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Pesanan</span>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(order.total_price)}
                  </span>
                </div>

                {/* Blok UI Maps dan Tombol Konfirmasi (Hanya muncul jika status "completed") */}
                {order.status === "completed" && (
                  <>
                    <Separator />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/40 p-4 rounded-lg border border-emerald-500/20">
                      <div className="flex items-start gap-3">
                        <div className="bg-emerald-500/10 p-2 rounded-full shrink-0">
                          <MapPin className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">Pesanan Siap Diambil!</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Kunjungi workshop Konveksi Pejabat dengan membawa nomor ID pesanan ini.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row w-full sm:w-auto shrink-0 gap-2">
                        <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                          <a
                            href="https://www.google.com/maps/place/7%C2%B002'43.6%22S+107%C2%B031'54.8%22E/@-7.0454444,107.5293027,17z/data=!3m1!4b1!4m4!3m3!8m2!3d-7.0454444!4d107.5318776?entry=ttu&g_ep=EgoyMDI2MDQyNi4wIKXMDSoASAFQAw%3D%3D" 
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MapPin className="mr-2 h-4 w-4" />
                            Buka Maps
                          </a>
                        </Button>
                        <Button 
                          onClick={() => handleConfirmPickup(order.id)} 
                          size="sm" 
                          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <PackageCheck className="mr-2 h-4 w-4" />
                          Sudah Diambil
                        </Button>
                      </div>
                    </div>
                  </>
                )}

              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}