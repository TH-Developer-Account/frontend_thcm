import { ServerAxios } from "../../../services/ServerAxios";

import type {
	CreateVendorFormOneVariables,
	CreateVendorFormTwoVariables,
	SubmitVendorSummaryVariables,
	UpdateVendorFormOneVariables,
	UpdateVendorFormTwoVariables,
	VendorOnboardingResponse,
} from "../types/vendorOnboarding.types";

const VENDOR_URL = "/vendor-onboarding";
const PUBLIC_VENDOR_URL = "/public/vendor-onboarding";

export type VendorOnboardingInitiationPayload = {
	vendorName: string;
	email: string;
	mobile: string;
};

export const vendorOnboardingApi = {
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

	// GET /public/vendor-onboarding/:token
	getByToken: async (token: string): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.get(`${PUBLIC_VENDOR_URL}/${token}`);

		return data;
	},

	// POST /public/vendor-onboarding/:token/submit
	submitVendorForm: async (
		token: string,
		formData: FormData,
	): Promise<VendorOnboardingResponse> => {
		const {
			data: { data },
		} = await ServerAxios.post(
			`${PUBLIC_VENDOR_URL}/${token}/submit`,
			formData,
		);

		return data;
	},

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
		} = await ServerAxios.post("/vendor-onboarding", payload);

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
