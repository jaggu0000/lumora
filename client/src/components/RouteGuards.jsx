import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Redirect unauthenticated users to /login
export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

// Redirect non-admins away from admin pages
export function RequireAdmin({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

// Redirect already-authenticated users away from guest-only pages (login/signup/landing)
export function GuestOnly({ children }) {
  const { user } = useAuth();
  if (user) {
    const dest = user.role === "admin" ? "/admin" : "/dashboard";
    return <Navigate to={dest} replace />;
  }
  return children;
}
