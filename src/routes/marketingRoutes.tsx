import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import FullScreenLoader from "./FullScreenLoader";
import ReportListingPage from "../modules/marketing/activity-planner/forms/EventReport/listing/reportListingPage";
import MachineStudyEntryPage from "../modules/marketing/machine-study/MachineStudyEntryPage";

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
const EpcFormsWizardPage = lazy(
	() =>
		import("../modules/marketing/activity-planner/pages/EpcFormsWizardPage"),
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
// Handouts (souvenir requests for premises use)
const HandoutsPage = lazy(
	() => import("../modules/marketing/handouts/HandoutsPage"),
);
const NewHandoutPage = lazy(
	() => import("../modules/marketing/handouts/NewHandoutPage"),
);
const HandoutDetailPage = lazy(
	() => import("../modules/marketing/handouts/HandoutDetailPage"),
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
					path="/activity-planner/reports/listing"
					element={<ReportListingPage />}
				/>

				<Route
					path="/activity-planner/data-form/create"
					element={<MachineStudyEntryPage />}
				/>
				<Route
					path="/activity-planner/leads/view"
					element={<LeadCreatePage />}
				/>
				<Route path="/profile" element={<UserProfile />} />
				<Route
					path="/activity-planner/create"
					element={<ActivityPlannerPage />}
				/>
				{/* Handouts: list → new request → request detail (approve / deliver).
				    Declared before "/activity-planner/:id" so "handouts" is never read as an EPC id. */}
				<Route path="/activity-planner/handouts" element={<HandoutsPage />} />
				<Route
					path="/activity-planner/handouts/new"
					element={<NewHandoutPage />}
				/>
				<Route
					path="/activity-planner/handouts/:id"
					element={<HandoutDetailPage />}
				/>
				{/* EPC → CRF → EPF stepper, opened from the listing action menu.
				    ?start=crf | epf only changes the page title. */}
				<Route
					path="/activity-planner/:id/add-forms"
					element={<EpcFormsWizardPage />}
				/>
				<Route path="/activity-planner/:id" element={<ActivityPlannerPage />} />
			</Routes>
		</Suspense>
	);
}
