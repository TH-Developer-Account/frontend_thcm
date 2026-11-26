// Target (new file): routes/handoutsRoutes.tsx
//
// Same shape as VendorRoutes.tsx / MedicalRoutes.tsx — a standalone app's
// own flat route tree, mounted at "/handouts/*" in AppRoutes.tsx. The page
// components themselves are untouched and stay under
// modules/marketing/handouts/; only where they're registered as routes
// moved out from under MarketingRoutes.
import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import FullScreenLoader from "./FullScreenLoader";

const HandoutsPage = lazy(
  () => import("../modules/marketing/handouts/HandoutsPage"),
);
const NewHandoutPage = lazy(
  () => import("../modules/marketing/handouts/NewHandoutPage"),
);
const HandoutDetailPage = lazy(
  () => import("../modules/marketing/handouts/HandoutDetailPage"),
);

const HandoutsRoutes = () => {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route index element={<HandoutsPage />} />
        {/* "new" must stay reachable independently of ":id" — React Router
				    v6 ranks static segments over dynamic ones regardless of
				    declaration order, so this is just for readability. */}
        <Route path="new" element={<NewHandoutPage />} />
        <Route path=":id" element={<HandoutDetailPage />} />
      </Routes>
    </Suspense>
  );
};

export default HandoutsRoutes;
