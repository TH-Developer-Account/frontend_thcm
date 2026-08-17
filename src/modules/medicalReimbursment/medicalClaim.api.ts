import { ServerAxios } from "../../services/ServerAxios";

import type {
	MedicalClaimDetail,
	MedicalClaimInitiationPayload,
	MedicalClaimListingParams,
	MedicalClaimListingResult,
	MedicalClaimListItem,
	MedicalClaimMutationResponse,
} from "./medicalClaimListing.types";

const MEDICAL_CLAIM_URL = "/medical-claims";

const unwrapData = <T>(response: { data: T | { data: T } }): T => {
	const body = response.data;
	if (body && typeof body === "object" && "data" in body) {
		return (body as { data: T }).data;
	}
	return body as T;
};

export const medicalClaimApi = {
	listMedicalClaims: async (
		params: MedicalClaimListingParams,
	): Promise<MedicalClaimListingResult> => {
		const {
			data: { data },
		} = await ServerAxios.get(MEDICAL_CLAIM_URL, { params });
		return data;
	},

	async getById(claimId: string): Promise<MedicalClaimDetail> {
		const response = await ServerAxios.get<
			MedicalClaimDetail | { data: MedicalClaimDetail }
		>(`${MEDICAL_CLAIM_URL}/${claimId}`);
		return unwrapData(response);
	},

	async initiate(
		payload: MedicalClaimInitiationPayload,
	): Promise<MedicalClaimMutationResponse> {
		const response = await ServerAxios.post<MedicalClaimMutationResponse>(
			MEDICAL_CLAIM_URL,
			payload,
		);
		return response.data;
	},

	async resendLink(claimId: string): Promise<MedicalClaimMutationResponse> {
		const response = await ServerAxios.post<MedicalClaimMutationResponse>(
			`${MEDICAL_CLAIM_URL}/${claimId}/resend-link`,
		);
		return response.data;
	},

	async close(claimId: string): Promise<MedicalClaimMutationResponse> {
		const response = await ServerAxios.post<MedicalClaimMutationResponse>(
			`${MEDICAL_CLAIM_URL}/${claimId}/close`,
		);
		return response.data;
	},

	async getPublicByToken(token: string): Promise<MedicalClaimDetail> {
		const response = await ServerAxios.get<
			MedicalClaimDetail | { data: MedicalClaimDetail }
		>(`${MEDICAL_CLAIM_URL}/public/${token}`);
		return unwrapData(response);
	},

	async submitPublic(token: string, formData: FormData) {
		const response = await ServerAxios.post(
			`${MEDICAL_CLAIM_URL}/public/${token}/submit`,
			formData,
		);
		return response.data;
	},

	async savePublicDraft(token: string, formData: FormData) {
		const response = await ServerAxios.patch(
			`${MEDICAL_CLAIM_URL}/public/${token}/draft`,
			formData,
		);
		return response.data;
	},

	async listGuestClaims(): Promise<MedicalClaimListItem[]> {
		const response = await ServerAxios.get<
			MedicalClaimListItem[] | { data: MedicalClaimListItem[] }
		>(`${MEDICAL_CLAIM_URL}/guest`);
		return unwrapData(response);
	},

	async getGuestById(claimId: string): Promise<MedicalClaimDetail> {
		const response = await ServerAxios.get<
			MedicalClaimDetail | { data: MedicalClaimDetail }
		>(`${MEDICAL_CLAIM_URL}/guest/${claimId}`);
		return unwrapData(response);
	},

	async resubmitGuest(claimId: string, formData: FormData) {
		const response = await ServerAxios.patch(
			`${MEDICAL_CLAIM_URL}/guest/${claimId}/resubmit`,
			formData,
		);
		return response.data;
	},
};
