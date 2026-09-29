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
