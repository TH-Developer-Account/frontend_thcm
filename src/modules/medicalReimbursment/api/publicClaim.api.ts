import { PublicAxios } from "../../../services/PublicAxios";

import type {
	GradeEligibilityRow,
	MedicalClaimDetail,
} from "../types/medicalClaimListing.types";
import { MEDICLAIM_BACKEND } from "../utils/mediclaimBackend.config";

const PUBLIC_URL = "/medi-claim/public";

type ApiDataResponse<T> = {
	success: boolean;
	message?: string;
	data: T;
};

/**
 * Public claim endpoints use the emailed link token and do not require a
 * guest-authenticated Axios client.
 */
export const publicReimburseClaimApi = {
	getByToken: async (token: string): Promise<MedicalClaimDetail> => {
		const response = await PublicAxios.get<ApiDataResponse<MedicalClaimDetail>>(
			`${PUBLIC_URL}/${encodeURIComponent(token)}`,
		);
		return response.data.data;
	},

	listGrades: async (token: string): Promise<GradeEligibilityRow[]> => {
		if (!MEDICLAIM_BACKEND.gradesEndpoint) return [];
		const response = await PublicAxios.get<
			ApiDataResponse<GradeEligibilityRow[]>
		>(`${PUBLIC_URL}/${encodeURIComponent(token)}/grades`);
		return Array.isArray(response.data?.data) ? response.data.data : [];
	},

	submit: async (token: string, formData: FormData): Promise<string> => {
		const response = await PublicAxios.post<ApiDataResponse<unknown>>(
			`${PUBLIC_URL}/${encodeURIComponent(token)}/submit`,
			formData,
		);
		return response.data.message ?? "Claim submitted successfully";
	},

	/** Returns the saved claim (with server bill ids) so the form can re-sync. */
	saveDraft: async (
		token: string,
		formData: FormData,
	): Promise<MedicalClaimDetail | undefined> => {
		const response = await PublicAxios.patch<
			ApiDataResponse<MedicalClaimDetail>
		>(`${PUBLIC_URL}/${encodeURIComponent(token)}/draft`, formData);
		return response.data?.data;
	},
};
