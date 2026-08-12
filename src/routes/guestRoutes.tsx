import { Route, Routes } from "react-router-dom";

import GuestVendorOnboardingFormPage from "../modules/guest/guestVendorOnboarding/GuestVendorOnboardingFormPage";
import GuestVendorSubmissionsListing from "../modules/guest/guestVendorOnboarding/GuestVendorSubmissionListing";

const GuestRoutes = () => {
	return (
		<Routes>
			<Route
				path="vendor-onboarding"
				element={<GuestVendorSubmissionsListing />}
			/>

			<Route
				path="vendor-onboarding/:id"
				element={<GuestVendorOnboardingFormPage mode="view" />}
			/>

			<Route
				path="vendor-onboarding/:id/edit"
				element={<GuestVendorOnboardingFormPage mode="edit" />}
			/>
		</Routes>
	);
};

export default GuestRoutes;
