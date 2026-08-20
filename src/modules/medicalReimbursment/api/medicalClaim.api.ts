import { ServerAxios } from "../../../services/ServerAxios";

import type {
	MedicalClaimDetail,
	MedicalClaimInitiationPayload,
	MedicalClaimListingApiResponse,
	MedicalClaimListingParams,
	MedicalClaimListingResult,
	MedicalClaimListingTab,
	MedicalClaimListItem,
	MedicalClaimMutationResponse,
} from "../types/medicalClaimListing.types";
import type { ClaimHeadRow } from "../types/reimbursementClaim.types";

const MEDICAL_CLAIM_URL = "/medi-claim";
const PUBLIC_MEDICAL_CLAIM_URL = `${MEDICAL_CLAIM_URL}/public`;
const GUEST_MEDICAL_CLAIM_URL = `${MEDICAL_CLAIM_URL}/guest`;

type ApiDataResponse<T> = {
	success: boolean;
	data: T;
};

type ApiMessageResponse = {
	success: boolean;
	message: string;
};
export type PdfType = "MEDICAL_CLAIM";

type PdfUrlResponse = {
	success: boolean;
	url: string;
};

export type ExportListingParams = {
	tab: MedicalClaimListingTab;
	search?: string;
	pageIndex: number;
	pageSize: number;
};
/**
 * Medical-claim-only endpoints live here. Workflow preview, assignment,
 * approval, clarification, activation, instance, and history calls belong to
 * modules/workflows/api/workflow.api.ts.
 */
export const medicalClaimApi = {
	listMedicalClaims: async (
		params: MedicalClaimListingParams,
	): Promise<MedicalClaimListingResult> => {
		const response = await ServerAxios.get<
			MedicalClaimListingApiResponse | MedicalClaimListItem[]
		>(MEDICAL_CLAIM_URL, {
			params: {
				tab: params.tab,
				search: params.search,
				page_index: params.pageIndex,
				page_size: params.pageSize,
			},
		});

		const body = response.data;
		const rows = Array.isArray(body) ? body : (body.data ?? []);

		return {
			rows,
			totalCount: Array.isArray(body)
				? rows.length
				: (body.total ?? rows.length),
			pageIndex: Array.isArray(body)
				? params.pageIndex
				: (body.page_index ?? params.pageIndex),
			pageSize: Array.isArray(body)
				? params.pageSize
				: (body.page_size ?? params.pageSize),
		};
	},

	getById: async (claimId: string): Promise<MedicalClaimDetail> => {
		const {
			data: { data },
		} = await ServerAxios.get<ApiDataResponse<MedicalClaimDetail>>(
			`${MEDICAL_CLAIM_URL}/${encodeURIComponent(claimId)}`,
		);

		return data;
	},

	initiate: async (
		payload: MedicalClaimInitiationPayload,
	): Promise<MedicalClaimMutationResponse> => {
		const {
			data: { data },
		} = await ServerAxios.post<ApiDataResponse<MedicalClaimMutationResponse>>(
			MEDICAL_CLAIM_URL,
			payload,
		);

		return data;
	},

	resendLink: async (
		claimId: string,
	): Promise<MedicalClaimMutationResponse> => {
		const {
			data: { data },
		} = await ServerAxios.post<ApiDataResponse<MedicalClaimMutationResponse>>(
			`${MEDICAL_CLAIM_URL}/${encodeURIComponent(claimId)}/resend-link`,
		);

		return data;
	},

	close: async (claimId: string): Promise<MedicalClaimMutationResponse> => {
		const {
			data: { data },
		} = await ServerAxios.post<ApiDataResponse<MedicalClaimMutationResponse>>(
			`${MEDICAL_CLAIM_URL}/${encodeURIComponent(claimId)}/close`,
		);

		return data;
	},

	getPublicByToken: async (token: string): Promise<MedicalClaimDetail> => {
		const {
			data: { data },
		} = await ServerAxios.get<ApiDataResponse<MedicalClaimDetail>>(
			`${PUBLIC_MEDICAL_CLAIM_URL}/${encodeURIComponent(token)}`,
		);

		return data;
	},

	submitPublic: async (token: string, formData: FormData): Promise<string> => {
		const {
			data: { message },
		} = await ServerAxios.post<ApiMessageResponse>(
			`${PUBLIC_MEDICAL_CLAIM_URL}/${encodeURIComponent(token)}/submit`,
			formData,
		);

		return message;
	},

	savePublicDraft: async (
		token: string,
		formData: FormData,
	): Promise<string> => {
		const {
			data: { message },
		} = await ServerAxios.patch<ApiMessageResponse>(
			`${PUBLIC_MEDICAL_CLAIM_URL}/${encodeURIComponent(token)}/draft`,
			formData,
		);

		return message;
	},

	listGuestClaims: async (): Promise<MedicalClaimListItem[]> => {
		const {
			data: { data },
		} = await ServerAxios.get<ApiDataResponse<MedicalClaimListItem[]>>(
			GUEST_MEDICAL_CLAIM_URL,
		);

		return data;
	},

	getGuestById: async (claimId: string): Promise<MedicalClaimDetail> => {
		const {
			data: { data },
		} = await ServerAxios.get<ApiDataResponse<MedicalClaimDetail>>(
			`${GUEST_MEDICAL_CLAIM_URL}/${encodeURIComponent(claimId)}`,
		);

		return data;
	},

	/** Saves corrections made by the THCM proposer before taking an action. */
	update: async (
		claimId: string,
		formData: FormData,
	): Promise<MedicalClaimDetail> => {
		const {
			data: { data },
		} = await ServerAxios.patch<ApiDataResponse<MedicalClaimDetail>>(
			`${MEDICAL_CLAIM_URL}/${encodeURIComponent(claimId)}`,
			formData,
		);

		return data;
	},

	/** Persists a proposer-approved amount for one bill. */
	approveLineItem: async (
		claimId: string,
		lineItem: Pick<ClaimHeadRow, "id" | "approvedClaimAmount">,
	): Promise<ClaimHeadRow> => {
		const {
			data: { data },
		} = await ServerAxios.patch<ApiDataResponse<ClaimHeadRow>>(
			`${MEDICAL_CLAIM_URL}/${encodeURIComponent(claimId)}/bills/approved-amounts`,
			{
				bills: [
					{
						billId: lineItem.id,
						approvedClaimAmount: Number(lineItem.approvedClaimAmount),
					},
				],
			},
		);

		return data;
	},
	getPublicPdf: async (pdfToken: string): Promise<Blob> => {
		const response = await ServerAxios.get<Blob>(
			`${PUBLIC_MEDICAL_CLAIM_URL}/pdf/${encodeURIComponent(pdfToken)}`,
			{
				responseType: "blob",
			},
		);

		return response.data;
	},

	getPdfUrl: async (
		type: PdfType,
		vendorRequestId: string,
	): Promise<string> => {
		const {
			data: { url },
		} = await ServerAxios.get<PdfUrlResponse>(
			`/pdf/${type}/${encodeURIComponent(vendorRequestId)}/url`,
		);

		return url;
	},
	exportListing: async (
		// claimId: string,
		params: ExportListingParams,
	): Promise<Blob> => {
		const response = await ServerAxios.get<Blob>(
			`${MEDICAL_CLAIM_URL}/export`,
			{
				params,
				responseType: "blob",
			},
		);
		return response.data;
	},
};
