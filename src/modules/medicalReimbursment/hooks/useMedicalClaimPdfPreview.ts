import { useCallback, useState } from "react";

import { useToast } from "../../../context/Auth/AuthContext";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { useMedicalClaimPdfUrlMutation } from "./useMedicalClaimMutations";

/**
 * "View PDF" state for the claim page: fetches the signed PDF URL and keeps it
 * until the preview modal is closed. Downloading stays in useMedicalClaimView.
 */
export function useMedicalClaimPdfPreview(claimId: string) {
	const { showToast } = useToast();
	const pdfUrlMutation = useMedicalClaimPdfUrlMutation();
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);

	const handleViewPdf = useCallback(async () => {
		if (!claimId || pdfUrlMutation.isPending) return;
		try {
			setPdfUrl(await pdfUrlMutation.mutateAsync({ claimId }));
		} catch (error) {
			showToast({
				type: "error",
				title: "Unable to open the PDF",
				description: getApiErrorMessage(
					error,
					"Failed to load the medical claim PDF.",
				),
			});
		}
	}, [claimId, pdfUrlMutation, showToast]);

	const closePdfPreview = useCallback(() => setPdfUrl(null), []);

	return {
		pdfUrl,
		isPreparingPdf: pdfUrlMutation.isPending,
		handleViewPdf,
		closePdfPreview,
	};
}
