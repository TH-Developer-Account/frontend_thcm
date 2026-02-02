// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import HomeScreen from "../containers/HomeScreen/index";
import EPCList from "../containers/ListngScreen/EPCListing/index";
import LoginPage from "../containers/Login/pages/LoginPage";
import { ResetPasswordPage } from "../containers/Login/pages/ResestPasswordPage";
import { ForgotPasswordPage } from "../containers/Login/pages/ForgotPasswordPage";
import { VerifyOTPPage } from "../containers/Login/pages/VerifyOTPPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-otp" element={<VerifyOTPPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/listing"
        element={
          <ProtectedRoute>
            <EPCList />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
