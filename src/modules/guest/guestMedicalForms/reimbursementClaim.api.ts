import { GuestAxios } from "../../../services/GuestAxios";
import { ServerAxios } from "../../../services/ServerAxios";

import type { MedicalClaimDetail } from "../../medicalReimbursment/types/medicalClaimListing.types";

import type {
	ClaimFor,
	ReimbursementClaimListItem,
	ReimbursementClaimListParams,
	ReimbursementClaimListResponse,
} from "./reimbursementClaim.types";

const CLAIM_URL = "/medi-claim";
const GUEST_URL = `${CLAIM_URL}/guest`;
const PUBLIC_URL = `${CLAIM_URL}/public`;

type ApiDataResponse<T> = {
	success: boolean;
	data: T;
};

type ApiMessageResponse = {
	success: boolean;
	message: string;
};

type RawGuestMedicalClaimRow = {
	id: string;
	referenceNumber: string;
	employeeName: string;
	ticketNumber?: string | null;
	status: string;
	claimCover?: "SELF" | "SPOUSE" | "BOTH" | null;
	totalClaimed?: number | string | null;
	created_at: string;
	updated_at?: string | null;
};

const mapGuestListResponse = (
	rawRows: RawGuestMedicalClaimRow[],
	params: ReimbursementClaimListParams,
): ReimbursementClaimListResponse => {
	const items: ReimbursementClaimListItem[] = rawRows.map((row) => ({
		id: row.id,
		claimNumber: row.referenceNumber,
		status: row.status as ReimbursementClaimListItem["status"],
		totalClaimAmount: Number(row.totalClaimed ?? 0),
		createdBy: null,
		createdAt: row.created_at,
		updatedAt: row.updated_at ?? row.created_at,
		employeeName: row.employeeName,
		ticketNumber: row.ticketNumber ?? "",
		claimFor: (row.claimCover ?? "SELF") as ClaimFor,
	}));

	const total = items.length;
	const pageSize = params.pageSize || total || 1;
	const start = params.pageIndex * pageSize;
	const pageItems = items.slice(start, start + pageSize);

	return {
		items: pageItems,
		pageIndex: params.pageIndex,
		pageSize: params.pageSize,
		total,
		totalPages: Math.max(1, Math.ceil(total / pageSize)),
	};
};

export const guestReimburseClaimApi = {
	guestList: async (
		params: ReimbursementClaimListParams,
	): Promise<ReimbursementClaimListResponse> => {
		const response = await GuestAxios.get<
			ApiDataResponse<RawGuestMedicalClaimRow[]>
		>(GUEST_URL, {
			params: {
				tab: params.tab,
				search: params.search,
				page_index: params.pageIndex,
				page_size: params.pageSize,
			},
		});

		const rawRows = Array.isArray(response.data?.data)
			? response.data.data
			: [];

		return mapGuestListResponse(rawRows, params);
	},

	guestGetById: async (claimId: string): Promise<MedicalClaimDetail> => {
		const response = await GuestAxios.get<ApiDataResponse<MedicalClaimDetail>>(
			`${GUEST_URL}/${encodeURIComponent(claimId)}`,
		);

		return response.data.data;
	},

	createGuest: async (formData: FormData): Promise<MedicalClaimDetail> => {
		const response = await GuestAxios.post<ApiDataResponse<MedicalClaimDetail>>(
			GUEST_URL,
			formData,
		);

		return response.data.data;
	},

	resubmitGuest: async (
		claimId: string,
		formData: FormData,
	): Promise<MedicalClaimDetail> => {
		const response = await GuestAxios.patch<
			ApiDataResponse<MedicalClaimDetail>
		>(`${GUEST_URL}/${encodeURIComponent(claimId)}/resubmit`, formData);

		return response.data.data;
	},
};

/**
 * Public claim endpoints use a link/session token and do not require a
 * guest-authenticated Axios client.
 */
export const publicReimburseClaimApi = {
	getByToken: async (token: string): Promise<MedicalClaimDetail> => {
		const response = await ServerAxios.get<ApiDataResponse<MedicalClaimDetail>>(
			`${PUBLIC_URL}/${encodeURIComponent(token)}`,
		);

		return response.data.data;
	},

	submit: async (token: string, formData: FormData): Promise<string> => {
		const response = await ServerAxios.post<ApiMessageResponse>(
			`${PUBLIC_URL}/${encodeURIComponent(token)}/submit`,
			formData,
		);

		return response.data.message;
	},

	saveDraft: async (token: string, formData: FormData): Promise<string> => {
		const response = await ServerAxios.patch<ApiMessageResponse>(
			`${PUBLIC_URL}/${encodeURIComponent(token)}/draft`,
			formData,
		);

		return response.data.message;
	},

	getPdf: async (pdfToken: string): Promise<Blob> => {
		const response = await ServerAxios.get<Blob>(
			`${PUBLIC_URL}/pdf/${encodeURIComponent(pdfToken)}`,
			{
				responseType: "blob",
			},
		);

		return response.data;
	},
};
