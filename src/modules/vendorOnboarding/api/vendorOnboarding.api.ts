import { ServerAxios } from "../../../services/ServerAxios";

import type {
	CreateVendorFormOneVariables,
	CreateVendorFormTwoVariables,
	SubmitVendorSummaryVariables,
	UpdateVendorFormOneVariables,
	UpdateVendorFormTwoVariables,
	VendorCreationFormOneValues,
	VendorOnboardingResponse,
} from "../types/vendorOnboarding.types";

const VENDOR_URL = "/vendor-onboarding";
const PUBLIC_VENDOR_URL = "/vendor-onboarding/public";

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

export type PublicVendorFormSubmissionResponse = {
	message: string;
};

export const vendorOnboardingApi = {
	// GET /vendor-onboarding/:id
	// Renamed from the previous "getVendorOnboardingList" — this fetches a single
	// vendor request by id, it was never a list method despite the old name.
	getVendorOnboardingById: async ({
		vendorRequestId,
	}: UpdateVendorFormTwoVariables): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.get(`${VENDOR_URL}/${vendorRequestId}`);

		return data;
	},

	// GET /vendor-onboarding/:id
	getById: async (
		vendorRequestId: string,
	): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.get(`${VENDOR_URL}/${vendorRequestId}`);

		return data;
	},
	// GET /vendor-onboarding?tab=&search=&pageIndex=&pageSize=
	listVendorOnboardings: async (
		params: VendorListingParams,
	): Promise<VendorListingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.get(VENDOR_URL, { params });

		return data;
	},

	// POST /vendor-onboarding
	createFormOne: async ({
		payload,
	}: CreateVendorFormOneVariables): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.post(VENDOR_URL, payload);

		return data;
	},

	// PATCH /vendor-onboarding/:id
	updateFormOne: async ({
		vendorRequestId,
		payload,
	}: UpdateVendorFormOneVariables): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.patch(`${VENDOR_URL}/${vendorRequestId}`, payload);
		return data;
	},
	// Form Two also uses PATCH /vendor-onboarding/:id
	createFormTwo: async ({
		vendorRequestId,
		payload,
	}: CreateVendorFormTwoVariables): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.patch(`${VENDOR_URL}/${vendorRequestId}`, payload);

		return data;
	},

	// PATCH /vendor-onboarding/:id
	updateFormTwo: async ({
		vendorRequestId,
		payload,
	}: UpdateVendorFormTwoVariables): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.patch(`${VENDOR_URL}/${vendorRequestId}`, payload);

		return data;
	},

	// Final submission starts the workflow. Form One and Form Two are already saved.
	// submitSummary: async ({
	// 	vendorRequestId,
	// }: SubmitVendorSummaryVariables): Promise<VendorOnboardingResponse> => {
	// 	return vendorOnboardingApi.sendForApproval(vendorRequestId);
	// },
	// POST /vendor-onboarding/:id/resend-link
	resendVendorLink: async (
		vendorRequestId: string,
	): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.post(`${VENDOR_URL}/${vendorRequestId}/resend-link`);

		return data;
	},

	// POST /vendor-onboarding/:id/send-for-approval
	sendForApproval: async (
		vendorRequestId: string,
	): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.post(
			`${VENDOR_URL}/${vendorRequestId}/send-for-approval`,
		);

		return data;
	},

	// Existing summary method can call the same approval route
	submitSummary: async ({
		vendorRequestId,
		payload,
	}: SubmitVendorSummaryVariables): Promise<VendorOnboardingResponse> => {
		await ServerAxios.patch(`${VENDOR_URL}/${vendorRequestId}`, payload);

		const {
			data: { data },
		} = await ServerAxios.post(
			`${VENDOR_URL}/${vendorRequestId}/send-for-approval`,
		);

		return data;
	},

	// POST /vendor-onboarding/:id/close
	acceptAndClose: async (
		vendorRequestId: string,
	): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.post(`${VENDOR_URL}/${vendorRequestId}/close`);

		return data;
	},
	// POST /vendor-onboarding/public/:token/submit
	submitVendorForm: async (
		token: string,
		formData: FormData,
	): Promise<PublicVendorFormSubmissionResponse> => {
		const encodedToken = encodeURIComponent(token);

		const {
			data: { message },
		} = await ServerAxios.post<{
			success: boolean;
			message: string;
		}>(`${PUBLIC_VENDOR_URL}/${encodedToken}/submit`, formData);

		return {
			message,
		};
	},
	// GET /vendor-onboarding/public/:token
	getByToken: async (token: string): Promise<PublicVendorSessionResponse> => {
		const encodedToken = encodeURIComponent(token);

		const {
			data: { data },
		} = await ServerAxios.get<{
			success: boolean;
			data: PublicVendorSessionResponse;
		}>(`${PUBLIC_VENDOR_URL}/${encodedToken}`);
		return data;
	},
	// GET /public/vendor-onboarding/:token
	// getByToken: async (token: string): Promise<VendorOnboardingResponse> => {
	// 	const {
	// 		data: { data },
	// 	} = await ServerAxios.get(`${PUBLIC_VENDOR_URL}/${token}`);

	// 	return data;
	// },

	// POST /public/vendor-onboarding/:token/submit
	// submitVendorForm: async (
	// 	token: string,
	// 	formData: FormData,
	// ): Promise<VendorOnboardingResponse> => {
	// 	const {
	// 		data: { data },
	// 	} = await ServerAxios.post(
	// 		`${PUBLIC_VENDOR_URL}/${token}/submit`,
	// 		formData,
	// 	);

	// 	return data;
	// },

	assignWorkflow: async (payload: {
		eventProposalId: string;
		workspaceId: string | null;
		appId: string;
		budget: number;
	}) => {
		const {
			data: { data, message },
		} = await ServerAxios.post("/soa/assign-workflow", payload);

		return { data, message };
	},

	previewWorkflow: async (payload: {
		workspaceId: string | null;
		appId: string;
		budget: number;
	}) => {
		const {
			data: { data },
		} = await ServerAxios.post("/soa/preview-workflow", payload);

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
		} = await ServerAxios.patch(`/vendor-onboarding/${id}`, payload);

		return data;
	},
};
