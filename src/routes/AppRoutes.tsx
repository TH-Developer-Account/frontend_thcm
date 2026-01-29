// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";

export default function AppRoutes() {
  const isAuthenticated = false; // later replace with real auth

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

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
