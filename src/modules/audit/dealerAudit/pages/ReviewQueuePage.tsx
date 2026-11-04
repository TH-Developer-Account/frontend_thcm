// modules/audit/dealerAudit/pages/ReviewQueuePage.tsx
//
// Reviewer queue (tabs with counts) and, with mode="approver", the approver's
// "waiting for your approval" list. Same cards, one clear button each.

import { ClipboardCheck, Eye, Gavel, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../../../components/ui/PageHeader";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { FilterTabs } from "../../../../components/ui/FilterTabs";
import AuditSummaryCard, {
	type AuditCardAction,
} from "../cycle/components/AuditSummaryCard";
import {
	PageEmpty,
	PageError,
	PageLoading,
} from "../cycle/components/AuditPageStates";
import { dealerCycleContent as content } from "../cycle/dealer-cycle.content";
import {
	APPROVER_QUEUE_STATUSES,
	REVIEW_QUEUE_STATUSES,
	REVIEW_QUEUE_TAB_ORDER,
} from "../cycle/dealer-cycle.logic";
import { useReviewQueueCounts } from "../cycle/hooks/useDealerCycle";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import type { DealerAuditListItem } from "../dealer-audit.types";
import { useDealerAuditList } from "../hooks/useDealerAudits";
import type { ReviewQueueTab } from "../cycle/dealer-cycle.types";

const reviewerText = content.queue.reviewer;
const approverText = content.queue.approver;

interface ReviewQueuePageProps {
	mode: "reviewer" | "approver";
}

export default function ReviewQueuePage({ mode }: ReviewQueuePageProps) {
	const navigate = useNavigate();
	const isApprover = mode === "approver";
	const [tab, setTab] = useState<ReviewQueueTab>("TO_REVIEW");

	const counts = useReviewQueueCounts(!isApprover);
	const statuses = isApprover ? APPROVER_QUEUE_STATUSES : REVIEW_QUEUE_STATUSES[tab];
	const params = useMemo(
		() => ({ page: 1, pageSize: 50, statuses: [...statuses] }),
		[statuses],
	);
	const audits = useDealerAuditList(params);

	const tabItems = REVIEW_QUEUE_TAB_ORDER.map((value) => ({
		value,
		label: reviewerText.tabs[value],
		count: counts.data?.[value],
	}));

	const buildAction = (audit: DealerAuditListItem): AuditCardAction | undefined => {
		if (isApprover) {
			return {
				label: approverText.action,
				Icon: Gavel,
				onClick: () => navigate(DEALER_AUDIT_ROUTES.audits.approval(audit.id)),
			};
		}
		switch (tab) {
			case "TO_REVIEW":
				return {
					label: reviewerText.action.start,
					Icon: Play,
					onClick: () => navigate(DEALER_AUDIT_ROUTES.audits.detail(audit.id)),
				};
			case "IN_REVIEW":
				return {
					label: reviewerText.action.continue,
					Icon: ClipboardCheck,
					onClick: () => navigate(DEALER_AUDIT_ROUTES.execution.checklist(audit.id)),
				};
			case "WITH_DEALER":
			case "COMPLETED":
				return {
					label: reviewerText.action.view,
					Icon: Eye,
					onClick: () => navigate(DEALER_AUDIT_ROUTES.audits.status(audit.id)),
				};
		}
	};

	const title = isApprover ? approverText.title : reviewerText.title;
	const subtitle = isApprover ? approverText.subtitle : reviewerText.subtitle;
	const emptyText = isApprover ? approverText.empty : reviewerText.empty;

	return (
		<PageSectionLayout className="audit-page">
			<PageHeader headerText={title} subtitleText={subtitle} />

			<div className="audit-stack">
				{!isApprover ? (
					<FilterTabs
						items={tabItems}
						value={tab}
						onChange={setTab}
						ariaLabel={reviewerText.title}
					/>
				) : null}

				{audits.isLoading ? <PageLoading /> : null}
				{audits.isError ? (
					<PageError message={audits.errorMessage} onRetry={() => void audits.refetch()} />
				) : null}
				{!audits.isLoading && !audits.isError && audits.items.length === 0 ? (
					<PageEmpty title={emptyText} />
				) : null}

				{audits.items.length > 0 ? (
					<ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{audits.items.map((audit) => (
							<li key={audit.id}>
								<AuditSummaryCard
									audit={audit}
									primaryAction={buildAction(audit)}
									showReviewer={isApprover}
									showScore
								/>
							</li>
						))}
					</ul>
				) : null}
			</div>
		</PageSectionLayout>
	);
}
