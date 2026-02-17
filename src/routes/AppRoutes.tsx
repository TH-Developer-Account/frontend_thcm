// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
// import ProtectedRoute from "./ProtectedRoute";
import HomeScreen from "../containers/HomeScreen/index";
import EPCList from "../containers/ListngScreen/EPCListing/index";
import LoginPage from "../containers/Login/pages/LoginPage";
import { ResetPasswordPage } from "../containers/Login/pages/ResestPasswordPage";
import { ForgotPasswordPage } from "../containers/Login/pages/ForgotPasswordPage";
import { SessionTimeoutProvider } from "../context/SessionTimeoutProvider";
import MainContentWrapper from "../layout/MainContentWrapper";
import EpcForm from "../containers/EPCScreen/EpcForm";
import UserProfile from "../containers/UserProfile/UserProfile";
import UsersPage from "../admin/UserPage";

export default function AppRoutes() {
	return (
		<SessionTimeoutProvider>
			<Routes>
				{/* Public Routes */}
				<Route path="/login" element={<LoginPage />} />
				<Route path="/reset-password" element={<ResetPasswordPage />} />
				<Route path="/forgot-password" element={<ForgotPasswordPage />} />
				<Route path="/reset-password/:token" element={<ResetPasswordPage />} />
				<Route path="/" element={<HomeScreen />} />

				{/* Dashboard Layout Route */}
				<Route element={<MainContentWrapper />}>
					<Route path="listing" index element={<EPCList />} />
					<Route path="epc" element={<EpcForm userRole="ADMIN" />} />
					<Route path="profile" element={<UserProfile />} />
					<Route path="/test" element={<UsersPage />} />
				</Route>
			</Routes>
		</SessionTimeoutProvider>
	);
}
