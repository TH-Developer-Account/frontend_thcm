import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../modules/marketing/pages/Dashboard/DashboardPage";
import EPCList from "../modules/marketing/pages/EPCTable/EPCListing";
import UserProfile from "../components/ui/UserProfile/UserProfile";
import UsersPage from "../modules/admin/pages/BusinessUsersMaster/UserPage";
import ActivityPlannerPage from "../modules/marketing/activity-planner/pages/ActivityPlannerPage";
import LeadsTablePage from "../modules/marketing/pages/LeadScreen/LeadsTable/LeadsTablePage";
import LeadForm from "../modules/marketing/pages/LeadScreen/LeadsCreate/LeadForm";

export default function MarketingRoutes() {
	return (
		<Routes>
			<Route path="dashboard" element={<DashboardPage />} />
			<Route path="listing" element={<EPCList />} />
			<Route path="leads/listing" element={<LeadsTablePage />} />
			<Route path="leads/create" element={<LeadForm />} />
			<Route path="/profile" element={<UserProfile />} />
			<Route
				path="/activity-planner/create"
				element={<ActivityPlannerPage />}
			/>

			<Route path="/activity-planner/:id" element={<ActivityPlannerPage />} />
			<Route path="epf/:id" element={<ActivityPlannerPage />} />
			<Route path="/admin/users" element={<UsersPage />} />
		</Routes>
	);
}
