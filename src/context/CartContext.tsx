import { supabase } from "@/lib/supabase";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

/* ================= TYPES ================= */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  colors: string[];
  sizes: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor: string;
  selectedSize: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: "pending" | "confirmed" | "processing";
  createdAt: Date;
  customerName: string;
  customerPhone: string;
  notes?: string;
}

interface CartContextType {
  cart: CartItem[];
  orders: Order[];

  addToCart: (
    product: Product,
    color: string,
    size: string,
    quantity?: number
  ) => void;

  removeFromCart: (
    productId: string,
    color: string,
    size: string
  ) => void;

  updateQuantity: (
    productId: string,
    color: string,
    size: string,
    quantity: number
  ) => void;

  clearCart: () => void;

  getCartTotal: () => number;
  getCartCount: () => number;

  createOrder: (
    customerName: string,
    customerPhone: string,
    notes?: string
  ) => void;

  replaceCart: (items: CartItem[]) => void; // ✅ pengganti setCart
}

/* ================= CONTEXT ================= */

const CartContext = createContext<CartContextType | undefined>(undefined);

/* ================= PROVIDER ================= */

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  /* ================= CART ACTIONS ================= */

  const addToCart = (
    product: Product,
    color: string,
    size: string,
    quantity = 1
  ) => {
    setCart((prev) => {
      const index = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === color &&
          item.selectedSize === size
      );

      if (index >= 0) {
        const updated = [...prev];
        updated[index].quantity += quantity;
        return updated;
      }

      return [
        ...prev,
        {
          product,
          quantity,
          selectedColor: color,
          selectedSize: size,
        },
      ];
    });
  };

  const removeFromCart = (
    productId: string,
    color: string,
    size: string
  ) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedColor === color &&
            item.selectedSize === size
          )
      )
    );
  };

  const updateQuantity = (
    productId: string,
    color: string,
    size: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, color, size);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId &&
        item.selectedColor === color &&
        item.selectedSize === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const replaceCart = (items: CartItem[]) => {
    setCart(items);
  };

  /* ================= CALCULATIONS ================= */

  const getCartTotal = () =>
    cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );

  const getCartCount = () =>
    cart.reduce((count, item) => count + item.quantity, 0);

  /* ================= ORDER ================= */

  const createOrder = (
    customerName: string,
    customerPhone: string,
    notes?: string
  ) => {
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      items: [...cart],
      total: getCartTotal(),
      status: "pending",
      createdAt: new Date(),
      customerName,
      customerPhone,
      notes,
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
  };

  /* ================= VALIDATE CART ================= */
  /* Hapus produk yang sudah tidak aktif di database */

  useEffect(() => {
    const validateCart = async () => {
      if (cart.length === 0) return;

      const productIds = [...new Set(cart.map((i) => i.product.id))];

      const { data } = await supabase
        .from("products")
        .select("id, active")
        .in("id", productIds);

      const validIds = new Set(
        data?.filter((p) => p.active).map((p) => p.id) ?? []
      );

      const filtered = cart.filter((item) =>
        validIds.has(item.product.id)
      );

      if (filtered.length !== cart.length) {
        setCart(filtered);
      }
    };

    validateCart();
  }, [cart]);

  /* ================= PROVIDER ================= */

  return (
    <CartContext.Provider
      value={{
        cart,
        orders,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        createOrder,
        replaceCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}