import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import FullScreenLoader from "./FullScreenLoader";

const WorkflowPage = lazy(
	() => import("../modules/workflows/pages/WorkflowPage"),
);
const WorkflowCreatePage = lazy(
	() => import("../modules/workflows/pages/WorkflowCreatePage"),
);

export default function WorkflowRoutes() {
	return (
		<Suspense fallback={<FullScreenLoader />}>
			<Routes>
				<Route path="/listing" element={<WorkflowPage />} />
				<Route path="/create-workflows" element={<WorkflowCreatePage />} />
				<Route path="/edit-workflows/:id" element={<WorkflowCreatePage />} />
			</Routes>
		</Suspense>
	);
}
