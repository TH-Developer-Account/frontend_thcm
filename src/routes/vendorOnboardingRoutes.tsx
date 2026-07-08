import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../modules/marketing/dashboard/DashboardPage";
import VendorListingPage from "../modules/vendorOnboarding/pages/VendorListingPage";
import VendorOnboardingPage from "../modules/vendorOnboarding/pages/VendorOnboardingPage";
import VendorInitiationPage from "../modules/vendorOnboarding/pages/VendorInitiationPage";

export default function VendorOnboardingRoutes() {
	return (
		<Routes>
			<Route path="dashboard" element={<DashboardPage />} />
			<Route path="/listing" element={<VendorListingPage />} />
			<Route path="/create" element={<VendorInitiationPage />} />
			<Route path="/onboard/create" element={<VendorOnboardingPage />} />
		</Routes>
	);
}
