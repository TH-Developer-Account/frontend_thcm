import type { EpfFormValues } from "../types/epf.types";

const n = (value: unknown) => Number(value) || 0;

export const validateEpfForm = (values: EpfFormValues) => {
	const errors: Partial<Record<keyof EpfFormValues, string>> = {};

	if (n(values.externalParticipants) < 0) {
		errors.externalParticipants = "External participants cannot be negative";
	}

	if (n(values.internalParticipants) < 0) {
		errors.internalParticipants = "Internal participants cannot be negative";
	}

	if (n(values.totalParticipants) <= 0) {
		errors.totalParticipants = "At least one participant is required";
	}

	if (n(values.eventBudget) <= 0) {
		errors.eventBudget = "Event budget is required";
	}

	if (!values.dealerName?.trim()) {
		errors.dealerName = "Dealer name is required";
	}

	if (n(values.dealerPercent) < 0 || n(values.dealerPercent) > 100) {
		errors.dealerPercent = "Dealer percentage must be between 0 and 100";
	}

	if (n(values.tataHitachiPoAmount) < 0) {
		errors.tataHitachiPoAmount = "PO amount cannot be negative";
	}

	const filledCount = Object.keys(values).filter((key) => {
		const value = values[key as keyof EpfFormValues];

		if (typeof value === "string") return value.trim().length > 0;
		if (typeof value === "number") return Number.isFinite(value);

		return Boolean(value);
	}).length;

	const totalCount = Object.keys(values).length;

	return {
		errors,
		isValid: Object.keys(errors).length === 0,
		progress: {
			filled: filledCount,
			total: totalCount,
			percentage: Math.round((filledCount / totalCount) * 100),
		},
	};
};
