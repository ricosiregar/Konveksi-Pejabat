import { useEffect, useState } from "react";
import {
  ShoppingBag, Trash2, Plus, Minus, ArrowRight,
  AlertTriangle, ImagePlus, X, Sparkles, Upload, CreditCard,
} from "lucide-react";
import { Button } from "@/components/widgets/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/widgets/card";
import { Input } from "@/components/widgets/input";
import { Label } from "@/components/widgets/label";
import { Textarea } from "@/components/widgets/textarea";
import { Separator } from "@/components/widgets/separator";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess: (result: any) => void;
        onPending: (result: any) => void;
        onError: (result: any) => void;
        onClose: () => void;
      }) => void;
    };
  }
}

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, getCartCount, replaceCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removedProducts, setRemovedProducts] = useState<string[]>([]);

  // Design image state
  const [designSource, setDesignSource] = useState<"upload" | "ai" | null>(null);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [aiImages, setAiImages] = useState<{ hf?: string; poll?: string; prompt: string }[]>([]);
  const [selectedAiImage, setSelectedAiImage] = useState<string | null>(null);
  const [loadingAiImages, setLoadingAiImages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);

  // Load Midtrans Snap script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", "Mid-client-J7JbnoRVhNRgNwMY");
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // Validasi produk
  useEffect(() => {
    const validateCart = async () => {
      if (cart.length === 0) return;
      const productIds = [...new Set(cart.map((i) => i.product.id))];
      const { data } = await supabase.from("products").select("id, active, name").in("id", productIds);
      const validIds = new Set(data?.filter((p) => p.active).map((p) => p.id) ?? []);
      const removed = cart.filter((i) => !validIds.has(i.product.id)).map((i) => i.product.name);
      if (removed.length > 0) {
        setRemovedProducts(removed);
        replaceCart(cart.filter((i) => validIds.has(i.product.id)));
      }
    };
    validateCart();
  }, []);

  // Load AI images
  useEffect(() => {
    const loadAiImages = async () => {
      setLoadingAiImages(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingAiImages(false); return; }
      const { data } = await supabase
        .from("chat_messages")
        .select("hf_image_base64, hf_mime_type, poll_image_url, prompt, image_url, model")
        .eq("user_id", user.id)
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) {
        const images = data
          .filter((m) => m.hf_image_base64 || m.poll_image_url || m.image_url)
          .map((m) => ({
            hf: m.hf_image_base64
              ? `data:${m.hf_mime_type || "image/jpeg"};base64,${m.hf_image_base64}`
              : m.model === "huggingface" && m.image_url ? m.image_url : undefined,
            poll: m.poll_image_url || (m.model === "pollinations" && m.image_url ? m.image_url : undefined),
            prompt: m.prompt || "Desain AI",
          }));
        setAiImages(images);
      }
      setLoadingAiImages(false);
    };
    loadAiImages();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDesignFile(file);
    setSelectedAiImage(null);
    const reader = new FileReader();
    reader.onload = () => setDesignPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadDesignImage = async (userId: string): Promise<string | null> => {
    if (selectedAiImage) {
      if (selectedAiImage.startsWith("data:")) {
        const blob = await fetch(selectedAiImage).then((r) => r.blob());
        const fileName = `${userId}/${Date.now()}_ai.jpg`;
        const { error } = await supabase.storage.from("designs").upload(fileName, blob, { contentType: "image/jpeg" });
        if (error) return null;
        const { data } = supabase.storage.from("designs").getPublicUrl(fileName);
        return data.publicUrl;
      }
      return selectedAiImage;
    }
    if (designFile) {
      const ext = designFile.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("designs").upload(fileName, designFile, { contentType: designFile.type });
      if (error) return null;
      const { data } = supabase.storage.from("designs").getPublicUrl(fileName);
      return data.publicUrl;
    }
    return null;
  };

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
    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Upload design image
      let designImageUrl: string | null = null;
      if (selectedAiImage || designFile) {
        designImageUrl = await uploadDesignImage(user?.id || "anonymous");
      }
      setIsUploading(false);

      // Buat order dulu dengan status pending + payment_status unpaid
const orderId = crypto.randomUUID();      
const { error: orderError } = await supabase.from("orders").insert({
        id: orderId,
        customer_name: customerName,
        customer_phone: customerPhone,
        notes,
        total_price: getCartTotal(),
        status: "pending",
        payment_status: "unpaid",
        user_id: user?.id ?? null,
        design_image_url: designImageUrl,
        items: cart.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          color: item.selectedColor,
          size: item.selectedSize,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });

      if (orderError) throw orderError;

      // Panggil Edge Function untuk buat Snap Token
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
  `https://yxurvjtpghxdupwkzvfb.supabase.co/functions/v1/create-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            orderId,
            customerName,
            customerPhone,
            amount: getCartTotal(),
            items: cart.map((item) => ({
              id: item.product.id,
              name: `${item.product.name} (${item.selectedColor}, ${item.selectedSize})`,
              price: item.product.price,
              quantity: item.quantity,
            })),
          }),
        }
      );

      const paymentData = await response.json();

      if (!response.ok || paymentData.error) {
        throw new Error(paymentData.error || "Gagal membuat pembayaran");
      }

      // Buka Midtrans Snap popup
      window.snap.pay(paymentData.token, {
        onSuccess: async (result) => {
          console.log("Payment success:", result);
          replaceCart([]);
          toast({ title: "Pembayaran berhasil! 🎉", description: "Pesanan Anda sedang diproses." });
          navigate("/orders");
        },
        onPending: (result) => {
          console.log("Payment pending:", result);
          replaceCart([]);
          toast({ title: "Menunggu pembayaran", description: "Selesaikan pembayaran Anda." });
          navigate("/orders");
        },
        onError: (result) => {
          console.error("Payment error:", result);
          toast({ title: "Pembayaran gagal", description: "Silakan coba lagi.", variant: "destructive" });
          setIsSubmitting(false);
        },
        onClose: () => {
          toast({ title: "Pembayaran dibatalkan", description: "Anda menutup halaman pembayaran." });
          setIsSubmitting(false);
        },
      });

    } catch (err) {
      console.error(err);
      setIsUploading(false);
      toast({ title: "Gagal membuat pesanan", description: String(err), variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Keranjang Kosong</h2>
          <p className="text-muted-foreground mb-6">Belum ada produk di keranjang Anda</p>
          <Button asChild>
            <Link to="/catalog">Lihat Katalog <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentDesignPreview = selectedAiImage || designPreview;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {removedProducts.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800">Beberapa produk tidak tersedia lagi</p>
            <p className="text-sm text-yellow-700">Produk berikut telah dihapus: <span className="font-medium">{removedProducts.join(", ")}</span></p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Keranjang Belanja</h1>
        <p className="mt-1 text-muted-foreground">{getCartCount()} item di keranjang Anda</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* LIST ITEM */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4 flex gap-4">
                <img src={item.product.imageUrl} alt={item.product.name} className="h-24 w-24 rounded-lg object-cover shrink-0" />
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-semibold truncate">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.selectedColor} • {item.selectedSize}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.selectedColor, item.selectedSize, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.selectedColor, item.selectedSize, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary">{formatPrice(item.product.price * item.quantity)}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => removeFromCart(item.product.id, item.selectedColor, item.selectedSize)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* DESIGN SECTION */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImagePlus className="h-5 w-5 text-primary" />
                Tambahkan Desain (Opsional)
              </CardTitle>
              <p className="text-sm text-muted-foreground">Upload gambar desain atau pilih dari hasil generate AI</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentDesignPreview && (
                <div className="relative inline-block">
                  <img src={currentDesignPreview} alt="Design preview" className="h-40 w-40 rounded-xl object-cover border border-border" />
                  <button
                    onClick={() => { setDesignPreview(null); setDesignFile(null); setSelectedAiImage(null); setDesignSource(null); }}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <p className="mt-2 text-xs text-muted-foreground">{selectedAiImage ? "📷 Dari hasil AI" : "📁 Upload manual"}</p>
                </div>
              )}

              {!currentDesignPreview && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs font-medium text-center">Upload dari Device</span>
                    <span className="text-[10px] text-muted-foreground">JPG, PNG, WEBP</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                  <button
                    onClick={() => setDesignSource(designSource === "ai" ? null : "ai")}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${designSource === "ai" ? "border-primary bg-primary/5" : "border-dashed border-border hover:border-primary/50 hover:bg-muted/30"}`}
                  >
                    <Sparkles className="h-6 w-6 text-primary" />
                    <span className="text-xs font-medium text-center">Dari Hasil AI</span>
                    <span className="text-[10px] text-muted-foreground">Pilih dari Chat AI</span>
                  </button>
                </div>
              )}

              {designSource === "ai" && !currentDesignPreview && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Pilih gambar dari riwayat Chat AI:</p>
                  {loadingAiImages ? (
                    <div className="flex items-center gap-2 py-4">
                      <div className="flex gap-1">
                        {[0, 150, 300].map((d) => (
                          <span key={d} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">Memuat gambar...</span>
                    </div>
                  ) : aiImages.length === 0 ? (
                    <div className="rounded-xl bg-muted/30 p-4 text-center">
                      <p className="text-xs text-muted-foreground">Belum ada gambar dari Chat AI. <Link to="/chat" className="text-primary underline">Generate sekarang →</Link></p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                      {aiImages.map((img, i) => (
                        <div key={i} className="space-y-1">
                          {img.hf && (
                            <button onClick={() => { setSelectedAiImage(img.hf!); setDesignSource(null); }}
                              className="group relative w-full aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-primary transition-all">
                              <img src={img.hf} alt="HF" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[10px] text-white font-medium">Pilih</span>
                              </div>
                              <span className="absolute bottom-1 left-1 bg-orange-500 text-white text-[8px] px-1 rounded">SD</span>
                            </button>
                          )}
                          {img.poll && (
                            <button onClick={() => { setSelectedAiImage(img.poll!); setDesignSource(null); }}
                              className="group relative w-full aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-primary transition-all">
                              <img src={img.poll} alt="Poll" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[10px] text-white font-medium">Pilih</span>
                              </div>
                              <span className="absolute bottom-1 left-1 bg-violet-500 text-white text-[8px] px-1 rounded">Flux</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SUMMARY */}
        <Card className="h-fit sticky top-6">
          <CardHeader>
            <CardTitle>Ringkasan Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama *</Label>
              <Input placeholder="Nama lengkap" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Telepon *</Label>
              <Input placeholder="08xxxxxxxxxx" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Catatan</Label>
              <Textarea placeholder="Catatan tambahan (opsional)" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            {currentDesignPreview && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                <img src={currentDesignPreview} alt="design" className="h-8 w-8 rounded object-cover" />
                <div>
                  <p className="text-xs font-medium text-green-800">Desain terlampir</p>
                  <p className="text-[10px] text-green-600">{selectedAiImage ? "Dari AI" : "Upload manual"}</p>
                </div>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal ({getCartCount()} item)</span>
              <span>{formatPrice(getCartTotal())}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatPrice(getCartTotal())}</span>
            </div>

            {/* Midtrans payment methods hint */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs font-medium text-blue-800 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Pembayaran via Midtrans
              </p>
              <p className="text-[10px] text-blue-600 mt-1">GoPay, Transfer Bank, Kartu Kredit, dll</p>
            </div>

            <Button className="w-full" size="lg" onClick={handleSubmitOrder} disabled={isSubmitting}>
              {isUploading ? "Mengupload desain..." : isSubmitting ? "Memproses..." : (
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Bayar Sekarang
                </span>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              *Pesanan dikonfirmasi otomatis setelah pembayaran berhasil
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}