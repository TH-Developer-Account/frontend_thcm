// modules/audit/shared/execution/components/DueDateLabel.tsx
//
// Due date with an overdue / due-soon cue. The module computes the SLA state
// from its own status rules and passes it in.

import { CalendarClock, TriangleAlert } from "lucide-react";

import {
	auditExecutionContent as content,
	formatAuditMessage as format,
} from "../audit-execution.content";
import { formatAuditDate, formatDaysDistance } from "../audit-execution.format";
import type { SlaState } from "../audit-execution.types";

const text = content.due;

interface DueDateLabelProps {
	dueAt: string | null;
	slaState: SlaState;
	/** Whole days until the due date (negative = overdue). */
	daysUntilDue: number | null;
}

export default function DueDateLabel({
	dueAt,
	slaState,
	daysUntilDue,
}: DueDateLabelProps) {
	if (!dueAt) {
		return <span className="text-xs text-slate-500">{text.notSet}</span>;
	}

	const dateLabel = formatAuditDate(dueAt);

	if (slaState === "OVERDUE" && daysUntilDue !== null) {
		return (
			<span className="inline-flex flex-col text-xs font-medium text-red-700">
				<span className="inline-flex items-center gap-1">
					<TriangleAlert className="size-3.5" aria-hidden="true" />
					{format(text.overdueBy, {
						distance: formatDaysDistance(daysUntilDue),
					})}
				</span>
				<span className="font-normal text-slate-500">{dateLabel}</span>
			</span>
		);
	}

	if (slaState === "DUE_SOON" && daysUntilDue !== null) {
		return (
			<span className="inline-flex flex-col text-xs font-medium text-amber-700">
				<span className="inline-flex items-center gap-1">
					<CalendarClock className="size-3.5" aria-hidden="true" />
					{daysUntilDue === 0
						? text.dueToday
						: format(text.dueIn, {
								distance: formatDaysDistance(daysUntilDue),
							})}
				</span>
				<span className="font-normal text-slate-500">{dateLabel}</span>
			</span>
		);
	}

	return <span className="text-xs text-slate-700">{dateLabel}</span>;
}
