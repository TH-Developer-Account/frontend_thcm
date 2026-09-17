import { useMutation } from "@tanstack/react-query";

import { createPdfApi } from "./common.api";

type ActivityPlannerPdfType = "EVENT_PROPOSAL";
type MedicalClaimPdfType = "MEDICAL_CLAIM";

const activityPlannerPdfApi = createPdfApi<ActivityPlannerPdfType>();
const medicalClaimPdfApi = createPdfApi<MedicalClaimPdfType>();

export function useActivityPlannerPdfUrlMutation() {
	return useMutation({
		mutationFn: ({ epcId }: { epcId: string }) =>
			activityPlannerPdfApi.getPdfUrl("EVENT_PROPOSAL", epcId),
	});
}

export function useMedicalClaimPdfUrlMutation() {
	return useMutation({
		mutationFn: ({ claimId }: { claimId: string }) =>
			medicalClaimPdfApi.getPdfUrl("MEDICAL_CLAIM", claimId),
	});
}
