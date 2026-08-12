import { Route, Routes } from "react-router-dom";

import GuestLoginPage from "../containers/Login/pages/GuestLoginPage";

import { GuestAuthProvider } from "../context/Auth/guestAuthProvider";
import GuestProtectedRoute from "./GuestProtectedRoutes";
import GuestLayoutWrapper from "../layout/GuestLayoutWrapper";
import ReimbursementClaimPublicPage from "../modules/medicalReimbursment/ReimbursmentClaimPublicPage";
import ReimbursementPage from "../modules/medicalReimbursment/ReimbursementPage";

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
				path="medical-claim/form/create"
				element={<ReimbursementClaimPublicPage />}
			/>
			<Route path="medical-claim/form/view" element={<ReimbursementPage />} />
		</Routes>
	);
};

export default GuestRoutes;
