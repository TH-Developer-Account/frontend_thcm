import type {
	ApiDateString,
	EpcWorkflowApproval,
	EpcWorkflowStage,
} from "./epc.types";
import type { CommentUser } from "../components/commentSection/CommentsSection";

export type MenuAction = {
	icon: React.ElementType;
	label: string;
	action: string;
};

export type FormatType = "bold" | "italic" | "code" | "bullet";

export type PopupState = "emoji" | "format" | "menu" | null;

export type RichTextareaProps = {
	// Base (mirrors TextareaInput)
	name: string;
	label?: string;
	placeholder?: string;
	value: string;
	error?: string;
	className?: string;
	required?: boolean;
	disabled?: boolean;
	helperText?: string;
	isTooltip?: boolean;
	maxLength?: number;
	autoFocus?: boolean;
	rows?: number;
	onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
	// Rich-text
	mentionedUser?: string;
	mentionableUsers?: CommentUser[];
	onMentionInsert?: (user: CommentUser) => void;
	onFileAttach?: (files: FileList) => void;
	// Toolbar actions
	submitText?: string;
	submitting?: boolean;
	hasRealContent?: boolean;
	onSubmit?: () => void;
	menuItems?: MenuAction[];
	onMenuAction?: (action: string) => void;
	canApprove?: boolean;
	canClarify?: boolean;
	onApprove?: () => void;
	onClarify?: () => void;
};
export type WorkflowStage = EpcWorkflowStage;
export type WorkflowApproval = EpcWorkflowApproval;

export type WorkflowStageStatus =
	| "PENDING"
	| "IN_PROGRESS"
	| "APPROVED"
	| "REJECTED";

export type WorkflowStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type WorkflowStrategy = "ALL" | "ANY" | "SOME" | "QUORUM";

export type WorkflowComment = {
	id: string;
	message: string;
	entryType?: string;
	action?: string;
	reason?: string;
	stageName?: string;
	createdAt: ApiDateString;
	updatedAt?: ApiDateString;
	actor: {
		id: string;
		first_name: string;
		last_name: string;
	};
};
