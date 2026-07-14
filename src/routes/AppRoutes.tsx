// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
// import ProtectedRoute from "./ProtectedRoute";
import HomeScreen from "../containers/HomeScreen/index";
import LoginPage from "../containers/Login/pages/LoginPage";
import ForbiddenPage from "../Forbidden";
import { ResetPasswordPage } from "../containers/Login/pages/ResestPasswordPage";
import { ForgotPasswordPage } from "../containers/Login/pages/ForgotPasswordPage";
import { SessionTimeoutProvider } from "../context/SessionTimeOut/SessionTimeoutProvider";
import MainContentWrapper from "../layout/MainContentWrapper";
import MarketingRoutes from "./marketingRoutes";
import AdminRoutes from "./adminRoutes";
import ProtectedRoute from "./ProtectedRoute";
import HomeLayout from "../layout/HomeLayout";
import VendorOnboardingRoutes from "./vendorOnboardingRoutes";

export default function AppRoutes() {
	return (
		<SessionTimeoutProvider>
			<Routes>
				{/* Public Routes */}
				<Route path="/login" element={<LoginPage />} />
				<Route path="/reset-password" element={<ResetPasswordPage />} />
				<Route path="/forgot-password" element={<ForgotPasswordPage />} />
				<Route path="/reset-password/:token" element={<ResetPasswordPage />} />

				<Route element={<HomeLayout />}>
					<Route
						index
						element={
							<ProtectedRoute>
								<HomeScreen />
							</ProtectedRoute>
						}
					/>
				</Route>

				<Route path="/forbidden" element={<ForbiddenPage />} />

				{/* Dashboard Layout Route */}
				<Route element={<MainContentWrapper />}>
					<Route path="/marketing/*" element={<MarketingRoutes />} />
					<Route path="/admin/*" element={<AdminRoutes />} />
					<Route path="/vendor/*" element={<VendorOnboardingRoutes />} />
				</Route>
			</Routes>
		</SessionTimeoutProvider>
	);
}
