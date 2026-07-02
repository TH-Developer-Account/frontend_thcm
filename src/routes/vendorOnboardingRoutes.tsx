import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../modules/marketing/pages/Dashboard/DashboardPage";
import VendorListingPage from "../modules/vendorOnboarding/pages/VendorListingPage";

export default function VendorOnboardingRoutes() {
	return (
		<Routes>
			<Route path="dashboard" element={<DashboardPage />} />
			<Route path="/listing" element={<VendorListingPage />} />
		</Routes>
	);
}
