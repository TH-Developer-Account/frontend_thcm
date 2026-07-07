// import { ServerAxios } from "../../../services/ServerAxios";

import type {
	ClarifyVendorVariables,
	CommentVendorVariables,
	CreateVendorFormOneVariables,
	CreateVendorFormTwoVariables,
	DeleteVendorVariables,
	SubmitVendorSummaryVariables,
	UpdateVendorFormOneVariables,
	UpdateVendorFormTwoVariables,
	VendorOnboardingResponse,
} from "../types/vendorOnboarding.types";

const mockDelay = async () => {
	await new Promise((resolve) => window.setTimeout(resolve, 300));
};

export const vendorOnboardingApi = {
	getById: async (
		vendorRequestId: string,
	): Promise<VendorOnboardingResponse> => {
		console.log("GET vendor onboarding by id:", vendorRequestId);

		await mockDelay();

		// API-ready version:
		// const {
		// 	data: { data },
		// } = await ServerAxios.get(`/vendor-onboarding/${vendorRequestId}`);
		// return data;

		return {
			id: vendorRequestId,
			status: "SUBMITTED_BY_VENDOR",
			partOne: {
				vendorCode: "VND-1024",
				vendorType: "PO Based",
				companyCode: "0080 - BLR",
				purchaseOrg: "P502 - Indirect Purchase",
				vendorName: "ABC INDUSTRIAL SUPPLIERS",
				completeAddress: "Plot 42, Industrial Area, Bengaluru",
				msmeVendor: "Yes",
				msmeCertificateAttached: "Yes",
				city: "Bengaluru",
				pinCode: "560001",
				region: "South 1",
			},
			partTwo: {},
		};
	},

	createFormOne: async ({
		payload,
	}: CreateVendorFormOneVariables): Promise<VendorOnboardingResponse> => {
		console.log("CREATE vendor form one:", payload);

		await mockDelay();

		// API-ready version:
		// const {
		// 	data: { data },
		// } = await ServerAxios.post("/vendor-onboarding/form-one", payload);
		// return data;

		return {
			id: crypto.randomUUID(),
			status: "SUBMITTED_BY_VENDOR",
			partOne: payload,
			partTwo: {},
		};
	},

	updateFormOne: async ({
		vendorRequestId,
		payload,
	}: UpdateVendorFormOneVariables): Promise<VendorOnboardingResponse> => {
		console.log("UPDATE vendor form one:", {
			vendorRequestId,
			payload,
		});

		await mockDelay();

		// API-ready version:
		// const {
		// 	data: { data },
		// } = await ServerAxios.put(
		// 	`/vendor-onboarding/${vendorRequestId}/form-one`,
		// 	payload,
		// );
		// return data;

		return {
			id: vendorRequestId,
			status: "SUBMITTED_BY_VENDOR",
			partOne: payload,
			partTwo: {},
		};
	},

	createFormTwo: async ({
		vendorRequestId,
		payload,
	}: CreateVendorFormTwoVariables): Promise<VendorOnboardingResponse> => {
		console.log("CREATE vendor form two:", {
			vendorRequestId,
			payload,
		});

		await mockDelay();

		// API-ready version:
		// const {
		// 	data: { data },
		// } = await ServerAxios.post(
		// 	`/vendor-onboarding/${vendorRequestId}/form-two`,
		// 	payload,
		// );
		// return data;

		return {
			id: vendorRequestId,
			status: "THCM_REVIEW_IN_PROGRESS",
			partOne: {},
			partTwo: payload,
		};
	},

	updateFormTwo: async ({
		vendorRequestId,
		payload,
	}: UpdateVendorFormTwoVariables): Promise<VendorOnboardingResponse> => {
		console.log("UPDATE vendor form two:", {
			vendorRequestId,
			payload,
		});

		await mockDelay();

		// API-ready version:
		// const {
		// 	data: { data },
		// } = await ServerAxios.put(
		// 	`/vendor-onboarding/${vendorRequestId}/form-two`,
		// 	payload,
		// );
		// return data;

		return {
			id: vendorRequestId,
			status: "THCM_REVIEW_IN_PROGRESS",
			partOne: {},
			partTwo: payload,
		};
	},

	submitSummary: async ({
		vendorRequestId,
		payload,
	}: SubmitVendorSummaryVariables): Promise<VendorOnboardingResponse> => {
		console.log("SUBMIT vendor summary:", {
			vendorRequestId,
			payload,
		});

		await mockDelay();

		// API-ready version:
		// const {
		// 	data: { data },
		// } = await ServerAxios.post(
		// 	`/vendor-onboarding/${vendorRequestId}/submit`,
		// 	payload,
		// );
		// return data;

		return {
			id: vendorRequestId,
			status: "THCM_SUBMITTED",
			partOne: payload.partOne,
			partTwo: payload.partTwo,
		};
	},

	approve: async (
		vendorRequestId: string,
	): Promise<VendorOnboardingResponse> => {
		console.log("APPROVE vendor onboarding:", vendorRequestId);

		await mockDelay();

		// API-ready version:
		// const {
		// 	data: { data },
		// } = await ServerAxios.post(`/vendor-onboarding/${vendorRequestId}/approve`);
		// return data;

		return {
			id: vendorRequestId,
			status: "THCM_APPROVED",
			partOne: {},
			partTwo: {},
		};
	},

	clarify: async ({
		vendorRequestId,
		payload,
	}: ClarifyVendorVariables): Promise<VendorOnboardingResponse> => {
		console.log("CLARIFY vendor onboarding:", {
			vendorRequestId,
			payload,
		});

		await mockDelay();

		// API-ready version:
		// const {
		// 	data: { data },
		// } = await ServerAxios.post(
		// 	`/vendor-onboarding/${vendorRequestId}/clarify`,
		// 	payload,
		// );
		// return data;

		return {
			id: vendorRequestId,
			status: "THCM_CLARIFICATION_REQUESTED",
			partOne: {},
			partTwo: {},
		};
	},

	acceptAndClose: async (
		vendorRequestId: string,
	): Promise<VendorOnboardingResponse> => {
		console.log("ACCEPT AND CLOSE vendor onboarding:", vendorRequestId);

		await mockDelay();

		// API-ready version:
		// const {
		// 	data: { data },
		// } = await ServerAxios.post(
		// 	`/vendor-onboarding/${vendorRequestId}/accept-close`,
		// );
		// return data;

		return {
			id: vendorRequestId,
			status: "CLOSED",
			partOne: {},
			partTwo: {},
		};
	},

	addComment: async ({
		vendorRequestId,
		payload,
	}: CommentVendorVariables): Promise<{ success: boolean }> => {
		console.log("ADD vendor onboarding comment:", {
			vendorRequestId,
			payload,
		});

		await mockDelay();

		// API-ready version:
		// const {
		// 	data: { data },
		// } = await ServerAxios.post(
		// 	`/vendor-onboarding/${vendorRequestId}/comments`,
		// 	payload,
		// );
		// return data;

		return {
			success: true,
		};
	},

	delete: async ({
		vendorRequestId,
	}: DeleteVendorVariables): Promise<{ success: boolean }> => {
		console.log("DELETE vendor onboarding:", vendorRequestId);

		await mockDelay();

		// API-ready version:
		// const {
		// 	data: { data },
		// } = await ServerAxios.delete(`/vendor-onboarding/${vendorRequestId}`);
		// return data;

		return {
			success: true,
		};
	},
};
