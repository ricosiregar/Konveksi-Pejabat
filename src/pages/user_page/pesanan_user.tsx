import { useEffect, useState } from "react";
import { Package, Clock, CheckCircle, Loader2, ArrowRight } from "lucide-react";
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
  status: "pending" | "confirmed" | "processing" | "completed";
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
    label: "Selesai",
    icon: CheckCircle,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}