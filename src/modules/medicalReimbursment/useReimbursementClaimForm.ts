import { useMemo, useState } from "react";

import {
	EMPTY_REIMBURSEMENT_CLAIM_VALUES,
	type ReimbursementClaimCategoryTotals,
	type ReimbursementClaimFormErrors,
	type ReimbursementClaimFormValues,
	type ReimbursementClaimSubmission,
} from "./reimbursementClaim.types";

const AMOUNT_FIELDS: Array<keyof ReimbursementClaimFormValues> = [
	"medicalAdvanceAmount",
	"companySettledAmount",
	"visitFeePerVisit",
	"doctorMedicineAmount",
	"injectionInvestigationAmount",
	"ecgXrayOtherAmount",
	"lensCost",
	"frameCost",
	"healthCheckupAmount",
	"excessHospitalizationAmount",
	"officeVisitFeesAmount",
	"officeMedicalAmount",
	"officeOphthalmicAmount",
	"officeHealthCheckupAmount",
	"officeExcessHospitalizationAmount",
	"passedAmount",
];

const CLAIM_TOTAL_INPUT_FIELDS = new Set<keyof ReimbursementClaimFormValues>([
	"numberOfVisits",
	"visitFeePerVisit",
	"doctorMedicineAmount",
	"injectionInvestigationAmount",
	"ecgXrayOtherAmount",
	"lensCost",
	"frameCost",
	"healthCheckupAmount",
	"excessHospitalizationAmount",
]);

const REQUIRED_TEXT_FIELDS: Array<
	keyof Pick<
		ReimbursementClaimFormValues,
		| "location"
		| "employeeName"
		| "ticketNumberOrGrade"
		| "patientName"
		| "relationshipWithEmployee"
		| "descriptionOfIllness"
		| "employeeSignature"
		| "claimDate"
	>
> = [
	"location",
	"employeeName",
	"ticketNumberOrGrade",
	"patientName",
	"relationshipWithEmployee",
	"descriptionOfIllness",
	"employeeSignature",
	"claimDate",
];

const REQUIRED_FIELD_MESSAGES: Partial<
	Record<keyof ReimbursementClaimFormValues, string>
> = {
	location: "Location is required.",
	employeeName: "Employee name is required.",
	ticketNumberOrGrade: "Ticket number or grade is required.",
	patientName: "Patient name is required.",
	relationshipWithEmployee: "Relationship with employee is required.",
	descriptionOfIllness: "Please describe the illness or treatment.",
	employeeSignature: "Type the employee name as the signature.",
	claimDate: "Claim date is required.",
};

const toNumber = (value: string): number => {
	const parsedValue = Number.parseFloat(value);
	return Number.isFinite(parsedValue) ? parsedValue : 0;
};

export const sanitizeAmountInput = (value: string): string => {
	const sanitizedValue = value.replace(/[^\d.]/g, "");
	const [whole = "", ...decimalParts] = sanitizedValue.split(".");

	if (decimalParts.length === 0) return whole;

	return `${whole}.${decimalParts.join("").slice(0, 2)}`;
};

export const sanitizeWholeNumberInput = (value: string): string =>
	value.replace(/\D/g, "");

export const getReimbursementClaimCategoryTotals = (
	values: ReimbursementClaimFormValues,
): ReimbursementClaimCategoryTotals => ({
	visitFees:
		toNumber(values.numberOfVisits) * toNumber(values.visitFeePerVisit),
	medical:
		toNumber(values.doctorMedicineAmount) +
		toNumber(values.injectionInvestigationAmount) +
		toNumber(values.ecgXrayOtherAmount),
	ophthalmic: toNumber(values.lensCost) + toNumber(values.frameCost),
	healthCheckup: toNumber(values.healthCheckupAmount),
	excessHospitalization: toNumber(values.excessHospitalizationAmount),
});

export const getReimbursementClaimTotal = (
	categoryTotals: ReimbursementClaimCategoryTotals,
): number =>
	Object.values(categoryTotals).reduce((total, amount) => total + amount, 0);

export const getOfficeApprovedTotal = (
	values: ReimbursementClaimFormValues,
): number =>
	[
		values.officeVisitFeesAmount,
		values.officeMedicalAmount,
		values.officeOphthalmicAmount,
		values.officeHealthCheckupAmount,
		values.officeExcessHospitalizationAmount,
	].reduce((total, amount) => total + toNumber(amount), 0);

export const validateReimbursementClaim = (
	values: ReimbursementClaimFormValues,
	claimedTotal: number,
): ReimbursementClaimFormErrors => {
	const nextErrors: ReimbursementClaimFormErrors = {};

	REQUIRED_TEXT_FIELDS.forEach((field) => {
		if (!values[field].trim()) {
			nextErrors[field] = REQUIRED_FIELD_MESSAGES[field];
		}
	});

	AMOUNT_FIELDS.forEach((field) => {
		const value = values[field];

		if (typeof value === "string" && value && toNumber(value) < 0) {
			nextErrors[field] = "Amount cannot be negative.";
		}
	});

	const hasVisitCount = Boolean(values.numberOfVisits);
	const hasVisitFee = Boolean(values.visitFeePerVisit);

	if (hasVisitCount !== hasVisitFee) {
		if (!hasVisitCount) {
			nextErrors.numberOfVisits = "Enter the number of visits.";
		}

		if (!hasVisitFee) {
			nextErrors.visitFeePerVisit = "Enter the fee per visit.";
		}
	}

	if (values.healthCheckupAmount && !values.patientAge.trim()) {
		nextErrors.patientAge =
			"Patient age is required for an executive health check-up claim.";
	}

	if (values.healthCheckupAmount && !values.lastHealthCheckupDate) {
		nextErrors.lastHealthCheckupDate = "Last health check-up date is required.";
	}

	if (claimedTotal <= 0) {
		nextErrors.claimedTotal = "Enter at least one claim amount.";
	}

	if (!values.declarationAccepted) {
		nextErrors.declarationAccepted =
			"Please accept the declaration before submitting.";
	}

	return nextErrors;
};

interface UseReimbursementClaimFormOptions {
	initialValues?: Partial<ReimbursementClaimFormValues>;
	onSubmit?: (submission: ReimbursementClaimSubmission) => void | Promise<void>;
	onSaveDraft?: (
		submission: ReimbursementClaimSubmission,
	) => void | Promise<void>;
}

export const useReimbursementClaimForm = ({
	initialValues,
	onSubmit,
	onSaveDraft,
}: UseReimbursementClaimFormOptions = {}) => {
	const getInitialValues = (): ReimbursementClaimFormValues => ({
		...EMPTY_REIMBURSEMENT_CLAIM_VALUES,
		...initialValues,
	});

	const [values, setValues] =
		useState<ReimbursementClaimFormValues>(getInitialValues);
	const [errors, setErrors] = useState<ReimbursementClaimFormErrors>({});
	const [loadingAction, setLoadingAction] = useState<"submit" | "draft" | null>(
		null,
	);
	const [mutationError, setMutationError] = useState("");

	const categoryTotals = useMemo(
		() => getReimbursementClaimCategoryTotals(values),
		[values],
	);
	const claimedTotal = useMemo(
		() => getReimbursementClaimTotal(categoryTotals),
		[categoryTotals],
	);
	const officeApprovedTotal = useMemo(
		() => getOfficeApprovedTotal(values),
		[values],
	);

	const handleChange = <K extends keyof ReimbursementClaimFormValues>(
		field: K,
		value: ReimbursementClaimFormValues[K],
	): void => {
		setValues((currentValues) => ({
			...currentValues,
			[field]: value,
		}));
		setErrors((currentErrors) => {
			const shouldClearFieldError = Boolean(currentErrors[field]);
			const shouldClearTotalError =
				CLAIM_TOTAL_INPUT_FIELDS.has(field) &&
				Boolean(currentErrors.claimedTotal);

			if (!shouldClearFieldError && !shouldClearTotalError) {
				return currentErrors;
			}

			const nextErrors = { ...currentErrors };
			delete nextErrors[field];
			if (shouldClearTotalError) delete nextErrors.claimedTotal;
			return nextErrors;
		});

		if (mutationError) setMutationError("");
	};

	const createSubmission = (): ReimbursementClaimSubmission => ({
		values,
		categoryTotals,
		claimedTotal,
		officeApprovedTotal,
	});

	const handleSubmit = async (): Promise<void> => {
		if (!onSubmit || loadingAction) return;

		const nextErrors = validateReimbursementClaim(values, claimedTotal);
		setErrors(nextErrors);

		if (Object.keys(nextErrors).length > 0) return;

		setLoadingAction("submit");
		setMutationError("");

		try {
			await onSubmit(createSubmission());
		} catch {
			setMutationError(
				"Unable to submit the reimbursement claim. Please try again.",
			);
		} finally {
			setLoadingAction(null);
		}
	};

	const handleSaveDraft = async (): Promise<void> => {
		if (!onSaveDraft || loadingAction) return;

		setLoadingAction("draft");
		setMutationError("");

		try {
			await onSaveDraft(createSubmission());
		} catch {
			setMutationError(
				"Unable to save the reimbursement claim draft. Please try again.",
			);
		} finally {
			setLoadingAction(null);
		}
	};

	const handleReset = (): void => {
		setValues(getInitialValues());
		setErrors({});
		setMutationError("");
	};

	return {
		values,
		errors,
		categoryTotals,
		claimedTotal,
		officeApprovedTotal,
		isLoading: loadingAction !== null,
		isSubmitting: loadingAction === "submit",
		isSavingDraft: loadingAction === "draft",
		mutationError,
		handleChange,
		handleSubmit,
		handleSaveDraft,
		handleReset,
	};
};
