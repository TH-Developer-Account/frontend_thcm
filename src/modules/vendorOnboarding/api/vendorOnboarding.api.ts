import { ServerAxios } from "../../../services/ServerAxios";

import type {
	UpdateVendorVariables,
	VendorCreationFormOneValues,
	VendorOnboardingRawResponse,
	VendorOnboardingResponse,
} from "../types/vendorOnboarding.types";
import { normalizeVendorOnboardingResponse } from "../utils/vendor.onboarding.helper";

const VENDOR_URL = "/vendor-onboarding";
const PUBLIC_VENDOR_URL = `${VENDOR_URL}/public`;

export type VendorOnboardingInitiationPayload = {
	vendorName: string;
	email: string;
	mobile: string;
};

export type VendorListingTab = "initiation" | "onboarding";

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
	email?: string;
	mobile?: string;
	partOne?: VendorCreationFormOneValues;
};

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

	resendVendorLink: async (vendorRequestId: string) => {
		const {
			data: { data },
		} = await ServerAxios.post(`${VENDOR_URL}/${vendorRequestId}/resend-link`);
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
	assignWorkflow: async (payload: {
		subjectType: string;
		subjectId: string;
		workspaceId: string;
		appId: string;
		criteria: Record<string, unknown>;
	}) => {
		const {
			data: { data, message },
		} = await ServerAxios.post("/soa/assign-workflow", payload);

		return { data, message };
	},

	previewWorkflow: async (payload: {
		subjectType: string;
		workspaceId: string;
		appId: string;
		criteria: Record<string, unknown>;
	}) => {
		const {
			data: { data },
		} = await ServerAxios.post("/soa/preview-workflow", payload);

		return data;
	},
};
