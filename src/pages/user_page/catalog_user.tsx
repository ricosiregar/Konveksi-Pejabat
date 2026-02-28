import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Plus, Minus, Check, Package } from "lucide-react";
import { Button } from "@/components/widgets/button";
import { Card, CardContent } from "@/components/widgets/card";
import { Badge } from "@/components/widgets/badge";
import { useCart, Product } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  Putih: "bg-white border border-gray-300",
  Hitam: "bg-gray-900",
  Navy: "bg-blue-900",
  Maroon: "bg-red-900",
  "Abu-abu": "bg-gray-500",
};

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Map kolom Supabase → tipe Product di CartContext
        const mapped: Product[] = data.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.image_url,
          colors: item.colors ?? [],
          sizes: item.sizes ?? [],
        }));
        setProducts(mapped);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="animate-fade-in opacity-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Katalog Produk
        </h1>
        <p className="mt-1 text-muted-foreground">
          Pilih produk konveksi berkualitas untuk kebutuhan Anda
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-6 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="flex flex-col items-center py-24 text-gray-400">
          <Package className="h-12 w-12 mb-3" />
          <p className="font-medium">Belum ada produk tersedia</p>
          <p className="text-sm mt-1">Coba lagi nanti</p>
        </div>
      )}

      {/* Product Grid */}
      {!loading && products.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} delay={index * 100} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, delay }: { product: Product; delay: number }) {
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] ?? "");
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[1] ?? product.sizes?.[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/auth");
      return;
    }

    addToCart(product, selectedColor, selectedSize, quantity);
    setAdded(true);
    toast({
      title: "Ditambahkan ke keranjang",
      description: `${quantity}x ${product.name} (${selectedColor}, ${selectedSize})`,
    });
    setTimeout(() => setAdded(false), 2000);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <Card
      className="animate-fade-in opacity-0 overflow-hidden transition-all hover:shadow-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-300">
            <Package className="h-12 w-12" />
          </div>
        )}
      </div>

      <CardContent className="space-y-4 p-4">
        <div>
          <h3 className="font-semibold text-lg text-foreground">{product.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
        </div>

        <div className="text-xl font-bold text-primary">{formatPrice(product.price)}</div>

        {/* Warna */}
        {product.colors && product.colors.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Warna: {selectedColor}</p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    colorMap[color] ?? "bg-gray-300",
                    selectedColor === color
                      ? "ring-2 ring-primary ring-offset-2"
                      : "hover:ring-2 hover:ring-muted-foreground hover:ring-offset-1"
                  )}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Ukuran */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Ukuran</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <Badge
                  key={size}
                  variant={selectedSize === size ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer px-3 py-1 transition-all",
                    selectedSize === size && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Jumlah */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Jumlah</p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity((q) => q + 1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button className="w-full gap-2" onClick={handleAddToCart} disabled={added}>
          {added ? (
            <><Check className="h-4 w-4" /> Ditambahkan</>
          ) : (
            <><ShoppingCart className="h-4 w-4" /> Tambah ke Keranjang</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}