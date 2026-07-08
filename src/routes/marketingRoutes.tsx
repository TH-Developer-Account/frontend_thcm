import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../modules/marketing/dashboard/DashboardPage";
import UserProfile from "../modules/settings/UserProfile/UserProfile";
import ActivityPlannerPage from "../modules/marketing/activity-planner/pages/ActivityPlannerPage";
import LeadsTablePage from "../modules/marketing/leads/pages/LeadsTablePage";
import LeadCreatePage from "../modules/marketing/leads/pages/LeadCreatePage";
import EpcListingPage from "../modules/marketing/activity-planner/pages/EpcListingPage";
import FilesModule from "../modules/marketing/activity-planner/pages/FilesModule";
import { TestPage } from "../containers/Login/pages/TestPage";

export default function MarketingRoutes() {
	return (
		<Routes>
			<Route path="dashboard" element={<DashboardPage />} />
			<Route path="/activity-planner/listing" element={<EpcListingPage />} />
			<Route
				path="/activity-planner/leads/listing"
				element={<LeadsTablePage />}
			/>
			<Route
				path="/activity-planner/file-module/listing"
				element={<FilesModule />}
			/>
			<Route
				path="/activity-planner/leads/create"
				element={<LeadCreatePage />}
			/>

			<Route path="/profile" element={<UserProfile />} />
			<Route path="/test" element={<TestPage />} />
			<Route
				path="/activity-planner/create"
				element={<ActivityPlannerPage />}
			/>
			<Route path="/activity-planner/:id" element={<ActivityPlannerPage />} />
		</Routes>
	);
}
