import { Suspense, lazy } from "react";
import { Outlet, Route, Routes } from "react-router-dom";

import FullScreenLoader from "./FullScreenLoader";
// import ChecklistLibrary from "../modules/audit/shared/checklist/ChecklistLibrary";
import { DealerAuditProvider } from "../modules/audit/dealerAudit/dealer-audit.store";
import DealerAuditGuard from "../modules/audit/dealerAudit/pages/DealerAuditGuard";
import CreateChecklistTemplatePage from "../modules/audit/dealerAudit/pages/CreateChecklistTemplatePage";
import DealerChecklistLibraryPage from "../modules/audit/dealerAudit/pages/DealerChecklistLibraryPage";

const DealerAuditChecklistPage = lazy(
	() => import("../modules/audit/dealerAudit/pages/DealerAuditChecklistPage"),
);

const DealerAuditChecklistItemPage = lazy(
	() =>
		import("../modules/audit/dealerAudit/pages/DealerAuditChecklistItemPage"),
);

// const ChecklistTemplateDetailsPage = lazy(
// 	() =>
// 		import("../modules/audit/dealerAudit/pages/ChecklistTemplateDetailsPage"),
// );

function DealerAuditExecutionLayout() {
	return (
		<DealerAuditProvider>
			<Outlet />
		</DealerAuditProvider>
	);
}

const DealerAuditRoutes = () => {
	return (
		<Suspense fallback={<FullScreenLoader />}>
			<Routes>
				{/* Checklist template management */}
				<Route
					path="checklist/listing"
					element={<DealerChecklistLibraryPage />}
				/>

				<Route
					path="checklist/create"
					element={
						<DealerAuditGuard require="canManageTemplates">
							<CreateChecklistTemplatePage />
						</DealerAuditGuard>
					}
				/>

				{/* <Route
					path="checklist/:templateId"
					element={<ChecklistTemplateDetailsPage />}
				/> */}

				<Route
					path="checklist/:templateId/edit"
					element={
						<DealerAuditGuard require="canManageTemplates">
							<CreateChecklistTemplatePage />
						</DealerAuditGuard>
					}
				/>

				{/* Audit execution */}
				<Route element={<DealerAuditExecutionLayout />}>
					<Route
						path=":auditId/checklist"
						element={<DealerAuditChecklistPage />}
					/>

					<Route
						path=":auditId/checklist/:itemId"
						element={
							<DealerAuditGuard
								require={["canEditSelfAssessment", "canReview"]}
							>
								<DealerAuditChecklistItemPage />
							</DealerAuditGuard>
						}
					/>
				</Route>
			</Routes>
		</Suspense>
	);
};

export default DealerAuditRoutes;
