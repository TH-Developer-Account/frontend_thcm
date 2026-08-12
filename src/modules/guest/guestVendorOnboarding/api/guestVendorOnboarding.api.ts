import { GuestAxios } from "../../../../services/GuestAxios";
import { ServerAxios } from "../../../../services/ServerAxios";

import type { VendorOnboardingListingRow } from "../../../vendorOnboarding/types/vendorListing.types";
import type {
	VendorCreationFormOneValues,
	VendorOnboardingDocument,
	VendorOnboardingRawResponse,
} from "../../../vendorOnboarding/types/vendorOnboarding.types";

export type PublicVendorSessionResponse = VendorCreationFormOneValues & {
	id?: string;
	partOne?: VendorCreationFormOneValues;
	documents?: VendorOnboardingDocument[];
	referenceNumber?: string;
	vendorName?: string;
	email?: string;
	mobile?: string;
	correctionReason?: string | null;
};

type PublicVendorSessionApiResponse = {
	success: boolean;
	data: PublicVendorSessionResponse;
};

type GuestVendorListingApiResponse = {
	success: boolean;
	onboardings: VendorOnboardingListingRow[];
};

type GuestVendorDetailApiResponse = {
	success: boolean;
	onboarding: VendorOnboardingRawResponse;
};

export type VendorFormSubmitResponse = {
	success: boolean;
	message: string;
};

const publicRoute = (token: string) =>
	`/vendor-onboarding/public/${encodeURIComponent(token)}`;

const guestRoute = (onboardingId?: string) =>
	onboardingId
		? `/vendor-onboarding/guest/${encodeURIComponent(onboardingId)}`
		: "/vendor-onboarding/guest";

export const guestVendorOnboardingApi = {
	getPublicSession: async (
		token: string,
	): Promise<PublicVendorSessionResponse> => {
		const response = await ServerAxios.get<PublicVendorSessionApiResponse>(
			publicRoute(token),
		);

		return response.data.data;
	},

	submitInitialForm: async ({
		token,
		formData,
	}: {
		token: string;
		formData: FormData;
	}): Promise<VendorFormSubmitResponse> => {
		const response = await ServerAxios.post<VendorFormSubmitResponse>(
			`${publicRoute(token)}/submit`,
			formData,
		);

		return response.data;
	},

	saveInitialDraft: async ({
		token,
		formData,
	}: {
		token: string;
		formData: FormData;
	}): Promise<VendorFormSubmitResponse> => {
		const response = await ServerAxios.patch<VendorFormSubmitResponse>(
			`${publicRoute(token)}/draft`,
			formData,
		);

		return response.data;
	},

	getAll: async (): Promise<VendorOnboardingListingRow[]> => {
		const response =
			await GuestAxios.get<GuestVendorListingApiResponse>(guestRoute());

		return response.data.onboardings ?? [];
	},

	getById: async (
		onboardingId: string,
	): Promise<VendorOnboardingRawResponse> => {
		const response = await GuestAxios.get<GuestVendorDetailApiResponse>(
			guestRoute(onboardingId),
		);

		return response.data.onboarding;
	},

	updateFormOneTest: async ({
		onboardingId,
		formData,
	}: {
		onboardingId: string;
		formData: FormData;
	}): Promise<VendorFormSubmitResponse> => {
		const response = await GuestAxios.put<VendorFormSubmitResponse>(
			guestRoute(onboardingId),
			formData,
		);

		return response.data;
	},
	updateFormOne: async ({
		onboardingId,
		formData,
	}: {
		onboardingId: string;
		formData: FormData;
	}): Promise<VendorFormSubmitResponse> => {
		const response = await GuestAxios.patch<VendorFormSubmitResponse>(
			`/vendor-onboarding/${onboardingId}`,
			formData,
		);

		return response.data;
	},

	updateDraft: async ({
		token,
		formData,
	}: {
		token: string;
		formData: FormData;
	}): Promise<VendorFormSubmitResponse> => {
		const response = await ServerAxios.patch<VendorFormSubmitResponse>(
			`${publicRoute(token)}/draft`,
			formData,
		);

		return response.data;
	},
};
