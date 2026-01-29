// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../containers/Login/pages/LoginPage";
import Dashboard from "../containers/HomeScreen/index";

export default function AppRoutes() {
  const isAuthenticated = true; // later replace with real auth

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
