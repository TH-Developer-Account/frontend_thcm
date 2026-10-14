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

			{/* TODO: dashboard, reports, dealers and profile routes — add here once their page components are confirmed. */}
		</Routes>
	);
}
