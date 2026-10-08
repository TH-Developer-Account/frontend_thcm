import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
	useCreateGuestMedicalClaimMutation,
	useGuestClaimProfileQuery,
	useGuestReimbursementClaimDetailQuery,
	useResubmitGuestMedicalClaimMutation,
} from "./useReimbursementClaimQueries";

import {
	deriveAnnualCap,
	toMedicalClaimFormValues,
	toMedicalClaimLineItems,
} from "../../medicalReimbursment/helpers/medicalClaimListing.mapper";
import type {
	CoverageType,
	ReimbursementClaimFormValues,
	ReimbursementClaimSubmission,
} from "../../medicalReimbursment/types/reimbursementClaim.types";
import { buildMedicalClaimFormData } from "../../medicalReimbursment/helpers/reimbursementClaimForm.helper";
import { useMedicalClaimPermissions } from "../../medicalReimbursment/hooks/useMedicalClaimPermissions";
import { useGradeOptions } from "../../medicalReimbursment/hooks/useGradeOptions";
import { getStatusAlertConfig } from "../../../utils/statusAlert.helper";
import { getApiErrorMessage } from "../../../utils/apiError.helper";

export interface GuestReimbursementClaimAccess {
	canView: boolean;
	canEdit: boolean;
	canCreate: boolean;
	canResubmit: boolean;
}

/**
 * Guest-portal claim page (logged-in retiree):
 *  - existing claim → view; editable + resubmittable only while
 *    CLARIFICATION_REQUESTED (approver remarks shown read-only)
 *  - "create" → new claim prefilled from the guest's latest claim
 *    (POST /medi-claim/guest/submit)
 *
 * Toasts for submit/resubmit come from the shared form hook; errors thrown
 * here carry the server's message.
 */
export function useGuestMedicalClaimView(claimId = "") {
	const navigate = useNavigate();
	const isCreateMode = !claimId;

	const detailQuery = useGuestReimbursementClaimDetailQuery(claimId, !isCreateMode);
	const profileQuery = useGuestClaimProfileQuery(isCreateMode);
	const createMutation = useCreateGuestMedicalClaimMutation();
	const resubmitMutation = useResubmitGuestMedicalClaimMutation();

	const detail = detailQuery.data;
	const profile = profileQuery.data;
	const referenceNumber = detail?.referenceNumber;

	const permissions = useMedicalClaimPermissions({
		context: "guest",
		status: detail?.status,
		isCreate: isCreateMode,
	});

	const canCreate = isCreateMode && Boolean(profile?.canCreate);

	const access = useMemo<GuestReimbursementClaimAccess>(
		() => ({
			canView: isCreateMode ? canCreate : Boolean(detail),
			canEdit: isCreateMode ? canCreate : permissions.canEditClaim,
			canCreate,
			canResubmit: !isCreateMode && permissions.canEditClaim,
		}),
		[canCreate, detail, isCreateMode, permissions.canEditClaim],
	);

	const { gradeOptions } = useGradeOptions(
		{ kind: "guest" },
		isCreateMode
			? {
					grade: profile?.grade,
					derivedCap:
						profile?.eligibleAmount != null
							? Number(profile.eligibleAmount) + Number(profile.alreadySettled ?? 0)
							: null,
				}
			: { grade: detail?.grade, derivedCap: deriveAnnualCap(detail) },
	);

	const initialValues = useMemo<Partial<ReimbursementClaimFormValues> | undefined>(() => {
		if (detail) return toMedicalClaimFormValues(detail);
		if (isCreateMode && profile?.canCreate) {
			return {
				employeeName: profile.employeeName ?? "",
				ticketNumber: profile.ticketNumber ?? "",
				grade: profile.grade ?? "",
				location: profile.location ?? "",
				coverageType: (profile.claimCover ?? "") as CoverageType,
				spouseName: profile.spouseName ?? "",
				companySettledAmount:
					profile.alreadySettled != null ? String(profile.alreadySettled) : "",
			};
		}
		return undefined;
	}, [detail, isCreateMode, profile]);

	const initialLineItems = useMemo(
		() => (detail ? toMedicalClaimLineItems(detail) : []),
		[detail],
	);

	const submitClaim = useCallback(
		async (submission: ReimbursementClaimSubmission) => {
			const formData = buildMedicalClaimFormData(submission, {
				mode: "submit",
				existingBills: detail?.bills,
			});

			if (isCreateMode) {
				if (!canCreate) {
					throw new Error("New claims can't be started from this account. Please contact HR.");
				}
				const created = await createMutation.mutateAsync(formData);
				if (created?.id) navigate(`/guest/medi-claim/${created.id}`, { replace: true });
				return;
			}

			if (!access.canResubmit) {
				throw new Error("This claim cannot be edited or resubmitted.");
			}
			await resubmitMutation.mutateAsync({ claimId, formData });
		},
		[
			access.canResubmit,
			canCreate,
			claimId,
			createMutation,
			detail?.bills,
			isCreateMode,
			navigate,
			resubmitMutation,
		],
	);

	// Status banner — not shown in create mode (there's no status yet).
	const statusBanner = useMemo(
		() =>
			isCreateMode
				? null
				: getStatusAlertConfig(detail?.status, {
						entityLabel: "claim",
						// The approver's reason is shown in its own banner; this one
						// just tells the guest what to do next.
						...(detail?.status?.toUpperCase() === "CLARIFICATION_REQUESTED"
							? { description: "Please update the claim below and resubmit it for approval." }
							: {}),
					}),
		[detail?.status, isCreateMode],
	);

	const loadError = isCreateMode ? profileQuery.error : detailQuery.error;

	return {
		detail,
		isCreateMode,
		referenceNumber,
		isLoading: isCreateMode ? profileQuery.isLoading : detailQuery.isLoading,
		isError: isCreateMode ? profileQuery.isError : detailQuery.isError,
		errorMessage: getApiErrorMessage(
			loadError,
			isCreateMode
				? "Unable to start a new claim right now."
				: "Unable to load this medical reimbursement claim.",
		),

		initialValues,
		initialLineItems,
		gradeOptions,
		permissions,
		correctionReason: detail?.correctionReason ?? null,

		access,
		canView: access.canView,
		canEdit: access.canEdit,
		canCreate: access.canCreate,
		canResubmit: access.canResubmit,

		isSaving: createMutation.isPending || resubmitMutation.isPending,

		submitClaim,
		refetch: isCreateMode ? profileQuery.refetch : detailQuery.refetch,

		claimId,

		statusBanner,
		showAlertBanner: Boolean(statusBanner),
	};
}
