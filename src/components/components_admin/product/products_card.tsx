import { ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/widgets/button";
import { supabase } from "@/lib/supabase";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  sizes: string[];
  minOrder: number;
  onOrder?: (id: string) => void;
}
// pages/products.tsx atau component user
const fetchPublicProducts = async () => {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });
  return data;
};
export const ProductCard = ({
  id,
  name,
  description,
  price,
  image,
  sizes,
  minOrder,
  onOrder,
}: ProductCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="product-card group">
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 bg-white/90 hover:bg-white text-foreground"
          >
            <Eye className="w-4 h-4 mr-2" />
            Detail
          </Button>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-lg text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((size) => (
            <span
              key={size}
              className="px-2 py-0.5 text-xs font-medium bg-secondary rounded-md text-secondary-foreground"
            >
              {size}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div>
            <p className="text-xl font-bold text-accent">{formatPrice(price)}</p>
            <p className="text-xs text-muted-foreground">Min. {minOrder} pcs</p>
          </div>
          <Button
            onClick={() => onOrder?.(id)}
            className="btn-accent"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Pesan
          </Button>
        </div>
      </div>
    </div>
  );
};