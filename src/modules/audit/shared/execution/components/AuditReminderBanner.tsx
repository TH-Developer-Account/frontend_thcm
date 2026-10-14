// modules/audit/shared/execution/components/AuditReminderBanner.tsx
//
// In-app reminders (SLA + end-of-period). E-mail / push delivery and the
// quarter-end auto-finalisation job belong to the backend.

import { Alert } from "../../../../../components/common/Alert";
import { auditExecutionContent as content } from "../audit-execution.content";
import type { AuditReminder, ReminderSeverity } from "../audit-execution.types";

const ALERT_VARIANT = {
	info: "info",
	warning: "warning",
	danger: "error",
} as const satisfies Record<ReminderSeverity, "info" | "warning" | "error">;

const TITLES: Record<ReminderSeverity, string> = content.reminders.titles;

interface AuditReminderBannerProps {
	reminders: readonly AuditReminder[];
}

export default function AuditReminderBanner({
	reminders,
}: AuditReminderBannerProps) {
	if (reminders.length === 0) return null;

	return (
		<section
			aria-label={content.reminders.regionLabel}
			className="space-y-2"
		>
			{reminders.map((reminder) => (
				<Alert
					key={reminder.id}
					variant={ALERT_VARIANT[reminder.severity]}
					title={TITLES[reminder.severity]}
					description={reminder.message}
				/>
			))}
		</section>
	);
}
