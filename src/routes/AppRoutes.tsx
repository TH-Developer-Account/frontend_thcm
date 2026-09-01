// AppRoutes.tsx
import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";

import { SessionTimeoutProvider } from "../context/SessionTimeOut/SessionTimeoutProvider";

import HomeLayout from "../layout/HomeLayout";
import MainContentWrapper from "../layout/MainContentWrapper";

import AdminRoutes from "./adminRoutes";
import MarketingRoutes from "./marketingRoutes";
import MedicalRoutes from "./medicalRoutes";
import ProtectedRoute from "./ProtectedRoute";
import VendorRoutes from "./VendorRoutes";
import WorkflowRoutes from "./workflowRoutes";
import { GuestRoutesWrapper } from "./guestRoutes";
import FullScreenLoader from "./FullScreenLoader";

const ForbiddenPage = lazy(() => import("../Forbidden"));
const HomeScreen = lazy(() => import("../containers/HomeScreen"));
const ForgotPasswordPage = lazy(() =>
	import("../containers/Login/pages/ForgotPasswordPage").then((m) => ({
		default: m.ForgotPasswordPage,
	})),
);
const LoginPage = lazy(() => import("../containers/Login/pages/LoginPage"));
const ResetPasswordPage = lazy(() =>
	import("../containers/Login/pages/ResestPasswordPage").then((m) => ({
		default: m.ResetPasswordPage,
	})),
);
const ReimbursementClaimPublicPage = lazy(
	() =>
		import("../modules/medicalReimbursment/pages/ReimbursmentClaimPublicPage"),
);
const VendorOnboardingPublicPage = lazy(
	() => import("../modules/vendorOnboarding/pages/VendorOnboardingPublicPage"),
);

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
					<Route path="/medi-claim/*" element={<MedicalRoutes />} />
				</Route>
			</Routes>
		</SessionTimeoutProvider>
	);
};

export default function AppRoutes() {
	return (
		<Suspense fallback={<FullScreenLoader />}>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/forgot-password" element={<ForgotPasswordPage />} />
				<Route path="/reset-password" element={<ResetPasswordPage />} />
				<Route path="/reset-password/:token" element={<ResetPasswordPage />} />

				<Route path="/forbidden" element={<ForbiddenPage />} />

				<Route path="/guest/*" element={<GuestRoutesWrapper />} />
				<Route path="/vendor-form/invalid-link" element={<ForbiddenPage />} />

				<Route
					path="/vendor-form/:token"
					element={<VendorOnboardingPublicPage />}
				/>

				<Route path="/vendor-form" element={<VendorOnboardingPublicPage />} />

				<Route
					path="/medical-claim-form/:token"
					element={<ReimbursementClaimPublicPage />}
				/>

				<Route path="/forbidden" element={<ForbiddenPage />} />

				<Route path="/*" element={<AuthenticatedRoutes />} />
			</Routes>
		</Suspense>
	);
}
