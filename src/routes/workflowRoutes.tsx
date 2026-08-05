import { Routes, Route } from "react-router-dom";
import WorkflowPage from "../modules/workflows/pages/WorkflowPage";
import WorkflowCreatePage from "../modules/workflows/pages/WorkflowCreatePage";

export default function WorkflowRoutes() {
	return (
		<Routes>
			<Route path="/listing" element={<WorkflowPage />} />
			<Route path="/create-workflows" element={<WorkflowCreatePage />} />
			<Route path="/edit-workflows/:id" element={<WorkflowCreatePage />} />
		</Routes>
	);
}
