import { GuestAxios } from "../../../services/GuestAxios";
import { ServerAxios } from "../../../services/ServerAxios";
import type { MedicalClaimDetail } from "../../medicalReimbursment/types/medicalClaimListing.types";

import type {
	ClaimFor,
	PublicClaimSessionResponse,
	ReimbursementClaimListItem,
	ReimbursementClaimListParams,
	ReimbursementClaimListResponse,
	ReimbursementClaimResponse,
	UpdateReimbursementClaimVariables,
} from "./reimbursementClaim.types";

const CLAIM_URL = "/medi-claim";
const GUEST_URL = `${CLAIM_URL}/guest`;
const PUBLIC_CLAIM_URL = `${CLAIM_URL}/public`;

const unwrap = <T>(response: { data: T | { data: T } }): T => {
	const body = response.data;
	return typeof body === "object" && body !== null && "data" in body
		? (body as { data: T }).data
		: (body as T);
};

export const reimbursementClaimApi = {
	list: async (
		params: ReimbursementClaimListParams,
	): Promise<ReimbursementClaimListResponse> => {
		const response = await ServerAxios.get(CLAIM_URL, { params });
		return unwrap(response);
	},

	getById: async (claimId: string): Promise<ReimbursementClaimResponse> => {
		const response = await ServerAxios.get(`${CLAIM_URL}/${claimId}`);
		return unwrap(response);
	},

	createDraft: async (
		formData: FormData,
	): Promise<ReimbursementClaimResponse> => {
		const response = await ServerAxios.post(CLAIM_URL, formData);
		return unwrap(response);
	},

	update: async ({
		claimId,
		formData,
	}: UpdateReimbursementClaimVariables): Promise<ReimbursementClaimResponse> => {
		const response = await ServerAxios.patch(
			`${CLAIM_URL}/${claimId}`,
			formData,
		);

		return unwrap(response);
	},

	submit: async (claimId: string): Promise<ReimbursementClaimResponse> => {
		const response = await ServerAxios.post(`${CLAIM_URL}/${claimId}/submit`);

		return unwrap(response);
	},

	getPublicSession: async (
		sessionCode: string,
	): Promise<PublicClaimSessionResponse> => {
		const response = await ServerAxios.get(
			`${PUBLIC_CLAIM_URL}/session/${sessionCode}`,
		);

		return unwrap(response);
	},

	savePublicDraft: async ({
		sessionCode,
		formData,
	}: {
		sessionCode: string;
		formData: FormData;
	}): Promise<ReimbursementClaimResponse> => {
		const response = await ServerAxios.post(
			`${PUBLIC_CLAIM_URL}/session/${sessionCode}/draft`,
			formData,
		);

		return unwrap(response);
	},

	submitPublic: async ({
		sessionCode,
		formData,
	}: {
		sessionCode: string;
		formData: FormData;
	}): Promise<ReimbursementClaimResponse> => {
		const response = await ServerAxios.post(
			`${PUBLIC_CLAIM_URL}/session/${sessionCode}/submit`,
			formData,
		);

		return unwrap(response);
	},
};

// ─────────────────────────────────────────────────────────────────────────
// Raw shape of a single row as actually returned by GET /medi-claim/guest.
// ─────────────────────────────────────────────────────────────────────────
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

// GET /medi-claim/guest responds with a flat, unpaginated array — unlike the
// internal listing endpoint, there is no total/page_index/page_size in the
// response body. This maps each raw row into the ReimbursementClaimListItem
// shape the listing table binds to, and paginates client-side using the
// params that were requested, since the backend doesn't paginate this
// endpoint at all.
const mapGuestListResponse = (
	rawRows: RawGuestMedicalClaimRow[],
	params: ReimbursementClaimListParams,
): ReimbursementClaimListResponse => {
	const items: ReimbursementClaimListItem[] = rawRows.map((row) => ({
		id: row.id,
		claimNumber: row.referenceNumber,
		status: row.status as unknown as ReimbursementClaimListItem["status"],
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
type ApiDataResponse<T> = {
	success: boolean;
	data: T;
};
export const guestReimburseClaimApi = {
	guestList: async (
		params: ReimbursementClaimListParams,
	): Promise<ReimbursementClaimListResponse> => {
		const response = await GuestAxios.get<{
			success: boolean;
			data: RawGuestMedicalClaimRow[];
		}>(GUEST_URL, {
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
		const response = await GuestAxios.get(`${GUEST_URL}/${claimId}`);

		return unwrap(response);
	},

	guestResubmit: async ({
		claimId,
		formData,
	}: {
		claimId: string;
		formData: FormData;
	}): Promise<ReimbursementClaimResponse> => {
		const response = await GuestAxios.patch(
			`${GUEST_URL}/${claimId}/resubmit`,
			formData,
		);

		return unwrap(response);
	},

	resubmitGuest: async (
		claimId: string,
		formData: FormData,
	): Promise<MedicalClaimDetail> => {
		const {
			data: { data },
		} = await GuestAxios.patch<ApiDataResponse<MedicalClaimDetail>>(
			`${GUEST_URL}/${encodeURIComponent(claimId)}/resubmit`,
			formData,
		);

		return data;
	},
};
