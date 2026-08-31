import { ServerAxios } from "../../../services/ServerAxios";

import type {
	ExportListingParams,
	MedicalClaimDetail,
	MedicalClaimExportQueueResponse,
	MedicalClaimExportStatusResponse,
	MedicalClaimInitiationPayload,
	MedicalClaimListingApiResponse,
	MedicalClaimListingParams,
	MedicalClaimListingResult,
	MedicalClaimListItem,
	MedicalClaimMutationResponse,
} from "../types/medicalClaimListing.types";
import type {
	MedicalClaimInitiationImportPayload,
	BulkMedicalClaimInitiationPayload,
	BulkMedicalClaimInitiationResponse,
	MedicalClaimInitiationImportResponse,
} from "../types/medicalClaimInitiation.types";
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
				// Status filtering is currently done on the frontend
				// (see useMedicalClaimListing). Once the backend accepts a
				// status filter, add `status` to MedicalClaimListingParams
				// and uncomment this:
				// status: params.status !== "all" ? params.status : undefined,
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
	importInitiations: async (
		payload: MedicalClaimInitiationImportPayload,
	): Promise<MedicalClaimInitiationImportResponse> => {
		const { data: response } =
			await ServerAxios.post<MedicalClaimInitiationImportResponse>(
				"/import/leads",
				payload,
				{
					headers: {
						"Content-Type": "multipart/form-data",
					},
				},
			);

		return response;
	},
	initiateImportedEmployees: async (
		payload: BulkMedicalClaimInitiationPayload,
	): Promise<BulkMedicalClaimInitiationResponse> => {
		const { data } = await ServerAxios.post<BulkMedicalClaimInitiationResponse>(
			"/medi-claim/initiate/bulk",
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

	/** Persists a proposer-approved amount for one bill. Backend returns no row — caller updates cache from variables. */
	approveLineItem: async (
		claimId: string,
		lineItem: Pick<ClaimHeadRow, "id" | "approvedClaimAmount" | "remarks">,
	): Promise<void> => {
		await ServerAxios.patch(
			`${MEDICAL_CLAIM_URL}/${encodeURIComponent(claimId)}/bills/approved-amounts`,
			{
				bills: [
					{
						billId: lineItem.id,
						approvedClaimAmount: Number(lineItem.approvedClaimAmount),
						remarks: lineItem.remarks,
					},
				],
			},
		);
	},

	/** Persists remarks for one bill. Backend returns no row — caller updates cache from variables. */
	saveLineItemRemarks: async (
		claimId: string,
		lineItem: Pick<ClaimHeadRow, "id" | "remarks">,
	): Promise<void> => {
		await ServerAxios.patch(
			`${MEDICAL_CLAIM_URL}/${encodeURIComponent(claimId)}/bills/remarks`,
			{
				bills: [{ billId: lineItem.id, remarks: lineItem.remarks }],
			},
		);
	},

	getPdfUrl: async (type: PdfType, claimId: string): Promise<string> => {
		const {
			data: { url },
		} = await ServerAxios.get<PdfUrlResponse>(
			`/pdf/${type}/${encodeURIComponent(claimId)}/url`,
		);

		return url;
	},
	enqueueListingExport: async (
		params: ExportListingParams,
	): Promise<MedicalClaimExportQueueResponse> => {
		const { data } = await ServerAxios.post<MedicalClaimExportQueueResponse>(
			`${MEDICAL_CLAIM_URL}/export`,
			{
				tab: params.tab,
				search: params.search?.trim() ?? "",
				format: params.format ?? "xlsx",
			},
		);

		return data;
	},

	getListingExportStatus: async (
		jobId: string,
	): Promise<MedicalClaimExportStatusResponse> => {
		const { data } = await ServerAxios.get<MedicalClaimExportStatusResponse>(
			`${MEDICAL_CLAIM_URL}/export/status/${encodeURIComponent(jobId)}`,
		);

		return data;
	},

	downloadExportFile: async (downloadUrl: string): Promise<Blob> => {
		const { data } = await ServerAxios.get<Blob>(downloadUrl, {
			responseType: "blob",
		});

		return data;
	},

	exportOne: async (claimId: string): Promise<Blob> => {
		const { data } = await ServerAxios.get<Blob>(
			`${MEDICAL_CLAIM_URL}/export/${encodeURIComponent(claimId)}`,
			{
				responseType: "blob",
			},
		);

		return data;
	},
};
