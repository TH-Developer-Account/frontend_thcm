import { useCallback, useMemo } from "react";

import { useGuestReimbursementClaimDetailQuery } from "./useReimbursementClaimQueries";

import { useResubmitGuestMedicalClaimMutation } from "../../medicalReimbursment/hooks/useMedicalClaimMutations";

import {
	toMedicalClaimFormValues,
	toMedicalClaimLineItems,
} from "../../medicalReimbursment/helpers/medicalClaimListing.mapper";

import type { ReimbursementClaimSubmission } from "../../medicalReimbursment/types/reimbursementClaim.types";

const EDITABLE_STATUSES = new Set(["DRAFT", "CLARIFICATION_REQUESTED"]);

const appendText = (
	formData: FormData,
	name: string,
	value: string | number | boolean | null | undefined,
) => {
	if (value !== undefined && value !== null) {
		formData.append(name, String(value));
	}
};

const buildMedicalClaimFormData = (
	submission: ReimbursementClaimSubmission,
): FormData => {
	const { values } = submission;
	const formData = new FormData();

	appendText(formData, "grade", values.grade);
	appendText(formData, "location", values.location);
	appendText(formData, "claimCover", values.coverageType);
	appendText(formData, "spouseName", values.spouseName);
	appendText(formData, "signatureDate", values.claimDate);
	appendText(formData, "declarationAccepted", values.declarationAccepted);
	appendText(
		formData,
		"signatureName",
		values.employeeSignature?.trim() || values.employeeName.trim(),
	);

	const files: File[] = [];

	const bills = submission.lineItems.map((item) => ({
		id: item.id,
		claimHead: item.claimHead,
		billNo: item.billNumber.trim(),
		billName: item.billName.trim(),
		billDate: item.billDate || undefined,
		amount: Number(item.amount) || 0,
		attachmentIndex: item.file ? files.push(item.file) - 1 : null,
	}));

	formData.append("bills", JSON.stringify(bills));

	files.forEach((file) => {
		formData.append("billAttachments", file, file.name);
	});

	return formData;
};

export interface GuestReimbursementClaimAccess {
	canView: boolean;
	canEdit: boolean;
	canResubmit: boolean;
}

export function useGuestMedicalClaimView(claimId: string) {
	const detailQuery = useGuestReimbursementClaimDetailQuery(
		claimId,
		Boolean(claimId),
	);

	const resubmitMutation = useResubmitGuestMedicalClaimMutation();

	const detail = detailQuery.data;

	const access = useMemo<GuestReimbursementClaimAccess>(() => {
		const normalizedStatus = detail?.status?.toUpperCase() ?? "";

		const canEdit = EDITABLE_STATUSES.has(normalizedStatus);

		return {
			canView: Boolean(detail),
			canEdit,
			canResubmit: canEdit,
		};
	}, [detail]);

	const initialValues = useMemo(
		() => (detail ? toMedicalClaimFormValues(detail) : undefined),
		[detail],
	);

	const initialLineItems = useMemo(
		() => (detail ? toMedicalClaimLineItems(detail) : []),
		[detail],
	);

	const resubmitClaim = useCallback(
		async (submission: ReimbursementClaimSubmission) => {
			if (!access.canResubmit) {
				throw new Error("This claim cannot be edited or resubmitted.");
			}

			const formData = buildMedicalClaimFormData(submission);

			await resubmitMutation.mutateAsync({
				claimId,
				formData,
			});
		},
		[access.canResubmit, claimId, resubmitMutation],
	);

	return {
		detail,

		isLoading: detailQuery.isLoading,
		isError: detailQuery.isError,

		initialValues,
		initialLineItems,

		access,

		canView: access.canView,
		canEdit: access.canEdit,
		canResubmit: access.canResubmit,

		isSaving: resubmitMutation.isPending,

		resubmitClaim,

		refetch: detailQuery.refetch,
	};
}
