import { useEffect, useState } from "react";
import { Package, TrendingUp, Users, Shirt, Eye, RefreshCw, Loader2, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

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
  total_price: number;
  status: "pending" | "confirmed" | "processing" | "completed";
  payment_status?: string;
  items: OrderItem[];
  created_at: string;
};

type Stats = {
  totalOrders: number;
  totalRevenue: number;
  newCustomers: number;
  totalProduction: number;
  revenueGrowth: number;
  orderGrowth: number;
};

const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
  pending: { label: "Menunggu", badge: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-400" },
  confirmed: { label: "Dikonfirmasi", badge: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-400" },
  processing: { label: "Diproses", badge: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-400" },
  completed: { label: "Selesai", badge: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-400" },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);

const formatPriceShort = (price: number): string => {
  if (price >= 1_000_000_000) return `Rp ${(price / 1_000_000_000).toFixed(1)}M`;
  if (price >= 1_000_000) return `Rp ${(price / 1_000_000).toFixed(1)}Jt`;
  if (price >= 1_000) return `Rp ${(price / 1_000).toFixed(0)}Rb`;
  return formatPrice(price);
};

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(dateStr));

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, totalRevenue: 0, newCustomers: 0,
    totalProduction: 0, revenueGrowth: 0, orderGrowth: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Total orders & revenue bulan ini
      const { data: thisMonthOrders } = await supabase
        .from("orders")
        .select("id, total_price, items, created_at, user_id")
        .gte("created_at", startOfMonth);

      // Orders bulan lalu (untuk perbandingan growth)
      const { data: lastMonthOrders } = await supabase
        .from("orders")
        .select("id, total_price")
        .gte("created_at", startOfLastMonth)
        .lte("created_at", endOfLastMonth);

      // Pelanggan baru minggu ini (distinct user_id)
      const { data: newCustomerOrders } = await supabase
        .from("orders")
        .select("user_id")
        .gte("created_at", startOfWeek)
        .not("user_id", "is", null);

      // Recent orders (5 terbaru)
      const { data: recent } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      // Hitung stats
      const totalOrders = thisMonthOrders?.length ?? 0;
      const totalRevenue = thisMonthOrders?.reduce((sum, o) => sum + o.total_price, 0) ?? 0;

      const lastMonthTotal = lastMonthOrders?.length ?? 0;
      const lastMonthRevenue = lastMonthOrders?.reduce((sum, o) => sum + o.total_price, 0) ?? 0;

      const orderGrowth = lastMonthTotal > 0
        ? Math.round(((totalOrders - lastMonthTotal) / lastMonthTotal) * 100)
        : totalOrders > 0 ? 100 : 0;

      const revenueGrowth = lastMonthRevenue > 0
        ? Math.round(((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : totalRevenue > 0 ? 100 : 0;

      // Pelanggan unik minggu ini
      const uniqueCustomers = new Set(newCustomerOrders?.map((o) => o.user_id)).size;

      // Total produksi (sum quantity semua items bulan ini)
      const totalProduction = thisMonthOrders?.reduce((sum, order) => {
        const items: OrderItem[] = order.items || [];
        return sum + items.reduce((s, item) => s + (item.quantity || 0), 0);
      }, 0) ?? 0;

      setStats({
        totalOrders,
        totalRevenue,
        newCustomers: uniqueCustomers,
        totalProduction,
        revenueGrowth,
        orderGrowth,
      });

      setRecentOrders(recent ?? []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  // Realtime update
  useEffect(() => {
    const channel = supabase
      .channel("orders_dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchDashboardData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const statCards = [
    {
      label: "Total Pesanan",
      value: stats.totalOrders.toString(),
      sub: stats.orderGrowth >= 0
        ? `▲ +${stats.orderGrowth}% dari bulan lalu`
        : `▼ ${stats.orderGrowth}% dari bulan lalu`,
      subColor: stats.orderGrowth >= 0 ? "text-green-600" : "text-red-500",
      icon: Package,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      border: "border-blue-100",
    },
    {
      label: "Pendapatan",
      value: formatPriceShort(stats.totalRevenue),
      sub: stats.revenueGrowth >= 0
        ? `▲ +${stats.revenueGrowth}% dari bulan lalu`
        : `▼ ${stats.revenueGrowth}% dari bulan lalu`,
      subColor: stats.revenueGrowth >= 0 ? "text-green-600" : "text-red-500",
      icon: TrendingUp,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
      border: "border-green-100",
    },
    {
      label: "Pelanggan Baru",
      value: stats.newCustomers.toString(),
      sub: "▲ +minggu ini",
      subColor: "text-green-600",
      icon: Users,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
      border: "border-purple-100",
    },
    {
      label: "Produksi",
      value: `${stats.totalProduction.toLocaleString("id-ID")} pcs`,
      sub: "bulan ini",
      subColor: "text-gray-400",
      icon: Shirt,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      border: "border-orange-100",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Selamat Datang, Admin 👋</h1>
          <p className="text-gray-500 mt-1">Pantau performa bisnis konveksi Anda hari ini</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card) => (
            <div key={card.label} className={`rounded-2xl border ${card.border} bg-white p-5 shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">{card.label}</p>
                <div className={`rounded-xl ${card.iconBg} p-2`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className={`text-xs mt-1 ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Orders */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-orange-100 p-1.5">
              <Package className="h-4 w-4 text-orange-500" />
            </div>
            <h2 className="font-semibold text-gray-900">Pesanan Terbaru</h2>
          </div>
          <Link
            to="/admin/orders"
            className="text-sm text-orange-500 hover:text-orange-700 font-medium transition-colors"
          >
            Lihat semua →
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Package className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Belum ada pesanan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pelanggan</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produk</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">QTY</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => {
                  const cfg = statusConfig[order.status] ?? statusConfig.pending;
                  const totalQty = order.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-mono font-semibold text-gray-900 text-xs">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {order.items?.[0]?.product_name ?? "-"}
                        {(order.items?.length ?? 0) > 1 && (
                          <span className="text-xs text-gray-400"> +{order.items.length - 1} lainnya</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-600">{totalQty} pcs</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{formatPrice(order.total_price)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        {order.payment_status === "paid" && (
                          <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="h-2.5 w-2.5" /> Lunas
                          </span>
                        )}
                  
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to="/admin/orders"
                          className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-700 font-medium"
                        >
                          <Eye className="h-4 w-4" />
                          Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}