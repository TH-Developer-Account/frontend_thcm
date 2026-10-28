import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

import AdministrationRoute from "./AdministrationRoute";
import FullScreenLoader from "./FullScreenLoader";

const UsersPage = lazy(() => import("../modules/admin/users/UsersPage"));
const UserProfilePage = lazy(() =>
  import("../modules/admin/user-profile/UserProfilePage").then((m) => ({
    default: m.UserProfilePage,
  })),
);
const ProfileFormPage = lazy(() =>
  import("../modules/admin/user-profile/components/ProfileFormPage").then(
    (m) => ({ default: m.ProfileFormPage }),
  ),
);
const AppAdministratorsPage = lazy(
  () => import("../modules/admin/app-administrators/AppAdministratorsPage"),
);
const ByDesignPage = lazy(() => import("../modules/admin/FetchUsers/ByDesign"));
const C4CPage = lazy(() => import("../modules/admin/FetchUsers/C4C"));
const MastersPage = lazy(() => import("../modules/admin/Masters/MastersPage"));
const BusinessPartners = lazy(
  () => import("../modules/admin/business-partners/BusinessPartners"),
);
const CreateBusinessPartner = lazy(
  () => import("../modules/admin/business-partners/CreateBusinessPartner"),
);
const BusinessPartnerView = lazy(
  () => import("../modules/admin/business-partners/BusinessPartnerView"),
);
const AuthoritySchedulePage = lazy(
  () => import("../modules/admin/authority-schedule/AuthoritySchedulePage"),
);

// The signed-in user's own profile is no longer here: it is served at
// /profile (see AppRoutes) so non-admin users can reach it.
export default function AdminRoutes() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route element={<AdministrationRoute />}>
          <Route path="users" element={<UsersPage />} />
          <Route path="users/create" element={<UsersPage />} />
          <Route path="users/:id" element={<UsersPage />} />

          <Route path="user-profiles" element={<UserProfilePage />} />
          <Route path="profiles/create" element={<ProfileFormPage />} />
          <Route path="profiles/:id/edit" element={<ProfileFormPage />} />

          <Route
            path="masters"
            element={
              <div className="overflow-y-auto scrollbar-sleek">
                <MastersPage />
              </div>
            }
          />
          <Route
            path="authority-schedule"
            element={
              <div className="overflow-y-auto scrollbar-sleek">
                <AuthoritySchedulePage />
              </div>
            }
          />
          <Route path="business-partners" element={<BusinessPartners />} />
          <Route
            path="business-partners/:id/view"
            element={<BusinessPartnerView />}
          />
          <Route path="bydesign" element={<ByDesignPage />} />
          <Route path="c4c" element={<C4CPage />} />

          <Route element={<AdministrationRoute superAdminOnly />}>
            <Route
              path="app-administrators"
              element={<AppAdministratorsPage />}
            />
            <Route
              path="business-partners/create"
              element={<CreateBusinessPartner />}
            />
            <Route
              path="business-partners/:id/edit"
              element={<CreateBusinessPartner />}
            />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
