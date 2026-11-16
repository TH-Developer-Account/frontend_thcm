import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import FullScreenLoader from "./FullScreenLoader";

const CppListingPage = lazy(
	() => import("../modules/cpp/pages/CppListingPage"),
);
const CppViewPage = lazy(() => import("../modules/cpp/pages/CppViewPage"));
const CppRequestCreatePage = lazy(
	() => import("../modules/cpp/pages/CppRequestCreatePage"),
);
// Your existing Create CPP form page — wire it once it is in the project:
// const CppFormPage = lazy(() => import("../modules/cpp/pages/CppFormPage"));

export default function CppRoutes() {
	return (
		<Suspense fallback={<FullScreenLoader />}>
			<Routes>
				<Route path="listing" element={<CppListingPage />} />

				{/* <Route path="create" element={<CppFormPage />} />
				<Route path=":id/edit" element={<CppFormPage />} /> */}
				<Route path="/requests/create" element={<CppRequestCreatePage />} />
				<Route path=":id/view" element={<CppViewPage />} />

				<Route path="*" element={<Navigate to="/cpp/listing" replace />} />
			</Routes>
		</Suspense>
	);
}
