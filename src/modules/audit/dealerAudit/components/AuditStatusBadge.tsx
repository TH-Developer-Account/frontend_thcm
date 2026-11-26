// modules/audit/dealerAudit/components/AuditStatusBadge.tsx
//
// Maps a Dealer Audit status onto the shared status chip. The label, tone
// and badge variant for each status live in dealer-audit.status.ts.

import AuditStatusChip from "../../shared/execution/components/AuditStatusChip";
import {
	getAuditStatusBadgeVariant,
	getAuditStatusLabel,
	getAuditStatusTone,
} from "../dealer-audit.status";
import type { DealerAuditStatus } from "../dealer-audit.types";

interface AuditStatusBadgeProps {
	status: DealerAuditStatus;
}

export default function AuditStatusBadge({ status }: AuditStatusBadgeProps) {
	return (
		<AuditStatusChip
			label={getAuditStatusLabel(status)}
			tone={getAuditStatusTone(status)}
			badgeVariant={getAuditStatusBadgeVariant(status)}
			status={status}
		/>
	);
}
