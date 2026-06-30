import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../modules/marketing/pages/Dashboard/DashboardPage";
import UserProfile from "../components/ui/UserProfile/UserProfile";
import ActivityPlannerPage from "../modules/marketing/activity-planner/pages/ActivityPlannerPage";
import LeadsTablePage from "../modules/marketing/pages/LeadScreen/pages/LeadsTablePage";
import LeadCreatePage from "../modules/marketing/pages/LeadScreen/pages/LeadCreatePage";
import EpcListingPage from "../modules/marketing/activity-planner/pages/EpcListingPage";
import FilesModule from "../modules/marketing/activity-planner/pages/FilesModule";

export default function MarketingRoutes() {
	return (
		<Routes>
			<Route path="dashboard" element={<DashboardPage />} />
			<Route path="listing" element={<EpcListingPage />} />
			<Route path="leads/listing" element={<LeadsTablePage />} />
			<Route path="file-module/listing" element={<FilesModule />} />
			<Route path="leads/create" element={<LeadCreatePage />} />

			<Route path="/profile" element={<UserProfile />} />
			<Route
				path="/activity-planner/create"
				element={<ActivityPlannerPage />}
			/>
			<Route path="/activity-planner/:id" element={<ActivityPlannerPage />} />
		</Routes>
	);
}
