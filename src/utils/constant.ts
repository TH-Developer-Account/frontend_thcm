export const REASON_ACTION_MODAL_COPY = {
	"clarify-workflow": {
		title: "Send for Clarification",
		description:
			"This will send the request back to the proposer. The proposer can update the required information and resubmit the workflow.",
		placeholder: "Enter the changes required before approval.",
		confirmText: "Send Clarification",
		loadingText: "Sending...",
	},
	"clarify-report": {
		title: "Clarify Report",
		description:
			"This will send only the report back to the proposer for correction. It will not restart the approval workflow.",
		placeholder: "Enter the corrections required in the report.",
		confirmText: "Clarify Report",
		loadingText: "Sending...",
	},
	"reject-handout": {
		title: "Reject Request",
		description:
			"This will reject the handout request. The requester will be notified with the reason you enter.",
		placeholder: "Enter the reason for rejecting this request.",
		confirmText: "Reject Request",
		loadingText: "Rejecting...",
	},
	"cancel-handout": {
		title: "Cancel Request",
		description:
			"This will withdraw your handout request. This can't be undone.",
		placeholder: "Enter the reason for cancelling this request.",
		confirmText: "Cancel Request",
		loadingText: "Cancelling...",
	},
} as const;

export type ReasonActionMode = keyof typeof REASON_ACTION_MODAL_COPY;

export const REASON_ACTION_MODAL_LABEL = "Reason";
export const REASON_ACTION_MODAL_SHORTCUT_HINT = "Ctrl + Enter to submit";
