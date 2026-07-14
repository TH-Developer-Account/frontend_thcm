import { Route, Routes } from "react-router-dom";

import VendorInitiationPage from "./pages/VendorInitiationPage";
import VendorListingPage from "./pages/VendorListingPage";
import VendorOnboardingPage from "./pages/VendorOnboardingPage";
import VendorOnboardingFormView from "./components/VendorOnboardingFormView";

const VendorRoutes = () => {
	return (
		<Routes>
			<Route path="listing" element={<VendorListingPage />} />

			<Route path="create" element={<VendorInitiationPage />} />

			<Route
				path="initiation/:initiationId"
				element={<VendorInitiationPage mode="view" />}
			/>

			<Route path="onboard/create" element={<VendorOnboardingPage />} />

			<Route
				path="onboarding/:onboardingId"
				element={<VendorOnboardingFormView />}
			/>
		</Routes>
	);
};

export default VendorRoutes;
