import { Toaster } from "@/components/widgets/toaster";
import { Toaster as Sonner } from "@/components/widgets/sonner";
import { TooltipProvider } from "@/components/widgets/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { CartProvider } from "./context/CartContext";
import { UserRoute, AdminRoute } from "./routes/ProtectedRoute";

// USER PAGES
import UserDashboard from "./pages/user_page/dashboard_user";
import Chat from "./pages/user_page/ai_user";
import UserSettings from "./pages/user_page/settings_user";
import Catalog from "./pages/user_page/catalog_user";
import Cart from "./pages/user_page/cart_user";
import UserOrders from "./pages/user_page/pesanan_user";

// ADMIN PAGES
import AdminDashboard from "./pages/admin_pages/dashboard_admin";
import AdminOrders from "./pages/admin_pages/pesanan_admin";
import AdminProducts from "./pages/admin_pages/products_admin";
import AdminCustomers from "./pages/admin_pages/customers_admin";
import AdminSettings from "./pages/admin_pages/settings_admin";

// AUTH & 404
import Auth from "./pages/auth/Auth";
import NotFound from "./pages/user_page/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>

            {/* ===== AUTH (PUBLIC) ===== */}
            <Route path="/auth" element={<Auth />} />

            {/* ===== USER ROUTES ===== */}
            <Route
              element={
                <UserRoute>
                  <DashboardLayout />
                </UserRoute>
              }
            >
              <Route path="/" element={<UserDashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<UserOrders />} />
              <Route path="/settings" element={<UserSettings />} />
            </Route>

            {/* ===== ADMIN ROUTES ===== */}
            <Route
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            {/* ===== 404 ===== */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;