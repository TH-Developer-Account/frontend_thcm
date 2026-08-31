import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import FullScreenLoader from "./FullScreenLoader";

const ReimbursementPage = lazy(
	() => import("../modules/medicalReimbursment/pages/ReimbursementPage"),
);
const MedicalClaimListingPage = lazy(
	() => import("../modules/medicalReimbursment/pages/MedicalClaimListingPage"),
);
const MedicalClaimInitiationForm = lazy(
	() =>
		import("../modules/medicalReimbursment/components/MedicalClaimInitiationForm"),
);
const MedicalClaimInitiationPage = lazy(
	() =>
		import("../modules/medicalReimbursment/pages/MedicalClaimInitiationPage"),
);

export default function MedicalRoutes() {
	return (
		<Suspense fallback={<FullScreenLoader />}>
			<Routes>
				<Route path="/listing" element={<MedicalClaimListingPage />} />

				<Route path="/:id/view" element={<ReimbursementPage mode="view" />} />

				<Route path="/view" element={<ReimbursementPage mode="view" />} />

				<Route
					path="initiation/listing"
					element={<MedicalClaimInitiationForm />}
				/>

				<Route
					path="initiation/create"
					element={<MedicalClaimInitiationPage />}
				/>

				<Route
					path="initiation/:initiationId"
					element={<MedicalClaimInitiationForm />}
				/>

				<Route
					path="initiation/:initiationId/view"
					element={<MedicalClaimInitiationForm mode="view" />}
				/>
			</Routes>
		</Suspense>
	);
}
