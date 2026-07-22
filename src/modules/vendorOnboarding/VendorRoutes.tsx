import { Route, Routes } from "react-router-dom";

import VendorOnboardingFormView from "./components/VendorOnboardingFormView";
import VendorInitiationPage from "./pages/VendorInitiationPage";
import VendorOnboardingPage from "./pages/VendorOnboardingPage";
import VendorInitiationListingPage from "./pages/VendorInitiationListingPage";
import VendorOnboardingListingPage from "./pages/VendorOnboardingListingPage";

const VendorRoutes = () => {
	return (
		<Routes>
			<Route
				path="onboarding/listing"
				element={<VendorOnboardingListingPage />}
			/>
			<Route
				path="initiation/listing"
				element={<VendorInitiationListingPage />}
			/>

			<Route path="initiation/create" element={<VendorInitiationPage />} />

			<Route
				path="initiation/:initiationId"
				element={<VendorInitiationPage />}
			/>
			<Route
				path="initiation/:initiationId/view"
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
