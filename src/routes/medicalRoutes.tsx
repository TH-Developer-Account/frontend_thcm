import { Routes, Route } from "react-router-dom";
import ReimbursementPage from "../modules/medicalReimbursment/pages/ReimbursementPage";
import MedicalClaimListingPage from "../modules/medicalReimbursment/pages/MedicalClaimListingPage";
import MedicalClaimInitiationForm from "../modules/medicalReimbursment/components/MedicalClaimInitiationForm";
import MedicalClaimInitiationPage from "../modules/medicalReimbursment/pages/MedicalClaimInitiationPage";

export default function MedicalRoutes() {
	return (
		<Routes>
			<Route path="/listing" element={<MedicalClaimListingPage />} />
			<Route path="/:id/view" element={<ReimbursementPage />} />
			<Route path="/create" element={<ReimbursementPage />} />
			<Route path="/view" element={<ReimbursementPage />} />
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
	);
}
