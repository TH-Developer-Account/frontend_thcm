// modules/audit/dealerAudit/pages/DealerAuditDashboardPage.tsx
//
// Landing page for every role: headline counts plus the finished audit
// reports. The server scopes both to what the user may see (a dealer gets
// only their own dealership).

import { useMemo } from "react";

import { Alert } from "../../../../components/common/Alert";
import { PageHeader } from "../../../../components/ui/PageHeader";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { formatPercent } from "../../shared/execution/audit-execution.format";
import { dealerCycleContent as content } from "../cycle/dealer-cycle.content";
import { useTrackerSummary } from "../cycle/hooks/useDealerCycle";
import { AuditReportList } from "./DealerAuditReportsPage";

const text = content.tracker.kpi;

export default function DealerAuditDashboardPage() {
	const summary = useTrackerSummary({
		periodType: null,
		year: null,
		quarter: null,
	});

	const tiles = useMemo(() => {
		const s = summary.data;
		const count = (value: number | undefined) => (s ? String(value ?? 0) : "—");
		return [
			{ id: "total", label: text.total, value: count(s?.total) },
			{ id: "notStarted", label: text.notStarted, value: count(s?.notStarted) },
			{ id: "inProgress", label: text.inProgress, value: count(s?.inProgress) },
			{
				id: "awaitingReview",
				label: text.awaitingReview,
				value: count(s?.awaitingReview),
			},
			{
				id: "clarification",
				label: text.clarification,
				value: count(s?.clarification),
			},
			{
				id: "awaitingApproval",
				label: text.awaitingApproval,
				value: count(s?.awaitingApproval),
			},
			{ id: "closed", label: text.closed, value: count(s?.closed) },
			{ id: "overdue", label: text.overdue, value: count(s?.overdue) },
			{
				id: "average",
				label: text.averageScore,
				value:
					s?.averageScorePercent != null
						? formatPercent(s.averageScorePercent)
						: "—",
			},
		];
	}, [summary.data]);

	return (
		<PageSectionLayout className="audit-page">
			<PageHeader
				headerText="Dealer Audit Dashboard"
				subtitleText="Where your audits stand, and the finished reports."
			/>
			<div className="audit-stack">
				{summary.isError ? (
					<Alert
						variant="error"
						title={content.common.loadError}
						primaryAction={{
							label: content.common.retry,
							onClick: () => void summary.refetch(),
						}}
					/>
				) : (
					<ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
						{tiles.map((tile) => (
							<li
								key={tile.id}
								className="rounded-lg border border-(--color-border-default) bg-white p-3"
							>
								<p className="break-words text-xs text-(--color-text-secondary)">
									{tile.label}
								</p>
								<p className="mt-1 text-2xl font-bold tabular-nums">
									{tile.value}
								</p>
							</li>
						))}
					</ul>
				)}
				<AuditReportList />
			</div>
		</PageSectionLayout>
	);
}
