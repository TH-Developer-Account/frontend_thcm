import {
	BASE_STEPS,
	INTERRUPT_STEPS,
	SUCCESS_STEPS,
	type ApprovalApiStatus,
} from "../../../types";

export const getApprovalSteps = (status: ApprovalApiStatus) => {
	if (["PENDING", "SUBMITTED"].includes(status)) {
		return [...BASE_STEPS, ...SUCCESS_STEPS];
	}

	if (
		[
			"RECOMMENDED",
			"CHECKED",
			"APPROVED",
			"COMPLETED",
			"REPORT_SUBMITTED",
		].includes(status)
	) {
		return [...BASE_STEPS, ...SUCCESS_STEPS];
	}

	if (["SENT_BACK", "CANCELLED"].includes(status)) {
		return [...BASE_STEPS, INTERRUPT_STEPS.find((s) => s.api === status)!];
	}

	return BASE_STEPS;
};
