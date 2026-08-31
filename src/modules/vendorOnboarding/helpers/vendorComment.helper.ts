import {
	getAuditMessage,
	type AuditLogEntry,
} from "../../../components/ui/audit";
import type { MentionableUserInput } from "../../../components/ui/comments";

export type VendorCommentApprovalUser = MentionableUserInput;

export type VendorCommentApproval = {
	id: string;
	approverId?: string | null;
	status?: string | null;
	approver?: VendorCommentApprovalUser | null;
};

export type VendorCommentWorkflowStage = {
	id?: string;
	stageName?: string | null;
	status?: string | null;
	isCurrentIteration?: boolean | null;
	approvals?: readonly VendorCommentApproval[] | null;
};

export const getVendorAuditMessage = (entry: AuditLogEntry): string => {
	return getAuditMessage(entry, {
		entityName: "vendor onboarding request",

		actionMessages: {
			VENDOR_ONBOARDING_CREATED: ({ actorName }) =>
				`${actorName} created the vendor onboarding request.`,

			VENDOR_CREATED: ({ actorName }) =>
				`${actorName} created the vendor onboarding request.`,

			VENDOR_SUBMITTED: ({ actorName }) =>
				`${actorName} submitted the vendor details.`,

			SUBMITTED_BY_VENDOR: ({ actorName }) =>
				`${actorName} submitted the vendor details.`,

			THCM_SUBMITTED: ({ actorName }) =>
				`${actorName} submitted the vendor request for approval.`,

			THCM_APPROVED: ({ actorName, stageSuffix }) =>
				`${actorName} approved the vendor request${stageSuffix}.`,

			EXTERNAL_ACCEPTED: ({ actorName, stageSuffix }) =>
				`${actorName} accepted the vendor request${stageSuffix}.`,

			VENDOR_RESUBMITTED: ({ actorName }) =>
				`${actorName} resubmitted the vendor details.`,
		},
	});
};
