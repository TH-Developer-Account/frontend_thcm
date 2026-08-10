import { Route, Routes } from "react-router-dom";
import GuestVendorSubmissionsListing from "../modules/guest/GuestVendorSubmissionListing";
// import VendorSubmissionDetailPage — pending VendorOnboardingFormView review

const GuestRoutes = () => {
  return (
    <Routes>
      <Route
        path="vendor-onboarding"
        element={<GuestVendorSubmissionsListing />}
      />
      {/* <Route
        path="vendor-onboarding/mine/:id"
        element={<VendorSubmissionDetailPage />}
      /> */}
    </Routes>
  );
};

export default GuestRoutes;
