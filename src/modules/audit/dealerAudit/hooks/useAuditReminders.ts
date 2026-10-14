// modules/audit/dealerAudit/hooks/useAuditReminders.ts
//
// In-app reminders for the current user. E-mail / push reminders and the
// quarter-end job are backend responsibilities (see DEALER_AUDIT_RULES).

import { useMemo } from "react";
import {
	getAuditReminders,
	type DealerAuditReminder,
	type ReminderAudience,
	type ReminderSubject,
} from "../dealer-audit.sla";

export function useAuditReminders(
	audit: ReminderSubject | undefined,
	audience: ReminderAudience,
): DealerAuditReminder[] {
	const status = audit?.status;
	const dueAt = audit?.dueAt ?? null;
	const period = audit?.period;

	return useMemo(
		() =>
			status && period
				? getAuditReminders({ status, dueAt, period }, audience, new Date())
				: [],
		[audience, dueAt, period, status],
	);
}
