import { Routes, Route } from "react-router-dom";
import UserProfile from "../components/ui/UserProfile/UserProfile";
import { DashboardPage } from "../modules/marketing/pages/Dashboard/DashboardPage";
import EpfForm from "../modules/marketing/pages/EPFScreen/EpfForm";
import CrfForm from "../modules/marketing/pages/CRFScreen/CrfForm";
import EPCTable from "../modules/marketing/pages/EPCTable/EPCListing/index";
import UsersPage from "../modules/admin/pages/UserPage";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="department" element={<EpfForm />} />
      <Route path="roles" element={<CrfForm />} />
      <Route path="branches" element={<EPCTable />} />
      <Route path="profile" element={<UserProfile />} />
    </Routes>
  );
}
