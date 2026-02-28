import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/widgets/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/widgets/card";
import { Input } from "@/components/widgets/input";
import { Label } from "@/components/widgets/label";
import { Textarea } from "@/components/widgets/textarea";
import { Separator } from "@/components/widgets/separator";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function Cart() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    getCartCount,
    replaceCart,
  } = useCart();

  const { toast } = useToast();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removedProducts, setRemovedProducts] = useState<string[]>([]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);

  /* ================= VALIDASI PRODUK ================= */

  useEffect(() => {
    const validateCart = async () => {
      if (cart.length === 0) return;

      const productIds = [...new Set(cart.map((i) => i.product.id))];

      const { data } = await supabase
        .from("products")
        .select("id, active, name")
        .in("id", productIds);

      const validIds = new Set(
        data?.filter((p) => p.active).map((p) => p.id) ?? []
      );

      const removed = cart
        .filter((i) => !validIds.has(i.product.id))
        .map((i) => i.product.name);

      if (removed.length > 0) {
        setRemovedProducts(removed);
        const filtered = cart.filter((i) => validIds.has(i.product.id));
        replaceCart(filtered);
      }
    };

    validateCart();
  }, []);

  /* ================= SUBMIT ORDER ================= */

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      toast({ title: "Nama harus diisi", variant: "destructive" });
      return;
    }

    if (!customerPhone.trim()) {
      toast({ title: "Nomor telepon harus diisi", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ Ambil user dari Supabase Auth langsung
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("orders").insert({
        customer_name: customerName,
        customer_phone: customerPhone,
        notes,
        total_price: getCartTotal(),
        status: "pending",
        user_id: user?.id ?? null,
        items: cart.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          color: item.selectedColor,
          size: item.selectedSize,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });

      if (error) throw error;

      replaceCart([]);

      toast({
        title: "Pesanan berhasil dibuat!",
        description: "Pesanan Anda sedang diproses.",
      });

      navigate("/orders");
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal membuat pesanan",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================= CART KOSONG ================= */

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Keranjang Kosong</h2>
          <p className="text-muted-foreground mb-6">
            Belum ada produk di keranjang Anda
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

  /* ================= UI ================= */

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Banner produk dihapus */}
      {removedProducts.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800">
              Beberapa produk tidak tersedia lagi
            </p>
            <p className="text-sm text-yellow-700">
              Produk berikut telah dihapus dari katalog:{" "}
              <span className="font-medium">{removedProducts.join(", ")}</span>
            </p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Keranjang Belanja</h1>
        <p className="mt-1 text-muted-foreground">
          {getCartCount()} item di keranjang Anda
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* LIST ITEM */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4 flex gap-4">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="h-24 w-24 rounded-lg object-cover shrink-0"
                />
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-semibold truncate">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.selectedColor} • {item.selectedSize}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.selectedColor,
                            item.selectedSize,
                            item.quantity - 1
                          )
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.selectedColor,
                            item.selectedSize,
                            item.quantity + 1
                          )
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          removeFromCart(
                            item.product.id,
                            item.selectedColor,
                            item.selectedSize
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* SUMMARY */}
        <Card className="h-fit sticky top-6">
          <CardHeader>
            <CardTitle>Ringkasan Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama *</Label>
              <Input
                placeholder="Nama lengkap"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telepon *</Label>
              <Input
                placeholder="08xxxxxxxxxx"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Catatan</Label>
              <Textarea
                placeholder="Catatan tambahan (opsional)"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Separator />

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal ({getCartCount()} item)</span>
              <span>{formatPrice(getCartTotal())}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatPrice(getCartTotal())}</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Memproses..." : "Buat Pesanan"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              *Pesanan akan dikonfirmasi melalui WhatsApp
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}