import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../modules/marketing/pages/Dashboard/DashboardPage";
import CrfForm from "../modules/marketing/pages/CRFScreen/CrfForm";
import EPCTable from "../modules/marketing/pages/EPCTable/EPCListing/index";
import UsersPage from "../modules/admin/pages/UserPage";
import { UserProfilePage } from "../modules/admin/user-profile/UserProfilePage";
import { ProfileFormPage } from "../modules/admin/user-profile/components/ProfileFormPage";
import { ThemeProvider } from "../providers/ThemeContext";
import Departments from "../modules/admin/pages/Departments";
import ByDesignPage from "../modules/admin/pages/FetchUsers/ByDesign";
import C4CPage from "../modules/admin/pages/FetchUsers/C4C";
import DealerListPage from "../modules/admin/pages/DealerMaster/DealerListPage";
// import BusinessProfileList from "../modules/admin/pages/BusinessProfileList";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="department" element={<Departments />} />
      <Route path="roles" element={<CrfForm />} />
      <Route path="branches" element={<EPCTable />} />
      <Route path="bydesign" element={<ByDesignPage />} />
      <Route path="c4c" element={<C4CPage />} />
      <Route
        path="/profiles/create"
        element={
          <ThemeProvider>
            <ProfileFormPage />
          </ThemeProvider>
        }
      />
      <Route
        path="/profiles/:id/edit"
        element={
          <ThemeProvider>
            <ProfileFormPage />
          </ThemeProvider>
        }
      />
      <Route
        path="user_profiles"
        element={
          <ThemeProvider>
            <UserProfilePage />
          </ThemeProvider>
        }
      />
      <Route
        path="dealers"
        element={
          <ThemeProvider>
            <DealerListPage />
          </ThemeProvider>
        }
      />

      {/* <Route path="create_user_profile" element={<BusinessProfileList />} /> */}
    </Routes>
  );
}
