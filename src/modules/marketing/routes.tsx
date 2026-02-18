import { Routes, Route } from "react-router-dom";
import EPCList from "./pages/EPCTable/EPCListing/index";
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import EpcForm from "./pages/EPCScreen/EpcForm";
import EpfForm from "./pages/EPFScreen/EpfForm";
import CrfForm from "./pages/CRFScreen/CrfForm";
import UserProfile from "../../components/ui/UserProfile/UserProfile";

export default function MarketingRoutes() {
	return (
		<Routes>
			<Route path="dashboard" element={<DashboardPage />} />
			<Route path="epc" element={<EpcForm userRole="ADMIN" />} />
			<Route path="epf" element={<EpfForm />} />
			<Route path="crf" element={<CrfForm />} />
			<Route path="listing" element={<EPCList />} />
			<Route path="/profile" element={<UserProfile />} />
		</Routes>
	);
}
