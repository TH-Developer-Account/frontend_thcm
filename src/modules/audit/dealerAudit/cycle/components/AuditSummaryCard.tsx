// modules/audit/dealerAudit/cycle/components/AuditSummaryCard.tsx
//
// One audit as a friendly card: who, which period, status, deadline,
// progress, score and ONE clear primary button. Used by "My audits", the
// reviewer / approver queues, the reports list and the tracker's mobile view.
// Presentational: the page decides the button label and what it does.

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import Button from "../../../../../components/common/Button";
import { formatPercent } from "../../../shared/execution/audit-execution.format";
import AuditDueLabel from "../../components/AuditDueLabel";
import AuditStatusBadge from "../../components/AuditStatusBadge";
import { formatPeriodLabel } from "../../dealer-audit.sla";
import type { DealerAuditListItem } from "../../dealer-audit.types";
import { dealerCycleContent, formatCycleMessage } from "../dealer-cycle.content";

export interface AuditCardAction {
	label: string;
	onClick: () => void;
	Icon?: LucideIcon;
	disabled?: boolean;
}

interface AuditSummaryCardProps {
	audit: DealerAuditListItem;
	primaryAction?: AuditCardAction;
	/** Extra info lines under the status row (e.g. "Reviewer asked for changes"). */
	note?: ReactNode;
	/** Secondary controls (menu, link). */
	secondary?: ReactNode;
	showScore?: boolean;
	showReviewer?: boolean;
}

const progressPercent = (done: number, total: number): number =>
	total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

export default function AuditSummaryCard({
	audit,
	primaryAction,
	note,
	secondary,
	showScore = true,
	showReviewer = false,
}: AuditSummaryCardProps) {
	const text = dealerCycleContent.myAudits;
	const percent = progressPercent(audit.completedItems, audit.totalItems);
	const score = audit.finalScore ?? audit.selfScore;
	const scorePercent =
		score !== null && audit.maxScore > 0
			? Math.round((score / audit.maxScore) * 1000) / 10
			: null;

	return (
		<article className="flex h-full flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm">
			<header className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<h3 className="break-words text-base font-semibold text-fg">
						{audit.dealerName}
					</h3>
					<p className="break-words text-xs text-fg-secondary">
						{[audit.dealerCode, audit.location].filter(Boolean).join(" · ")}
					</p>
					<p className="mt-0.5 text-xs text-fg-secondary">
						{audit.auditNumber} · {formatPeriodLabel(audit.period)}
					</p>
				</div>
				<AuditStatusBadge status={audit.status} />
			</header>

			<div className="flex flex-wrap items-center justify-between gap-2 text-sm">
				<AuditDueLabel status={audit.status} dueAt={audit.dueAt} />
				{showReviewer && audit.assignedReviewer ? (
					<span className="text-xs text-fg-secondary">
						{audit.assignedReviewer.name}
					</span>
				) : null}
			</div>

			<div>
				<div className="mb-1 flex items-center justify-between text-xs text-fg-secondary">
					<span>
						{formatCycleMessage(text.progress, {
							done: audit.completedItems,
							total: audit.totalItems,
						})}
					</span>
					<span className="font-medium tabular-nums text-fg">{percent}%</span>
				</div>
				<div
					className="h-2 overflow-hidden rounded-full bg-line"
					role="progressbar"
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={percent}
					aria-label={formatCycleMessage(text.progress, {
						done: audit.completedItems,
						total: audit.totalItems,
					})}
				>
					<div className="h-full bg-accent" style={{ width: `${percent}%` }} />
				</div>
			</div>

			{showScore && score !== null ? (
				<p className="text-sm tabular-nums">
					<span className="text-lg font-semibold text-fg">{score}</span>
					<span className="text-fg-secondary">/{audit.maxScore}</span>
					{scorePercent !== null ? (
						<span className="ml-2 text-xs font-medium text-fg-secondary">
							{formatPercent(scorePercent)}
						</span>
					) : null}
				</p>
			) : null}

			{note ? <div className="text-sm">{note}</div> : null}

			<footer className="mt-auto flex items-center gap-2 pt-1">
				{primaryAction ? (
					<div className="min-w-0 flex-1">
						<Button
							type="button"
							text={primaryAction.label}
							Icon={primaryAction.Icon}
							appearance="standard"
							variant="brand"
							size="lg"
							fullWidth
							disabled={primaryAction.disabled}
							onClick={primaryAction.onClick}
						/>
					</div>
				) : null}
				{secondary}
			</footer>
		</article>
	);
}
