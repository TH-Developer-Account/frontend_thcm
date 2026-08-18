import { Routes, Route } from "react-router-dom";
import ReimbursementPage from "../modules/medicalReimbursment/ReimbursementPage";

export default function MedicalRoutes() {
	return (
		<Routes>
			<Route path="/form/create" element={<ReimbursementPage />} />
			<Route path="/form/view" element={<ReimbursementPage />} />
		</Routes>
	);
}
