// src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isAuthenticated = false; // replace later

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
