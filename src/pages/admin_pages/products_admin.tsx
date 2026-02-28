import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Package, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  min_order: number;
  stock: number;
  sizes: string[];
  colors: string[];
  image_url: string;
  active: boolean;
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Color state
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    min_order: "",
    stock: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setProducts(data);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: "", description: "", price: "", min_order: "", stock: "" });
    setColors([]);
    setColorInput("");
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      min_order: String(product.min_order),
      stock: String(product.stock),
    });
    setColors(product.colors ?? []);
    setColorInput("");
    setImagePreview(product.image_url || "");
    setImageFile(null);
    setShowModal(true);
  };

  const addColor = () => {
    const trimmed = colorInput.trim();
    if (trimmed && !colors.includes(trimmed)) {
      setColors((prev) => [...prev, trimmed]);
    }
    setColorInput("");
  };

  const removeColor = (color: string) => {
    setColors((prev) => prev.filter((c) => c !== color));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);
    if (error) throw error;

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setUploading(true);
    try {
      let image_url = editProduct?.image_url || "";
      if (imageFile) {
        image_url = await uploadImage(imageFile);
      }

      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        min_order: Number(form.min_order),
        stock: Number(form.stock),
        image_url,
        colors,
      };

      if (editProduct) {
        await supabase.from("products").update(payload).eq("id", editProduct.id);
      } else {
        await supabase.from("products").insert({
          ...payload,
          active: true,
          sizes: ["S", "M", "L", "XL"],
        });
      }

      await fetchProducts();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan produk");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("products").update({ active: !current }).eq("id", id);
    fetchProducts();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Produk</h1>
          <p className="text-gray-500 mt-1">Kelola katalog produk konveksi Anda</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
        >
          <Plus className="h-4 w-4" />
          Tambah Produk
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari produk..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((product) => (
          <div
            key={product.id}
            className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="aspect-video bg-gray-100 overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Package className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{product.description}</p>
                </div>
                <button
                  onClick={() => toggleActive(product.id, product.active)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium border ${
                    product.active
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}
                >
                  {product.active ? "Aktif" : "Nonaktif"}
                </button>
              </div>

              {/* Warna */}
              {product.colors && product.colors.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {product.colors.map((color) => (
                    <span
                      key={color}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-orange-50 p-2">
                  <p className="text-xs text-gray-400">Harga</p>
                  <p className="text-xs font-bold text-orange-600">
                    {formatPrice(product.price)}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 p-2">
                  <p className="text-xs text-gray-400">Min. Order</p>
                  <p className="text-xs font-bold text-blue-600">
                    {product.min_order} pcs
                  </p>
                </div>
                <div className="rounded-xl bg-purple-50 p-2">
                  <p className="text-xs text-gray-400">Stok</p>
                  <p className="text-xs font-bold text-purple-600">{product.stock}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(product)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex items-center justify-center rounded-xl border border-red-100 p-2 text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-16">
          <Package className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-400">Tidak ada produk ditemukan</p>
        </div>
      )}

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h3 className="font-bold text-gray-900">
                {editProduct ? "Edit Produk" : "Tambah Produk Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Upload Gambar */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Foto Produk
                </label>
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-400 transition-colors overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Upload className="h-6 w-6 mb-2" />
                      <span className="text-xs">Klik untuk upload gambar</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              {/* Field teks */}
              {[
                { label: "Nama Produk *", key: "name", placeholder: "Nama produk" },
                { label: "Deskripsi", key: "description", placeholder: "Deskripsi singkat" },
                { label: "Harga (Rp) *", key: "price", placeholder: "50000", type: "number" },
                { label: "Min. Order (pcs)", key: "min_order", placeholder: "12", type: "number" },
                { label: "Stok", key: "stock", placeholder: "100", type: "number" },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {field.label}
                  </label>
                  <input
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                </div>
              ))}

              {/* Input Warna */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Warna Tersedia
                </label>

                {colors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {colors.map((color) => (
                      <span
                        key={color}
                        className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2.5 py-1 text-xs font-medium text-orange-700"
                      >
                        {color}
                        <button
                          onClick={() => removeColor(color)}
                          className="text-orange-400 hover:text-orange-600 leading-none"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: Hitam, Navy, Merah..."
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addColor();
                      }
                    }}
                  />
                  <button
                    onClick={addColor}
                    className="rounded-xl bg-orange-100 px-3 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-200 transition-colors"
                  >
                    + Tambah
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Tekan Enter atau klik Tambah untuk menambahkan warna
                </p>
              </div>

              {/* Tombol aksi */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={uploading}
                  className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-60"
                >
                  {uploading
                    ? "Menyimpan..."
                    : editProduct
                    ? "Simpan Perubahan"
                    : "Tambah Produk"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}