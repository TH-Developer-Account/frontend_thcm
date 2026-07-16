import { Route, Routes } from "react-router-dom";

import VendorOnboardingFormView from "./components/VendorOnboardingFormView";
import VendorInitiationPage from "./pages/VendorInitiationPage";
import VendorListingPage from "./pages/VendorListingPage";
import VendorOnboardingPage from "./pages/VendorOnboardingPage";

const VendorRoutes = () => {
	return (
		<Routes>
			<Route path="listing" element={<VendorListingPage />} />

			<Route path="create" element={<VendorInitiationPage />} />

			<Route
				path="initiation/:initiationId"
				element={<VendorInitiationPage mode="view" />}
			/>

			<Route path="/onboarding/create" element={<VendorOnboardingPage />} />

			<Route
				path="/onboarding/:onboardingId"
				element={<VendorOnboardingPage />}
			/>

			<Route
				path="/onboarding/:onboardingId/view"
				element={<VendorOnboardingFormView />}
			/>
		</Routes>
	);
};

export default VendorRoutes;
