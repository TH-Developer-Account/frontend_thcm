import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";

import { GuestAuthProvider } from "../context/Auth/guestAuthProvider";
import GuestProtectedRoute from "./GuestProtectedRoutes";
import GuestLayoutWrapper from "../layout/GuestLayoutWrapper";
import FullScreenLoader from "./FullScreenLoader";

const GuestLoginPage = lazy(
	() => import("../containers/Login/pages/GuestLoginPage"),
);
const ReimbursementClaimPublicPage = lazy(
	() =>
		import("../modules/medicalReimbursment/pages/ReimbursmentClaimPublicPage"),
);
const ReimbursementClaimListingPage = lazy(
	() =>
		import("../modules/guest/guestMedicalForms/ReimbursementClaimListingPage"),
);
const GuestReimbursementPage = lazy(
	() => import("../modules/guest/guestMedicalForms/GuestReimbursementPage"),
);

export const GuestRoutesWrapper = () => {
	return (
		<GuestAuthProvider>
			<Suspense fallback={<FullScreenLoader />}>
				<Routes>
					{/* The ONLY unauthenticated guest route now. */}
					<Route path="login" element={<GuestLoginPage />} />

					{/* Everything vendor-facing — listing AND the form itself —
					    lives behind guest auth. There is no public form route
					    anymore; a vendor rep must log in first. */}
					<Route
						path="/*"
						element={
							<GuestProtectedRoute>
								<GuestLayoutWrapper />
							</GuestProtectedRoute>
						}
					>
						<Route path="*" element={<GuestRoutes />} />
					</Route>
				</Routes>
			</Suspense>
		</GuestAuthProvider>
	);
};

const GuestRoutes = () => {
	return (
		<Routes>
			<Route
				path="vendor-onboarding"
				element={<ReimbursementClaimPublicPage />}
			/>

			<Route
				path="medi-claim/listing"
				element={<ReimbursementClaimListingPage />}
			/>

			<Route path="medi-claim/create" element={<GuestReimbursementPage />} />

			<Route path="medi-claim/:claimId" element={<GuestReimbursementPage />} />
		</Routes>
	);
};
