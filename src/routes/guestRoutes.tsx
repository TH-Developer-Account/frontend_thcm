import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { GuestAuthProvider } from "../context/Auth/guestAuthProvider";
import GuestProtectedRoute from "./GuestProtectedRoutes";
import GuestLayoutWrapper from "../layout/GuestLayoutWrapper";
import FullScreenLoader from "./FullScreenLoader";
import { GUEST_HOME_PATH } from "../context/Auth/guestSession";

const GuestLoginPage = lazy(
	() => import("../containers/Login/pages/GuestLoginPage"),
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
					{/* The ONLY unauthenticated guest route. The first-touch claim
					    form is the emailed token link (/medical-claim-form/:token),
					    which lives outside /guest. */}
					<Route path="login" element={<GuestLoginPage />} />

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
			<Route index element={<Navigate to={GUEST_HOME_PATH} replace />} />

			<Route path="medi-claim/listing" element={<ReimbursementClaimListingPage />} />

			<Route path="medi-claim/create" element={<GuestReimbursementPage />} />

			<Route path="medi-claim/:claimId" element={<GuestReimbursementPage />} />

			<Route path="*" element={<Navigate to={GUEST_HOME_PATH} replace />} />
		</Routes>
	);
};
