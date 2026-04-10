import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../modules/marketing/pages/Dashboard/DashboardPage";
import EpcForm from "../modules/marketing/pages/EPCScreen/EpcForm";
import EpfForm from "../modules/marketing/pages/EPFScreen/EpfForm";
import CrfForm from "../modules/marketing/pages/CRFScreen/CrfForm";
import EPCList from "../modules/marketing/pages/EPCTable/EPCListing";
import UserProfile from "../components/ui/UserProfile/UserProfile";
import UsersPage from "../modules/admin/pages/BusinessUsersMaster/UserPage";
import ActivityPlannerPage from "../modules/marketing/pages/ActivityPlannerView/pages/ActivityPlannerPage";

export default function MarketingRoutes() {
	return (
		<Routes>
			<Route path="dashboard" element={<DashboardPage />} />
			<Route path="epc" element={<EpcForm userRole="ADMIN" />} />
			<Route path="epf" element={<EpfForm />} />
			<Route path="crf" element={<CrfForm />} />
			<Route path="listing" element={<EPCList />} />
			<Route path="/profile" element={<UserProfile />} />
			<Route path="epf/:id" element={<ActivityPlannerPage />} />
			<Route path="/admin/users" element={<UsersPage />} />
		</Routes>
	);
}
