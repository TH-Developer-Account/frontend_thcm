// modules/audit/dealerAudit/pages/DealerAuditChecklistPage.tsx
//
// The parameters of one audit, grouped by section. Works for the dealer
// (self-assessment), the reviewer (review) and read-only viewers.

import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Alert } from "../../../../components/common/Alert";
import Card from "../../../../components/common/Card";
import { FilterTabs } from "../../../../components/ui/FilterTabs";
import PageNavigation from "../../../../components/ui/PageNavigation/PageNavigation";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { dealerAuditContent as content } from "../dealer-audit.content";
import { getAssessmentMode } from "../dealer-audit.permissions";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { formatPeriodLabel } from "../dealer-audit.sla";
import type { DealerAuditSection } from "../dealer-audit.types";
import {
	flattenChecklistItems,
	getChecklistProgress,
	getReviewProgress,
	isItemReviewed,
	isChecklistItemComplete,
	isItemClarificationOpen,
} from "../../shared/execution/audit-execution.utils";
import AuditProgressSummary from "../../shared/execution/components/AuditProgressSummary";
import AuditReminderBanner from "../../shared/execution/components/AuditReminderBanner";
import AuditStatusBadge from "../components/AuditStatusBadge";
import AuditWorkflowActions from "../components/AuditWorkflowActions";
import ChecklistItemList from "../../shared/execution/components/ChecklistItemList";
import { useAuditReminders } from "../hooks/useAuditReminders";
import {
	useAuditPermissions,
	useDealerAuditSession,
} from "../hooks/useDealerAuditAccess";
import { useDealerAudit, useDealerAuditChecklist } from "../hooks/useDealerAudits";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";

const text = content.ui.checklist;

type ChecklistFilter = "ALL" | "TODO" | "DONE";

export default function DealerAuditChecklistPage() {
	const { auditId } = useParams();
	const navigate = useNavigate();
	const { role } = useDealerAuditSession();
	const [filter, setFilter] = useState<ChecklistFilter>("ALL");

	const auditQuery = useDealerAudit(auditId);
	const checklistQuery = useDealerAuditChecklist(auditId);
	const audit = auditQuery.data;
	const permissions = useAuditPermissions(audit);
	const mode = getAssessmentMode(permissions);
	const reminders = useAuditReminders(
		audit,
		role === "DEALER" ? "DEALER" : "INTERNAL",
	);

	const sections = useMemo(
		() => checklistQuery.data?.sections ?? [],
		[checklistQuery.data],
	);
	const items = useMemo(() => flattenChecklistItems(sections), [sections]);
	const isReviewing = mode === "REVIEW";

	const progress = useMemo(
		() => (isReviewing ? getReviewProgress(items) : getChecklistProgress(items)),
		[isReviewing, items],
	);

	const isDone = useMemo(
		() =>
			isReviewing
				? isItemReviewed
				: (item: (typeof items)[number]) =>
						isChecklistItemComplete(item) && !isItemClarificationOpen(item),
		[isReviewing],
	);

	const tabs = useMemo(
		() => [
			{ value: "ALL" as const, label: text.filters.all, count: items.length },
			{
				value: "TODO" as const,
				label: isReviewing ? text.filters.toReview : text.filters.pending,
				count: items.filter((item) => !isDone(item)).length,
			},
			{
				value: "DONE" as const,
				label: isReviewing ? text.filters.reviewed : text.filters.completed,
				count: items.filter(isDone).length,
			},
		],
		[isDone, isReviewing, items],
	);

	const visibleSections = useMemo<DealerAuditSection[]>(
		() =>
			sections
				.map((section) => ({
					...section,
					items: section.items.filter(
						(item) =>
							filter === "ALL" || (filter === "DONE") === isDone(item),
					),
				}))
				.filter((section) => section.items.length > 0),
		[filter, isDone, sections],
	);

	const detailPath = auditId ? DEALER_AUDIT_ROUTES.audits.detail(auditId) : "";

	if (auditQuery.isLoading || checklistQuery.isLoading) {
		return (
			<PageSectionLayout className="audit-page">
				<p className="text-sm text-slate-600" role="status">
					{text.loading}
				</p>
			</PageSectionLayout>
		);
	}

	if (auditQuery.isError || checklistQuery.isError || !audit) {
		const error = auditQuery.error ?? checklistQuery.error;
		return (
			<PageSectionLayout className="audit-page">
				<Alert
					variant="error"
					title={text.errorTitle}
					description={getAuditActionErrorMessage(error, "checklist")}
					primaryAction={{
						label: text.retry,
						onClick: () => {
							void auditQuery.refetch();
							void checklistQuery.refetch();
						},
					}}
				/>
			</PageSectionLayout>
		);
	}

	if (!permissions.canView) {
		return (
			<PageSectionLayout className="audit-page">
				<Alert
					variant="warning"
					title={text.deniedTitle}
					description={text.deniedDescription}
				/>
			</PageSectionLayout>
		);
	}

	return (
		<PageSectionLayout className="audit-page">
			<header className="flex flex-wrap items-start gap-3">
				<PageNavigation
					variant="button"
					direction="back"
					ariaLabel={text.back}
					to={detailPath}
				/>
				<div className="min-w-0 flex-1">
					<h1 className="break-words text-lg font-semibold text-(--color-text-primary)">
						{audit.dealerName}
					</h1>
					<p className="text-sm text-(--color-text-secondary)">
						{audit.auditNumber} · {formatPeriodLabel(audit.period)}
					</p>
				</div>
				<AuditStatusBadge status={audit.status} />
			</header>

			<div className="audit-stack">
				<AuditReminderBanner reminders={reminders} />

				<Card variant="outlined" padding="compact">
					<AuditProgressSummary
						label={isReviewing ? text.reviewProgress : text.selfProgress}
						progress={progress}
					/>
				</Card>

				<FilterTabs
					items={tabs}
					value={filter}
					onChange={setFilter}
					ariaLabel={text.filterLabel}
					variant="soft"
				/>

				{visibleSections.length === 0 ? (
					<p className="rounded-lg border border-dashed border-(--color-border-default) p-4 text-center text-sm text-slate-600">
						{items.length === 0 ? text.empty : text.emptyFiltered}
					</p>
				) : (
					<ChecklistItemList
						sections={visibleSections}
						showReviewer={permissions.canViewReviewerAssessment}
						renderLink={(item, className, children) => (
							<Link
								to={DEALER_AUDIT_ROUTES.execution.item(audit.id, item.id)}
								className={className}
							>
								{children}
							</Link>
						)}
					/>
				)}

				<Card variant="outlined" title={text.actionsTitle} padding="compact">
					<AuditWorkflowActions
						audit={audit}
						items={items}
						permissions={permissions}
						onOpenChecklist={() => setFilter("ALL")}
						onOpenReport={() =>
							navigate(DEALER_AUDIT_ROUTES.audits.report(audit.id))
						}
						onJumpToItem={(itemId) =>
							navigate(DEALER_AUDIT_ROUTES.execution.item(audit.id, itemId))
						}
						onReAuditCreated={(newAuditId) =>
							navigate(DEALER_AUDIT_ROUTES.audits.detail(newAuditId))
						}
					/>
				</Card>
			</div>
		</PageSectionLayout>
	);
}
