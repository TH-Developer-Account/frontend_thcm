// cpp.routes.tsx — mount like MarketingRoutes, e.g. <Route path="/cpp/*" element={<CppRoutes />} />
import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import FullScreenLoader from "./FullScreenLoader";

const CppRequestCreatePage = lazy(
	() => import("../modules/cpp/pages/CppRequestCreatePage"),
);

export default function CppRoutes() {
	return (
		<Suspense fallback={<FullScreenLoader />}>
			<Routes>
				<Route path="/requests/create" element={<CppRequestCreatePage />} />
			</Routes>
		</Suspense>
	);
}
