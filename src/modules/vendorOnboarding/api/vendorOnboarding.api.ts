import { ServerAxios } from "../../../services/ServerAxios";

import { normalizeVendorOnboardingResponse } from "../helpers/vendor.onboarding.mapper";
import type { VendorOnboardingInitiationPayload } from "../types/vendorListing.types";
import type {
	UpdateVendorVariables,
	VendorCreationFormOneValues,
	VendorOnboardingDocument,
	VendorOnboardingRawResponse,
	VendorOnboardingResponse,
} from "../types/vendorOnboarding.types";

const VENDOR_URL = "/vendor-onboarding";
const PUBLIC_VENDOR_URL = `${VENDOR_URL}/public`;

export type VendorListingTab =
	| "onboarding"
	| "initiation"
	| "pendingOnMe"
	| "approvedByMe"
	| "createdByMe";

export type VendorListingParams = {
	tab: VendorListingTab;
	search?: string;
	pageIndex: number;
	pageSize: number;
};

export type VendorListingRow = {
	id: string;
	vendorName: string | null;
	mobile: string | null;
	email: string | null;
	vendorCode: string | null;
	vendorType: string | null;
	companyCode: string | null;
	status: string;
	created_at: string;
	updated_at: string;
	initiatedBy: {
		first_name: string;
		last_name: string;
	};
	referenceNumber?: string;
};

export type VendorListingResponse = {
	rows: VendorListingRow[];
	totalCount: number;
	pageIndex: number;
	pageSize: number;
};

export type PublicVendorSessionResponse = {
	id: string;
	vendorName: string;
	referenceName?: string;
	email?: string;
	mobile?: string;
	partOne?: VendorCreationFormOneValues;
	documents?: VendorOnboardingDocument[];
};
export type VendorPdfType = "VENDOR_ONBOARDING";

type VendorPdfUrlResponse = {
	success: boolean;
	url: string;
};
/**
 * Vendor-only endpoints live here. Workflow preview, assignment, approval,
 * clarification, activation, instance and history calls are intentionally
 * owned by modules/workflows/api/workflow.api.ts.
 */
export const vendorOnboardingApi = {
	getById: async (
		vendorRequestId: string,
	): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.get<{
			success: boolean;
			data: VendorOnboardingRawResponse;
		}>(`${VENDOR_URL}/${vendorRequestId}`);

		return normalizeVendorOnboardingResponse(data);
	},

	listVendorOnboardings: async (
		params: VendorListingParams,
	): Promise<VendorListingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.get(VENDOR_URL, { params });
		return data;
	},

	create: async (
		payload: VendorCreationFormOneValues,
	): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.post(VENDOR_URL, payload);
		return data;
	},

	update: async ({
		vendorRequestId,
		payload,
	}: UpdateVendorVariables): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.patch(`${VENDOR_URL}/${vendorRequestId}`, payload);
		return data;
	},

	submit: async (
		vendorRequestId: string,
	): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.post(
			`${VENDOR_URL}/${vendorRequestId}/send-for-approval`,
		);
		return data;
	},

	acceptAndClose: async (
		vendorRequestId: string,
	): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.post(`${VENDOR_URL}/${vendorRequestId}/close`);
		return data;
	},

	getByToken: async (token: string): Promise<PublicVendorSessionResponse> => {
		const {
			data: { data },
		} = await ServerAxios.get(
			`${PUBLIC_VENDOR_URL}/${encodeURIComponent(token)}`,
		);
		return data;
	},

	submitPublic: async (token: string, formData: FormData): Promise<string> => {
		const {
			data: { message },
		} = await ServerAxios.post(
			`${PUBLIC_VENDOR_URL}/${encodeURIComponent(token)}/submit`,
			formData,
		);
		return message;
	},

	draftSubmitPublic: async (
		token: string,
		formData: FormData,
	): Promise<string> => {
		const {
			data: { message },
		} = await ServerAxios.patch(
			`${PUBLIC_VENDOR_URL}/${encodeURIComponent(token)}/draft`,
			formData,
		);
		return message;
	},

	resendVendorLink: async (vendorRequestId: string) => {
		const {
			data: { data },
		} = await ServerAxios.post(`${VENDOR_URL}/${vendorRequestId}/resend-link`);
		return data;
	},

	sendBackToVendor: async (vendorRequestId: string) => {
		const {
			data: { data },
		} = await ServerAxios.post(
			`${VENDOR_URL}/${vendorRequestId}/send-back-to-vendor`,
		);
		return data;
	},
	getPublicPdf: async (pdfToken: string): Promise<Blob> => {
		const response = await ServerAxios.get<Blob>(
			`${PUBLIC_VENDOR_URL}/pdf/${encodeURIComponent(pdfToken)}`,
			{
				responseType: "blob",
			},
		);

		return response.data;
	},

	getPdfUrl: async (
		type: VendorPdfType,
		vendorRequestId: string,
	): Promise<string> => {
		const {
			data: { url },
		} = await ServerAxios.get<VendorPdfUrlResponse>(
			`/pdf/${type}/${encodeURIComponent(vendorRequestId)}/url`,
		);

		return url;
	},
	enqueueBulkExport: async (
		params: Pick<VendorListingParams, "tab" | "search"> & {
			format?: "csv" | "xlsx";
		},
	): Promise<{ jobId: string; logId: string }> => {
		const { data } = await ServerAxios.post<{
			success: boolean;
			jobId: string;
			logId: string;
		}>(`${VENDOR_URL}/export/bulk`, params);
		return { jobId: data.jobId, logId: data.logId };
	},
};

export const vendorInitationApi = {
	getById: async (
		vendorRequestId: string,
	): Promise<VendorOnboardingInitiationPayload> => {
		const {
			data: { data },
		} = await ServerAxios.get<{
			success: boolean;
			data: VendorOnboardingInitiationPayload;
		}>(`${VENDOR_URL}/${vendorRequestId}`);
		return data;
	},

	createInitiation: async (payload: VendorOnboardingInitiationPayload) => {
		const {
			data: { data },
		} = await ServerAxios.post(VENDOR_URL, payload);
		return data;
	},

	updateInitiation: async ({
		id,
		payload,
	}: {
		id: string;
		payload: VendorOnboardingInitiationPayload;
	}) => {
		const {
			data: { data },
		} = await ServerAxios.patch(`${VENDOR_URL}/${id}`, payload);
		return data;
	},
};
