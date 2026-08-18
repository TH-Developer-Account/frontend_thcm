import { Route, Routes } from "react-router-dom";

import GuestLoginPage from "../containers/Login/pages/GuestLoginPage";

import { GuestAuthProvider } from "../context/Auth/guestAuthProvider";
import GuestProtectedRoute from "./GuestProtectedRoutes";
import GuestLayoutWrapper from "../layout/GuestLayoutWrapper";
import ReimbursementClaimPublicPage from "../modules/medicalReimbursment/pages/ReimbursmentClaimPublicPage";
import ReimbursementPage from "../modules/medicalReimbursment/pages/ReimbursementPage";
import ReimbursementClaimListingPage from "../modules/guest/guestMedicalForms/ReimbursementClaimListingPage";

export const GuestRoutesWrapper = () => {
	return (
		<GuestAuthProvider>
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

			{/* <Route
				path="vendor-onboarding/:id"
				element={<GuestVendorOnboardingFormPage mode="view" />}
			/> */}

			{/* <Route
				path="vendor-onboarding/:id/edit"
				element={<GuestVendorOnboardingFormPage mode="edit" />}
			/> */}
			<Route
				path="medi-claim/listing"
				element={<ReimbursementClaimListingPage />}
			/>
			<Route path="medi-claim/create" element={<ReimbursementPage />} />
			<Route path="medi-claim/view" element={<ReimbursementPage />} />
		</Routes>
	);
};

export default GuestRoutes;
