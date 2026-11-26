// modules/audit/shared/execution/components/AuditStatusChip.tsx
//
// One status presentation for every audit screen. Colour is never the only
// signal: each tone also carries an icon and the status text. The module
// decides the label, tone and badge variant for its own statuses.

import {
	CircleCheck,
	CircleDashed,
	CircleX,
	Clock,
	Loader,
	TriangleAlert,
	type LucideIcon,
} from "lucide-react";

import { Badge } from "../../../../../components/common/Badge";
import type { AuditBadgeVariant, AuditStatusTone } from "../audit-execution.types";

const TONE_ICONS: Record<AuditStatusTone, LucideIcon> = {
	neutral: CircleDashed,
	info: Loader,
	warning: Clock,
	caution: TriangleAlert,
	success: CircleCheck,
	danger: CircleX,
};

interface AuditStatusChipProps {
	label: string;
	tone: AuditStatusTone;
	badgeVariant: AuditBadgeVariant;
	/** Raw status value, passed to the badge for its own styling hooks. */
	status?: string;
}

export default function AuditStatusChip({
	label,
	tone,
	badgeVariant,
	status,
}: AuditStatusChipProps) {
	const Icon = TONE_ICONS[tone];
	return (
		<Badge variant={badgeVariant} status={status}>
			<span className="inline-flex items-center gap-1 whitespace-nowrap">
				<Icon className="size-3.5 shrink-0" aria-hidden="true" />
				{label}
			</span>
		</Badge>
	);
}
