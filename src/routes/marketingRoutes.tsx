import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import FullScreenLoader from "./FullScreenLoader";

const DashboardPage = lazy(() =>
	import("../modules/marketing/dashboard/DashboardPage").then((m) => ({
		default: m.DashboardPage,
	})),
);
const UserProfile = lazy(
	() => import("../modules/settings/UserProfile/UserProfile"),
);
const ActivityPlannerPage = lazy(
	() =>
		import("../modules/marketing/activity-planner/pages/ActivityPlannerPage"),
);
const LeadsTablePage = lazy(
	() => import("../modules/marketing/leads/pages/LeadsTablePage"),
);
const LeadCreatePage = lazy(
	() => import("../modules/marketing/leads/pages/LeadCreatePage"),
);
const EpcListingPage = lazy(
	() => import("../modules/marketing/activity-planner/pages/EpcListingPage"),
);
const FilesModule = lazy(
	() => import("../modules/marketing/activity-planner/pages/FilesModule"),
);
const TestPage = lazy(() =>
	import("../containers/Login/pages/TestPage").then((m) => ({
		default: m.TestPage,
	})),
);

export default function MarketingRoutes() {
	return (
		<Suspense fallback={<FullScreenLoader />}>
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
				<Route
					path="/activity-planner/leads/view"
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
		</Suspense>
	);
}
