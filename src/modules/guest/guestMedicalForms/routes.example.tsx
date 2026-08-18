import { Route } from "react-router-dom";

import ReimbursementClaimListingPage from "./ReimbursementClaimListingPage";
import ReimbursementPage from "./ReimbursementPage";

export const medicalClaimRoutes = (
	<>
		<Route
			path="medi-claim/listing"
			element={<ReimbursementClaimListingPage />}
		/>
		<Route path="medi-claim/create" element={<ReimbursementPage />} />
		<Route path="medi-claim/:claimId/edit" element={<ReimbursementPage />} />
		<Route path="medi-claim/:claimId/view" element={<ReimbursementPage />} />
	</>
);
