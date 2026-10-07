import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getRolePath } from "../utils/roles.js";

export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={getRolePath(user.role)} replace />;
  return children;
}

export function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to={getRolePath(user.role)} replace />;
  return children;
}
