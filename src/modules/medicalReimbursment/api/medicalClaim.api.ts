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

type ApiDataResponse<T> = {
	success: boolean;
	data: T;
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
