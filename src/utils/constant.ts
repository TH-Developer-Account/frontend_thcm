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
} as const;

export type ReasonActionMode = keyof typeof REASON_ACTION_MODAL_COPY;

export const REASON_ACTION_MODAL_LABEL = "Reason";
export const REASON_ACTION_MODAL_SHORTCUT_HINT = "Ctrl + Enter to submit";
