import { Routes, Route } from "react-router-dom";
import WorkflowPage from "../modules/workflows/pages/WorkflowPage";
import WorkflowCreatePage from "../modules/workflows/pages/WorkflowCreatePage";
import DynamicWorkflow from "../modules/workflows/pages/DynamicWorkflow";

export default function WorkflowRoutes() {
	return (
		<Routes>
			<Route path="/listing" element={<WorkflowPage />} />
			<Route path="/create-workflows" element={<WorkflowCreatePage />} />
			<Route path="/dynamic-create" element={<DynamicWorkflow />} />
			<Route path="/edit-workflows/:id" element={<WorkflowCreatePage />} />
		</Routes>
	);
}
