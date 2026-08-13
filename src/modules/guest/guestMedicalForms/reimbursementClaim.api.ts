import { ServerAxios } from "../../../services/ServerAxios";

import type {
	PublicClaimSessionResponse,
	ReimbursementClaimListParams,
	ReimbursementClaimListResponse,
	ReimbursementClaimResponse,
	UpdateReimbursementClaimVariables,
} from "./reimbursementClaim.types";

const CLAIM_URL = "/medical-reimbursement";
const PUBLIC_CLAIM_URL = `${CLAIM_URL}/public`;

const unwrap = <T>(response: { data: T | { data: T } }): T => {
	const body = response.data;
	return typeof body === "object" && body !== null && "data" in body
		? (body as { data: T }).data
		: (body as T);
};

export const reimbursementClaimApi = {
	list: async (
		params: ReimbursementClaimListParams,
	): Promise<ReimbursementClaimListResponse> => {
		const response = await ServerAxios.get(CLAIM_URL, { params });
		return unwrap(response);
	},

	getById: async (claimId: string): Promise<ReimbursementClaimResponse> => {
		const response = await ServerAxios.get(`${CLAIM_URL}/${claimId}`);
		return unwrap(response);
	},

	createDraft: async (
		formData: FormData,
	): Promise<ReimbursementClaimResponse> => {
		const response = await ServerAxios.post(CLAIM_URL, formData);
		return unwrap(response);
	},

	update: async ({
		claimId,
		formData,
	}: UpdateReimbursementClaimVariables): Promise<ReimbursementClaimResponse> => {
		const response = await ServerAxios.patch(
			`${CLAIM_URL}/${claimId}`,
			formData,
		);
		return unwrap(response);
	},

	submit: async (claimId: string): Promise<ReimbursementClaimResponse> => {
		const response = await ServerAxios.post(`${CLAIM_URL}/${claimId}/submit`);
		return unwrap(response);
	},

	getPublicSession: async (
		sessionCode: string,
	): Promise<PublicClaimSessionResponse> => {
		const response = await ServerAxios.get(
			`${PUBLIC_CLAIM_URL}/session/${sessionCode}`,
		);
		return unwrap(response);
	},

	savePublicDraft: async ({
		sessionCode,
		formData,
	}: {
		sessionCode: string;
		formData: FormData;
	}): Promise<ReimbursementClaimResponse> => {
		const response = await ServerAxios.post(
			`${PUBLIC_CLAIM_URL}/session/${sessionCode}/draft`,
			formData,
		);
		return unwrap(response);
	},

	submitPublic: async ({
		sessionCode,
		formData,
	}: {
		sessionCode: string;
		formData: FormData;
	}): Promise<ReimbursementClaimResponse> => {
		const response = await ServerAxios.post(
			`${PUBLIC_CLAIM_URL}/session/${sessionCode}/submit`,
			formData,
		);
		return unwrap(response);
	},
};
