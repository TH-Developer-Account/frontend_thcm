import { useCallback, useMemo } from "react";

import {
	useGuestReimbursementClaimDetailQuery,
	useResubmitGuestMedicalClaimMutation,
} from "./useReimbursementClaimQueries";

import { useSubmitPublicMedicalClaimMutation } from "../../medicalReimbursment/hooks/useMedicalClaimMutations";

import {
	toMedicalClaimFormValues,
	toMedicalClaimLineItems,
} from "../../medicalReimbursment/helpers/medicalClaimListing.mapper";

import type { ReimbursementClaimSubmission } from "../../medicalReimbursment/types/reimbursementClaim.types";

import {
	buildMedicalClaimFormData,
	GUEST_EDITABLE_STATUSES,
} from "../../medicalReimbursment/helpers/reimbursementClaimForm.helper";

export interface GuestReimbursementClaimAccess {
	canView: boolean;
	canEdit: boolean;
	canCreate: boolean;
	canResubmit: boolean;
}

export function useGuestMedicalClaimView(claimId = "") {
	const isCreateMode = !claimId;

	const detailQuery = useGuestReimbursementClaimDetailQuery(
		claimId,
		!isCreateMode,
	);

	const createMutation = useSubmitPublicMedicalClaimMutation();
	const resubmitMutation = useResubmitGuestMedicalClaimMutation();

	const detail = detailQuery.data;

	const access = useMemo<GuestReimbursementClaimAccess>(() => {
		if (isCreateMode) {
			return {
				canView: true,
				canEdit: true,
				canCreate: true,
				canResubmit: false,
			};
		}

		const normalizedStatus = detail?.status?.toUpperCase() ?? "";
		const canEdit = GUEST_EDITABLE_STATUSES.has(normalizedStatus);

		return {
			canView: Boolean(detail),
			canEdit,
			canCreate: false,
			canResubmit: canEdit,
		};
	}, [detail, isCreateMode]);

	const initialValues = useMemo(
		() => (detail ? toMedicalClaimFormValues(detail) : undefined),
		[detail],
	);

	const initialLineItems = useMemo(
		() => (detail ? toMedicalClaimLineItems(detail) : []),
		[detail],
	);

	const submitClaim = useCallback(
		async (submission: ReimbursementClaimSubmission) => {
			const formData = await buildMedicalClaimFormData(submission);

			if (isCreateMode) {
				await createMutation.mutateAsync({ formData });
				return;
			}

			if (!access.canResubmit) {
				throw new Error("This claim cannot be edited or resubmitted.");
			}

			await resubmitMutation.mutateAsync({
				claimId,
				formData,
			});
		},
		[
			access.canResubmit,
			claimId,
			createMutation,
			isCreateMode,
			resubmitMutation,
		],
	);

	return {
		detail,
		isCreateMode,

		isLoading: !isCreateMode && detailQuery.isLoading,
		isError: !isCreateMode && detailQuery.isError,

		initialValues,
		initialLineItems,

		access,
		canView: access.canView,
		canEdit: access.canEdit,
		canCreate: access.canCreate,
		canResubmit: access.canResubmit,

		isSaving: createMutation.isPending || resubmitMutation.isPending,

		submitClaim,

		refetch: detailQuery.refetch,
	};
}
