// src/routes/cppRoutes.tsx — mounted in AppRoutes.tsx as  <Route path="/cpp/*" element={<CppRoutes />} />
import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import FullScreenLoader from "./FullScreenLoader";

const CppListingPage = lazy(() => import("../modules/cpp/pages/CppListingPage"));
const CppRequestCreatePage = lazy(() => import("../modules/cpp/pages/CppRequestCreatePage"));
const CppViewPage = lazy(() => import("../modules/cpp/pages/CppViewPage"));
const CppApprovalMatrixPage = lazy(() => import("../modules/cpp/pages/CppApprovalMatrixPage"));

export default function CppRoutes() {
	return (
		<Suspense fallback={<FullScreenLoader />}>
			<Routes>
				<Route path="listing" element={<CppListingPage />} />
				<Route path="create" element={<CppRequestCreatePage />} />
				{/* Same page: an id loads the draft and saves with PUT. */}
				<Route path=":id/edit" element={<CppRequestCreatePage />} />
				<Route path=":id/view" element={<CppViewPage />} />
				<Route path="approval-matrix" element={<CppApprovalMatrixPage />} />
				<Route path="*" element={<Navigate to="/cpp/listing" replace />} />
			</Routes>
		</Suspense>
	);
}
