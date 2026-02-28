import { useState } from "react";
import { Search, Users, Mail, Phone, ShoppingBag, Eye } from "lucide-react";

const customers = [
  {
    id: "USR-001",
    name: "Ahmad Rizki",
    email: "ahmad@email.com",
    phone: "08111222333",
    totalOrders: 5,
    totalSpend: 12500000,
    joinDate: "2023-10-01",
    lastOrder: "2024-01-15",
  },
  {
    id: "USR-002",
    name: "Siti Nurhaliza",
    email: "siti@email.com",
    phone: "08222333444",
    totalOrders: 8,
    totalSpend: 28000000,
    joinDate: "2023-09-15",
    lastOrder: "2024-01-14",
  },
  {
    id: "USR-003",
    name: "Budi Santoso",
    email: "budi@email.com",
    phone: "08333444555",
    totalOrders: 3,
    totalSpend: 4125000,
    joinDate: "2023-11-20",
    lastOrder: "2024-01-13",
  },
  {
    id: "USR-004",
    name: "Dewi Lestari",
    email: "dewi@email.com",
    phone: "08444555666",
    totalOrders: 12,
    totalSpend: 76500000,
    joinDate: "2023-08-05",
    lastOrder: "2024-01-12",
  },
  {
    id: "USR-005",
    name: "Eko Prasetyo",
    email: "eko@email.com",
    phone: "08555666777",
    totalOrders: 2,
    totalSpend: 4500000,
    joinDate: "2023-12-10",
    lastOrder: "2024-01-11",
  },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<(typeof customers)[0] | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Pelanggan</h1>
          <p className="text-gray-500 mt-1">Kelola dan lihat riwayat pelanggan Anda</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari pelanggan..."
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
          <p className="text-sm text-gray-500">Total Pelanggan</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{customers.length}</p>
        </div>
        <div className="rounded-2xl bg-green-50 border border-green-100 p-4">
          <p className="text-sm text-gray-500">Total Pesanan</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {customers.reduce((a, c) => a + c.totalOrders, 0)}
          </p>
        </div>
        <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4">
          <p className="text-sm text-gray-500">Total Pendapatan</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {formatPrice(customers.reduce((a, c) => a + c.totalSpend, 0))}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pelanggan</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kontak</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Pesanan</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Belanja</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bergabung</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold text-sm">
                        {customer.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-400">{customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <p className="flex items-center gap-1 text-gray-600 text-xs">
                        <Mail className="h-3 w-3" /> {customer.email}
                      </p>
                      <p className="flex items-center gap-1 text-gray-600 text-xs">
                        <Phone className="h-3 w-3" /> {customer.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="h-4 w-4 text-orange-400" />
                      <span className="font-semibold text-gray-900">{customer.totalOrders}</span>
                      <span className="text-gray-400 text-xs">pesanan</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-900">
                    {formatPrice(customer.totalSpend)}
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{customer.joinDate}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-700 font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16">
            <Users className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-400">Tidak ada pelanggan ditemukan</p>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h3 className="font-bold text-gray-900">Detail Pelanggan</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold text-xl">
                  {selectedCustomer.name[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "ID Pelanggan", value: selectedCustomer.id },
                  { label: "Telepon", value: selectedCustomer.phone },
                  { label: "Bergabung", value: selectedCustomer.joinDate },
                  { label: "Pesanan Terakhir", value: selectedCustomer.lastOrder },
                  { label: "Total Pesanan", value: `${selectedCustomer.totalOrders} pesanan` },
                  { label: "Total Belanja", value: formatPrice(selectedCustomer.totalSpend) },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                    <p className="font-semibold text-gray-800 text-xs">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}