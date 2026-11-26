// modules/audit/shared/execution/components/AuditProgressSummary.tsx
//
// Progress and score tiles. Everything is derived from the checklist; no
// duplicated state.

import {
	auditExecutionContent as content,
	formatAuditMessage as format,
} from "../audit-execution.content";
import { formatPercent } from "../audit-execution.format";
import type { ChecklistProgress, ScoreTotals } from "../audit-execution.utils";

const text = content.progress;

interface AuditProgressSummaryProps {
	label: string;
	progress: ChecklistProgress;
	selfTotals?: ScoreTotals | null;
	finalTotals?: ScoreTotals | null;
}

function ScoreTile({
	label,
	totals,
}: {
	label: string;
	totals: ScoreTotals;
}) {
	return (
		<div className="rounded-lg border border-line bg-surface-muted px-3 py-2">
			<p className="text-xs font-medium text-fg-secondary">{label}</p>
			<p className="text-base font-semibold tabular-nums text-fg">
				{totals.obtained}/{totals.max}
				<span className="ml-1.5 text-xs font-normal text-fg-secondary">
					{formatPercent(totals.percent)}
				</span>
			</p>
		</div>
	);
}

export default function AuditProgressSummary({
	label,
	progress,
	selfTotals,
	finalTotals,
}: AuditProgressSummaryProps) {
	return (
		<div className="space-y-3">
			<div>
				<div className="mb-1 flex items-center justify-between text-xs">
					<span className="font-medium text-fg">{label}</span>
					<span className="tabular-nums text-fg-secondary">
						{format(text.counter, {
							completed: progress.completed,
							total: progress.total,
						})}
					</span>
				</div>
				<div
					role="progressbar"
					aria-label={label}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={progress.percent}
					className="h-2 overflow-hidden rounded-full bg-line"
				>
					<div
						className="h-full rounded-full bg-accent transition-[width]"
						style={{ width: `${progress.percent}%` }}
					/>
				</div>
			</div>

			{selfTotals || finalTotals ? (
				<div className="grid grid-cols-2 gap-2">
					{selfTotals ? (
						<ScoreTile label={text.selfScore} totals={selfTotals} />
					) : null}
					{finalTotals ? (
						<ScoreTile label={text.finalScore} totals={finalTotals} />
					) : null}
				</div>
			) : null}
		</div>
	);
}
