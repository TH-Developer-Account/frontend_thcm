// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "../containers/HomeScreen/index";
import LoginPage from "../containers/Login/pages/LoginPage";
import { ResetPasswordPage } from "../containers/Login/pages/ResestPasswordPage";

export default function AppRoutes() {
  const isAuthenticated = true; // later replace with real auth

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
