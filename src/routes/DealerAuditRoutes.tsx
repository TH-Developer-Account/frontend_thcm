import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import DealerAuditGuard from "../modules/audit/dealerAudit/pages/DealerAuditGuard";
import type { DealerAuditPermissions } from "../modules/audit/dealerAudit/dealer-audit.permissions";
import { DEALER_AUDIT_ROUTES } from "../modules/audit/dealerAudit";

// Audit instances
const DealerAuditListPage = lazy(
	() => import("../modules/audit/dealerAudit/pages/DealerAuditListPage"),
);
const CreateDealerAuditPage = lazy(
	() => import("../modules/audit/dealerAudit/pages/CreateDealerAuditPage"),
);
const DealerAuditDetailPage = lazy(
	() => import("../modules/audit/dealerAudit/pages/DealerAuditDetailPage"),
);
const DealerAuditReportPage = lazy(
	() => import("../modules/audit/dealerAudit/pages/DealerAuditReportPage"),
);
const DealerAuditChecklistPage = lazy(
	() => import("../modules/audit/dealerAudit/pages/DealerAuditChecklistPage"),
);
const DealerAuditChecklistItemPage = lazy(
	() =>
		import("../modules/audit/dealerAudit/pages/DealerAuditChecklistItemPage"),
);

// Audit cycle, dealer, reviewer, approver and report screens
const CreateAuditCyclePage = lazy(
	() => import("../modules/audit/dealerAudit/pages/CreateAuditCyclePage"),
);
const AuditTrackerPage = lazy(
	() => import("../modules/audit/dealerAudit/pages/AuditTrackerPage"),
);
const MyAuditsPage = lazy(
	() => import("../modules/audit/dealerAudit/pages/MyAuditsPage"),
);
const DealerAuditSubmitPage = lazy(
	() => import("../modules/audit/dealerAudit/pages/DealerAuditSubmitPage"),
);
const DealerAuditStatusPage = lazy(
	() => import("../modules/audit/dealerAudit/pages/DealerAuditStatusPage"),
);
const ReviewQueuePage = lazy(
	() => import("../modules/audit/dealerAudit/pages/ReviewQueuePage"),
);
const ReviewSummaryPage = lazy(
	() => import("../modules/audit/dealerAudit/pages/ReviewSummaryPage"),
);
const ApprovalPage = lazy(
	() => import("../modules/audit/dealerAudit/pages/ApprovalPage"),
);
const DealerAuditReportsPage = lazy(
	() => import("../modules/audit/dealerAudit/pages/DealerAuditReportsPage"),
);

// Checklist templates
const DealerChecklistLibraryPage = lazy(
	() => import("../modules/audit/dealerAudit/pages/DealerChecklistLibraryPage"),
);
const CreateChecklistTemplatePage = lazy(
	() =>
		import("../modules/audit/dealerAudit/pages/CreateChecklistTemplatePage"),
);
const DealerChecklistTemplateViewPage = lazy(
	() =>
		import("../modules/audit/dealerAudit/pages/DealerChecklistTemplateViewPage"),
);

/** "/audit/dealer/audits/create" -> "audits/create" (relative to the /audit/dealer/* parent). */
const toRelativePath = (absolutePath: string): string =>
	absolutePath.replace(`${DEALER_AUDIT_ROUTES.root}/`, "");

const PageFallback = () => (
	<div
		className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-600"
		role="status"
	>
		Loading…
	</div>
);

const guarded = (
	require: keyof DealerAuditPermissions | Array<keyof DealerAuditPermissions>,
	page: ReactNode,
) => (
	<DealerAuditGuard require={require}>
		<Suspense fallback={<PageFallback />}>{page}</Suspense>
	</DealerAuditGuard>
);

export default function DealerAuditRoutes() {
	return (
		<Routes>
			{/* Role landing screens */}
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.tracker)}
				element={guarded("canAssignAudit", <AuditTrackerPage />)}
			/>
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.myAudits)}
				element={guarded("canView", <MyAuditsPage />)}
			/>
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.reviewQueue)}
				element={guarded("canReview", <ReviewQueuePage mode="reviewer" />)}
			/>
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.approvals)}
				element={guarded("canApprove", <ReviewQueuePage mode="approver" />)}
			/>
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.cycles.create)}
				element={guarded("canCreateAudit", <CreateAuditCyclePage />)}
			/>

			{/* Audit instances */}
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.audits.list)}
				element={guarded("canView", <DealerAuditListPage />)}
			/>
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.audits.create)}
				element={guarded("canCreateAudit", <CreateDealerAuditPage />)}
			/>
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.audits.detail(":auditId"))}
				element={guarded("canView", <DealerAuditDetailPage />)}
			/>
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.audits.report(":auditId"))}
				element={guarded("canView", <DealerAuditReportPage />)}
			/>
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.audits.submit(":auditId"))}
				element={guarded("canView", <DealerAuditSubmitPage />)}
			/>
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.audits.status(":auditId"))}
				element={guarded("canView", <DealerAuditStatusPage />)}
			/>
			<Route
				path={toRelativePath(
					DEALER_AUDIT_ROUTES.audits.reviewSummary(":auditId"),
				)}
				element={guarded("canReview", <ReviewSummaryPage />)}
			/>
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.audits.approval(":auditId"))}
				element={guarded("canApprove", <ApprovalPage />)}
			/>
			<Route
				path={toRelativePath(
					DEALER_AUDIT_ROUTES.execution.checklist(":auditId"),
				)}
				element={guarded("canView", <DealerAuditChecklistPage />)}
			/>
			<Route
				path={toRelativePath(
					DEALER_AUDIT_ROUTES.execution.item(":auditId", ":itemId"),
				)}
				element={guarded("canView", <DealerAuditChecklistItemPage />)}
			/>

			{/* Reports */}
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.reports.root)}
				element={guarded("canDownloadReport", <DealerAuditReportsPage />)}
			/>

			{/* Checklist templates */}
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.template.root)}
				element={<Navigate to={DEALER_AUDIT_ROUTES.template.list} replace />}
			/>
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.template.list)}
				element={guarded("canView", <DealerChecklistLibraryPage />)}
			/>
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.template.create)}
				element={guarded("canManageTemplates", <CreateChecklistTemplatePage />)}
			/>
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.template.view(":templateId"))}
				element={guarded("canView", <DealerChecklistTemplateViewPage />)}
			/>
			<Route
				path={toRelativePath(DEALER_AUDIT_ROUTES.template.edit(":templateId"))}
				element={guarded("canManageTemplates", <CreateChecklistTemplatePage />)}
			/>

			{/* TODO: dashboard, dealers and profile routes — add here once their page components are confirmed. */}
		</Routes>
	);
}
