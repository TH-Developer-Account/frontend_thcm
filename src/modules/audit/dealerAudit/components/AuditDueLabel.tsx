// modules/audit/dealerAudit/components/AuditDueLabel.tsx
//
// Applies the Dealer Audit SLA rules (which statuses are tracked, the
// due-soon window) and renders the shared due-date label.

import DueDateLabel from "../../shared/execution/components/DueDateLabel";
import { computeSlaState, getCalendarDaysUntil } from "../dealer-audit.sla";
import type { DealerAuditStatus } from "../dealer-audit.types";

interface AuditDueLabelProps {
	status: DealerAuditStatus;
	dueAt: string | null;
}

export default function AuditDueLabel({ status, dueAt }: AuditDueLabelProps) {
	const now = new Date();
	return (
		<DueDateLabel
			dueAt={dueAt}
			slaState={computeSlaState(status, dueAt, now)}
			daysUntilDue={getCalendarDaysUntil(dueAt, now)}
		/>
	);
}
