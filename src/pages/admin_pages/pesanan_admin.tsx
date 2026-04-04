import { useEffect, useState } from "react";
import {
  Search,
  Clock,
  CheckCircle,
  Loader2,
  Package,
  Eye,
  RefreshCw,
  ImageIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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
  design_image_url?: string;
  created_at: string;
};

const statusConfig: Record<string, { label: string; icon: any; badge: string; dot: string }> = {
  pending: { label: "Menunggu", icon: Clock, badge: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-400" },
  confirmed: { label: "Dikonfirmasi", icon: CheckCircle, badge: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-400" },
  processing: { label: "Diproses", icon: Loader2, badge: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-400" },
  completed: { label: "Selesai", icon: CheckCircle, badge: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-400" },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(dateStr));

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (!error) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, status: newStatus as Order["status"] } : prev);
    }
    setUpdatingStatus(false);
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search);
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pesanan</h1>
          <p className="text-gray-500 mt-1">Kelola dan pantau semua pesanan pelanggan</p>
        </div>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama, telepon, ID pesanan..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${!filterStatus ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"}`}
        >
          Semua ({orders.length})
        </button>
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${filterStatus === key ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"}`}
          >
            {cfg.label} ({orders.filter((o) => o.status === key).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Pesanan</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pelanggan</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Desain</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((order) => {
                  const cfg = statusConfig[order.status] ?? statusConfig.pending;
                  const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-mono font-semibold text-gray-900 text-xs">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-xs text-gray-400">{order.customer_phone}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-800">
                          {order.items[0]?.product_name}
                          {order.items.length > 1 && ` +${order.items.length - 1} lainnya`}
                        </p>
                        <p className="text-xs text-gray-400">{totalQty} pcs</p>
                      </td>
                      {/* Kolom desain */}
                      <td className="px-5 py-4">
                        {order.design_image_url ? (
                          <button onClick={() => setZoomedImage(order.design_image_url!)} className="group relative">
                            <img
                              src={order.design_image_url}
                              alt="Desain"
                              className="h-12 w-12 rounded-lg object-cover border border-gray-200 group-hover:border-orange-400 transition-all"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity flex items-center justify-center">
                              <Eye className="h-3 w-3 text-white" />
                            </div>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-300">
                            <ImageIcon className="h-4 w-4" />
                            <span className="text-xs">-</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{formatPrice(order.total_price)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(order.created_at)}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-700 font-medium"
                        >
                          <Eye className="h-4 w-4" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <Package className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-400">Tidak ada pesanan ditemukan</p>
          </div>
        )}
      </div>

      {/* Zoom image modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-2xl w-full">
            <img src={zoomedImage} alt="Desain besar" className="w-full rounded-2xl shadow-2xl" />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-4 -right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>
            <a
              href={zoomedImage}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white/90 py-2 text-sm font-medium text-gray-700 hover:bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              Download Gambar
            </a>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h3 className="font-bold text-gray-900">Detail Pesanan</h3>
                <p className="text-sm text-orange-500 font-mono font-medium">
                  #{selectedOrder.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="p-5 space-y-5">
              {/* Info pelanggan */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Nama</p>
                  <p className="font-semibold">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Telepon</p>
                  <p className="font-semibold">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Tanggal</p>
                  <p className="font-semibold">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig[selectedOrder.status]?.badge}`}>
                    {statusConfig[selectedOrder.status]?.label}
                  </span>
                </div>
                {selectedOrder.notes && (
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs mb-1">Catatan</p>
                    <p className="text-gray-700">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              {/* Gambar desain */}
              {selectedOrder.design_image_url && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Desain yang Diinginkan</p>
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={selectedOrder.design_image_url}
                      alt="Desain pesanan"
                      className="w-full max-h-64 object-contain bg-gray-50"
                    />
                  </div>
                  <a
                    href={selectedOrder.design_image_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-700 font-medium"
                  >
                    Download gambar desain ↗
                  </a>
                </div>
              )}

              {/* Item pesanan */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Item Pesanan</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-gray-400">{item.color} • {item.size} • {item.quantity}x</p>
                      </div>
                      <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="rounded-xl bg-orange-50 p-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">Total Pembayaran</p>
                <p className="text-lg font-bold text-orange-600">{formatPrice(selectedOrder.total_price)}</p>
              </div>

              {/* Update Status */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <button
                      key={key}
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedOrder.id, key)}
                      className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                        selectedOrder.status === key
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                      } disabled:opacity-60`}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}