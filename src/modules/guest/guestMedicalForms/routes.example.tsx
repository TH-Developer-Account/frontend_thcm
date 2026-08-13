import { Route } from "react-router-dom";

import ReimbursementClaimListingPage from "./ReimbursementClaimListingPage";
import ReimbursementPage from "./ReimbursementPage";

export const medicalClaimRoutes = (
	<>
		<Route path="medical-claim/listing" element={<ReimbursementClaimListingPage />} />
		<Route path="medical-claim/form/create" element={<ReimbursementPage />} />
		<Route path="medical-claim/form/:claimId/edit" element={<ReimbursementPage />} />
		<Route path="medical-claim/form/:claimId/view" element={<ReimbursementPage />} />
	</>
);

