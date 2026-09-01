import { useCallback, useMemo, useState } from "react";

import {
	useGuestReimbursementClaimDetailQuery,
	useCreateGuestMedicalClaimMutation,
	useResubmitGuestMedicalClaimMutation,
	useGuestMedicalClaimPdfUrlMutation,
} from "./useReimbursementClaimQueries";

import {
	toMedicalClaimFormValues,
	toMedicalClaimLineItems,
} from "../../medicalReimbursment/helpers/medicalClaimListing.mapper";

import type { ReimbursementClaimSubmission } from "../../medicalReimbursment/types/reimbursementClaim.types";

import { useGuestAuth } from "../../../context/Auth/useGuestAuth";
import {
	buildMedicalClaimFormData,
	GUEST_EDITABLE_STATUSES,
	appendText,
} from "../../medicalReimbursment/helpers/reimbursementClaimForm.helper";
import { getStatusAlertConfig } from "../../../utils/statusAlert.helper";

export interface GuestReimbursementClaimAccess {
	canView: boolean;
	canEdit: boolean;
	canCreate: boolean;
	canResubmit: boolean;
}

const getGuestDisplayName = (
	guest: {
		first_name?: string;
		last_name?: string;
		firstName?: string;
		lastName?: string;
		name?: string;
		full_name?: string;
	} | null,
): string => {
	if (!guest) return "";
	const fullName = guest.name ?? guest.full_name;
	if (fullName?.trim()) return fullName.trim();

	return [
		guest.first_name ?? guest.firstName,
		guest.last_name ?? guest.lastName,
	]
		.filter(Boolean)
		.join(" ")
		.trim();
};

export function useGuestMedicalClaimView(claimId = "") {
	const isCreateMode = !claimId;

	const detailQuery = useGuestReimbursementClaimDetailQuery(
		claimId,
		!isCreateMode,
	);

	const createMutation = useCreateGuestMedicalClaimMutation();
	const resubmitMutation = useResubmitGuestMedicalClaimMutation();

	const { guest, isLoading: isGuestAuthLoading } = useGuestAuth();

	const detail = detailQuery.data;
	const referenceNumber = detail?.referenceNumber;

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

	const initialValues = useMemo(() => {
		if (detail) {
			return toMedicalClaimFormValues(detail);
		}

		// Contact details are sourced from guest auth and sent with create.
		// employeeName is the matching visible field in the reimbursement form.
		if (isCreateMode && guest) {
			const displayName = getGuestDisplayName(guest);
			return displayName ? { employeeName: displayName } : undefined;
		}

		return undefined;
	}, [detail, guest, isCreateMode]);

	const initialLineItems = useMemo(
		() => (detail ? toMedicalClaimLineItems(detail) : []),
		[detail],
	);

	const submitClaim = useCallback(
		async (submission: ReimbursementClaimSubmission) => {
			const guestDisplayName = getGuestDisplayName(guest);

			const enrichedSubmission =
				isCreateMode && guestDisplayName
					? {
							...submission,
							values: {
								...submission.values,
								employeeName:
									submission.values.employeeName || guestDisplayName,
							},
						}
					: submission;

			const formData = await buildMedicalClaimFormData(enrichedSubmission);

			if (isCreateMode && guest) {
				appendText(formData, "email", guest.email ?? "");
				appendText(formData, "mobile", guest.mobile ?? "");
			}

			if (isCreateMode) {
				await createMutation.mutateAsync(formData);
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
			guest,
			isCreateMode,
			resubmitMutation,
		],
	);

	// --- PDF (view/download) — no Excel export for guests ---
	const pdfUrlMutation = useGuestMedicalClaimPdfUrlMutation();
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [pdfAction, setPdfAction] = useState<"view" | "download" | null>(null);

	const handleViewPdf = useCallback(async () => {
		if (!claimId) return;

		setPdfAction("view");
		try {
			const url = await pdfUrlMutation.mutateAsync({ claimId });
			setPdfUrl(url);
		} catch {
			// no toast hook wired into this module currently
		} finally {
			setPdfAction(null);
		}
	}, [claimId, pdfUrlMutation]);

	const handleDownloadPdf = useCallback(async () => {
		if (!claimId) return;

		setPdfAction("download");
		try {
			const url = pdfUrl ?? (await pdfUrlMutation.mutateAsync({ claimId }));
			setPdfUrl(url);

			const response = await fetch(url);
			if (!response.ok) throw new Error("Failed to download PDF.");

			const pdfBlob = await response.blob();
			const blobUrl = window.URL.createObjectURL(
				new Blob([pdfBlob], { type: "application/pdf" }),
			);

			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = `medical-claim-${referenceNumber ?? claimId}.pdf`;
			document.body.appendChild(link);
			link.click();
			link.remove();

			window.URL.revokeObjectURL(blobUrl);
		} catch {
			// no toast hook wired into this module currently
		} finally {
			setPdfAction(null);
		}
	}, [claimId, pdfUrl, pdfUrlMutation, referenceNumber]);

	const isPreparingPdf = pdfUrlMutation.isPending && pdfAction === "view";
	const isDownloadingPdf = pdfUrlMutation.isPending && pdfAction === "download";

	// Status banner — guest view only. Not shown in create mode (there's no
	// status yet), only once an existing claim has a status worth surfacing
	// (approved/rejected/clarification — see getStatusAlertConfig for which
	// statuses actually produce a banner vs. return null for "in progress").
	const statusBanner = useMemo(
		() =>
			isCreateMode
				? null
				: getStatusAlertConfig(detail?.status, { entityLabel: "claim" }),
		[detail?.status, isCreateMode],
	);

	return {
		detail,
		isCreateMode,
		referenceNumber,
		isLoading: isGuestAuthLoading || (!isCreateMode && detailQuery.isLoading),
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

		claimId,
		pdfUrl,
		isPreparingPdf,
		isDownloadingPdf,
		handleViewPdf,
		handleDownloadPdf,

		// Status banner — consumed only by the guest page.
		statusBanner,
		showAlertBanner: Boolean(statusBanner),
	};
}
