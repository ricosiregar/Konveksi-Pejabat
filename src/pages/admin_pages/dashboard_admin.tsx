import { Package, TrendingUp, Users, Shirt, ShoppingBag, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const stats = [
  {
    title: "Total Pesanan",
    value: "156",
    change: "+12% dari bulan lalu",
    positive: true,
    icon: Package,
    bg: "bg-blue-50",
    iconColor: "text-blue-500",
    border: "border-blue-100",
  },
  {
    title: "Pendapatan",
    value: "Rp 45.2M",
    change: "+8% dari bulan lalu",
    positive: true,
    icon: TrendingUp,
    bg: "bg-green-50",
    iconColor: "text-green-500",
    border: "border-green-100",
  },
  {
    title: "Pelanggan Baru",
    value: "24",
    change: "+5 minggu ini",
    positive: true,
    icon: Users,
    bg: "bg-purple-50",
    iconColor: "text-purple-500",
    border: "border-purple-100",
  },
  {
    title: "Produksi",
    value: "2,450 pcs",
    change: "bulan ini",
    positive: null,
    icon: Shirt,
    bg: "bg-orange-50",
    iconColor: "text-orange-500",
    border: "border-orange-100",
  },
];

const recentOrders = [
  { id: "ORD-001", customer: "Ahmad Rizki", product: "Kaos Polos Premium", qty: 50, amount: 2500000, status: "processing" },
  { id: "ORD-002", customer: "Siti Nurhaliza", product: "Kaos Polos Standard", qty: 100, amount: 3500000, status: "shipped" },
  { id: "ORD-003", customer: "Budi Santoso", product: "Kaos V-Neck", qty: 25, amount: 1375000, status: "completed" },
  { id: "ORD-004", customer: "Dewi Lestari", product: "Kaos Polo", qty: 75, amount: 6375000, status: "processing" },
];

const statusBadge: Record<string, string> = {
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

const statusLabel: Record<string, string> = {
  processing: "Diproses",
  shipped: "Dikirim",
  completed: "Selesai",
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat Datang, Admin 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Pantau performa bisnis konveksi Anda hari ini
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={`rounded-2xl border p-5 ${stat.bg} ${stat.border}`}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <div className={`rounded-lg bg-white p-2 shadow-sm`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p
              className={`text-xs mt-1 font-medium ${
                stat.positive === true
                  ? "text-green-600"
                  : stat.positive === false
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {stat.positive === true && "▲ "}
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-orange-500" />
            Pesanan Terbaru
          </h2>
          <button
            onClick={() => navigate("/admin/orders")}
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            Lihat semua →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">Pelanggan</th>
                <th className="px-6 py-3 text-left">Produk</th>
                <th className="px-6 py-3 text-left">Qty</th>
                <th className="px-6 py-3 text-left">Total</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.product}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.qty} pcs
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {formatPrice(order.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge[order.status]}`}
                    >
                      {statusLabel[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}