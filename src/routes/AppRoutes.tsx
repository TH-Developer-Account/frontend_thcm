// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../containers/Login/pages/LoginPage";
import Dashboard from "../containers/HomeScreen/index";
import EPCList from "../containers/ListngScreen/EPCListing/index";

export default function AppRoutes() {
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
      <Route path="/listing" element={<EPCList />} />
    </Routes>
  );
}
