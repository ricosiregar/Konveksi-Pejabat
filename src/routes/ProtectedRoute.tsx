import { Navigate } from "react-router-dom";

// Guard untuk halaman USER - harus login
export const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem("user");
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

// Guard untuk halaman ADMIN - harus login + role admin
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem("user");
  const role = localStorage.getItem("role");

  if (!user) return <Navigate to="/auth" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;

  return <>{children}</>;
};