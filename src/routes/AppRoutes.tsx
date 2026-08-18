import { Route, Routes } from "react-router-dom";

import ForbiddenPage from "../Forbidden";
import HomeScreen from "../containers/HomeScreen";
import { ForgotPasswordPage } from "../containers/Login/pages/ForgotPasswordPage";
import LoginPage from "../containers/Login/pages/LoginPage";
import { ResetPasswordPage } from "../containers/Login/pages/ResestPasswordPage";
import { SessionTimeoutProvider } from "../context/SessionTimeOut/SessionTimeoutProvider";
import HomeLayout from "../layout/HomeLayout";
import MainContentWrapper from "../layout/MainContentWrapper";
import VendorRoutes from "./VendorRoutes";
import VendorOnboardingPublicPage from "../modules/vendorOnboarding/pages/VendorOnboardingPublicPage";
import AdminRoutes from "./adminRoutes";
import MarketingRoutes from "./marketingRoutes";
import ProtectedRoute from "./ProtectedRoute";
import WorkflowRoutes from "./workflowRoutes";
import MedicalRoutes from "./medicalRoutes";

const AuthenticatedRoutes = () => {
	return (
		<SessionTimeoutProvider>
			<Routes>
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

				<Route element={<MainContentWrapper />}>
					<Route path="/marketing/*" element={<MarketingRoutes />} />
					<Route path="/admin/*" element={<AdminRoutes />} />
					<Route path="/vendor/*" element={<VendorRoutes />} />
					<Route path="/workflow/*" element={<WorkflowRoutes />} />
					<Route path="/medical-claim/*" element={<MedicalRoutes />} />
				</Route>
			</Routes>
		</SessionTimeoutProvider>
	);
};

export default function AppRoutes() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />

			<Route path="/reset-password" element={<ResetPasswordPage />} />

			<Route path="/reset-password/:token" element={<ResetPasswordPage />} />

			<Route path="/forgot-password" element={<ForgotPasswordPage />} />

			<Route path="/vendor-form/invalid-link" element={<ForbiddenPage />} />

			<Route
				path="/vendor-form/:token"
				element={<VendorOnboardingPublicPage />}
			/>

			<Route path="/vendor-form" element={<VendorOnboardingPublicPage />} />

			<Route path="/forbidden" element={<ForbiddenPage />} />

			<Route path="/*" element={<AuthenticatedRoutes />} />
		</Routes>
	);
}
