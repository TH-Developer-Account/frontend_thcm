import { Route, Routes } from "react-router-dom";

import VendorOnboardingFormView from "../modules/vendorOnboarding/components/VendorOnboardingFormView";
import VendorInitiationPage from "../modules/vendorOnboarding/pages/VendorInitiationPage";
import VendorOnboardingPage from "../modules/vendorOnboarding/pages/VendorOnboardingPage";
import VendorInitiationListingPage from "../modules/vendorOnboarding/pages/VendorInitiationListingPage";
import VendorOnboardingListingPage from "../modules/vendorOnboarding/pages/VendorOnboardingListingPage";
import VendorDashboardPage from "../modules/vendorOnboarding/pages/VendorDashboardPage";

const VendorRoutes = () => {
	return (
		<Routes>
			<Route
				path="onboarding/listing"
				element={<VendorOnboardingListingPage />}
			/>
			<Route path="dashboard" element={<VendorDashboardPage />} />
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
