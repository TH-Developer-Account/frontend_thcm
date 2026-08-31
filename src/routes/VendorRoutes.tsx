import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import FullScreenLoader from "./FullScreenLoader";

const VendorOnboardingFormView = lazy(
	() =>
		import("../modules/vendorOnboarding/components/VendorOnboardingFormView"),
);
const VendorInitiationPage = lazy(
	() => import("../modules/vendorOnboarding/pages/VendorInitiationPage"),
);
const VendorOnboardingPage = lazy(
	() => import("../modules/vendorOnboarding/pages/VendorOnboardingPage"),
);
const VendorOnboardingListingPage = lazy(
	() => import("../modules/vendorOnboarding/pages/VendorOnboardingListingPage"),
);
const VendorDashboardPage = lazy(
	() => import("../modules/vendorOnboarding/pages/VendorDashboardPage"),
);

const VendorRoutes = () => {
	return (
		<Suspense fallback={<FullScreenLoader />}>
			<Routes>
				<Route
					path="onboarding/listing"
					element={<VendorOnboardingListingPage />}
				/>
				<Route path="dashboard" element={<VendorDashboardPage />} />

				<Route path="initiation/create" element={<VendorInitiationPage />} />

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
		</Suspense>
	);
};

export default VendorRoutes;
