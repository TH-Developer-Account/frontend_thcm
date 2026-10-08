import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import FullScreenLoader from "./FullScreenLoader";

const ReimbursementPage = lazy(
	() => import("../modules/medicalReimbursment/pages/ReimbursementPage"),
);
const MedicalClaimListingPage = lazy(
	() => import("../modules/medicalReimbursment/pages/MedicalClaimListingPage"),
);
const MedicalClaimInitiationPage = lazy(
	() => import("../modules/medicalReimbursment/pages/MedicalClaimInitiationPage"),
);

export default function MedicalRoutes() {
	return (
		<Suspense fallback={<FullScreenLoader />}>
			<Routes>
				<Route path="listing" element={<MedicalClaimListingPage />} />

				<Route path="initiate" element={<MedicalClaimInitiationPage />} />

				{/* Initiation list = the "Awaiting employee" tab of the listing. */}
				<Route
					path="initiation/listing"
					element={<Navigate to="/medi-claim/listing?tab=initiation" replace />}
				/>
				<Route
					path="initiation/:initiationId/view"
					element={<MedicalClaimInitiationPage mode="view" />}
				/>
				<Route
					path="initiation/:initiationId"
					element={<MedicalClaimInitiationPage mode="view" />}
				/>

				<Route path=":id/view" element={<ReimbursementPage />} />

				<Route path="*" element={<Navigate to="/medi-claim/listing" replace />} />
			</Routes>
		</Suspense>
	);
}
