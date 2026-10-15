import { GuestAxios } from "../../../services/GuestAxios";
import { PublicAxios } from "../../../services/PublicAxios";
import { MEDICLAIM_BACKEND } from "../../medicalReimbursment/utils/mediclaimBackend.config";

import type {
	GradeEligibilityRow,
	MedicalClaimDetail,
} from "../../medicalReimbursment/types/medicalClaimListing.types";

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
	message?: string;
	data: T;
};

type ApiListResponse<T> = ApiDataResponse<T[]> & {
	total?: number;
	page_index?: number;
	page_size?: number;
};

export type RawGuestMedicalClaimRow = {
	id: string;
	referenceNumber: string;
	employeeName: string;
	ticketNumber?: string | null;
	status: string;
	claimCover?: "SELF" | "SPOUSE" | "BOTH" | null;
	totalClaimed?: number | string | null;
	totalApprovedAmount?: number | string | null;
	approvedBillCount?: number | null;
	billCount?: number | null;
	isApproved?: boolean | null;
	remarks?: string | null;
	created_at: string;
	updated_at?: string | null;
};

const toNumber = (value: unknown): number => {
	const parsed = Number(value ?? 0);
	return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Maps the guest list. The current backend returns every claim (no `total`,
 * no search) — then search + pagination happen here.
 */
export const mapGuestListResponse = (
	body: ApiListResponse<RawGuestMedicalClaimRow> | undefined,
	params: ReimbursementClaimListParams,
): ReimbursementClaimListResponse => {
	const rawRows = Array.isArray(body?.data) ? body!.data : [];

	const items: ReimbursementClaimListItem[] = rawRows.map((row) => {
		const status = String(row.status ?? "").trim().toUpperCase();
		const billCount = row.billCount ?? 0;
		return {
			id: row.id,
			claimNumber: row.referenceNumber,
			status,
			totalClaimAmount: toNumber(row.totalClaimed),
			createdAt: row.created_at,
			updatedAt: row.updated_at ?? row.created_at,
			employeeName: row.employeeName,
			ticketNumber: row.ticketNumber ?? "",
			claimFor: (row.claimCover ?? "SELF") as ClaimFor,
			totalApprovedAmount: toNumber(row.totalApprovedAmount),
			approvedBillsLabel: billCount ? `${row.approvedBillCount ?? 0} / ${billCount}` : "—",
			isApproved: row.isApproved ?? (status === "APPROVED" || status === "CLOSED"),
			remarks: row.remarks?.trim() || "",
		};
	});

	// Server-side pagination: the API sends `total`. An older API returns
	// every claim with no `total` — then search + paginate here instead.
	if (typeof body?.total !== "number") {
		const search = params.search?.trim().toLowerCase();
		const filtered = search
			? items.filter((item) =>
					[item.claimNumber, item.employeeName, item.ticketNumber].some((value) =>
						value?.toLowerCase().includes(search),
					),
				)
			: items;
		const size = Math.max(params.pageSize, 1);
		const start = params.pageIndex * size;
		return {
			items: filtered.slice(start, start + size),
			pageIndex: params.pageIndex,
			pageSize: params.pageSize,
			total: filtered.length,
			totalPages: Math.max(1, Math.ceil(filtered.length / size)),
		};
	}

	const pageSize = body.page_size ?? params.pageSize;
	const total = body.total;

	return {
		items,
		pageIndex: body.page_index ?? params.pageIndex,
		pageSize,
		total,
		totalPages: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
	};
};

/** Defaults for a new guest claim (identity + this FY's settled amount). */
export type GuestClaimProfile = {
	canCreate: boolean;
	employeeName?: string | null;
	ticketNumber?: string | null;
	grade?: string | null;
	location?: string | null;
	claimCover?: "SELF" | "SPOUSE" | "BOTH" | null;
	spouseName?: string | null;
	mobile?: string | null;
	email?: string | null;
	alreadySettled?: number | null;
	eligibleAmount?: number | null;
};

export const guestReimburseClaimApi = {
	getProfile: async (): Promise<GuestClaimProfile> => {
		if (!MEDICLAIM_BACKEND.guestCreateClaim) return { canCreate: false };
		const response = await GuestAxios.get<ApiDataResponse<GuestClaimProfile>>(
			`${GUEST_URL}/profile`,
		);
		return response.data?.data ?? { canCreate: false };
	},

	guestList: async (
		params: ReimbursementClaimListParams,
	): Promise<ReimbursementClaimListResponse> => {
		const response = await GuestAxios.get<ApiListResponse<RawGuestMedicalClaimRow>>(
			GUEST_URL,
			{
				params: {
					search: params.search?.trim() || undefined,
					page_index: params.pageIndex,
					page_size: params.pageSize,
				},
			},
		);
		return mapGuestListResponse(response.data, params);
	},

	guestGetById: async (claimId: string): Promise<MedicalClaimDetail> => {
		const response = await GuestAxios.get<ApiDataResponse<MedicalClaimDetail>>(
			`${GUEST_URL}/${encodeURIComponent(claimId)}`,
		);
		return response.data.data;
	},

	listGrades: async (): Promise<GradeEligibilityRow[]> => {
		if (!MEDICLAIM_BACKEND.gradesEndpoint) return [];
		const response = await GuestAxios.get<ApiDataResponse<GradeEligibilityRow[]>>(
			`${GUEST_URL}/grades`,
		);
		return Array.isArray(response.data?.data) ? response.data.data : [];
	},

	/** A logged-in retiree starts a new claim (POST /guest/submit). */
	createGuest: async (formData: FormData): Promise<MedicalClaimDetail> => {
		if (!MEDICLAIM_BACKEND.guestCreateClaim) {
			throw new Error("New claims are started by HR. Please contact HR to raise a new claim.");
		}
		const response = await GuestAxios.post<ApiDataResponse<MedicalClaimDetail>>(
			`${GUEST_URL}/submit`,
			formData,
		);
		return response.data.data;
	},

	resubmitGuest: async (
		claimId: string,
		formData: FormData,
	): Promise<MedicalClaimDetail | undefined> => {
		const response = await GuestAxios.patch<ApiDataResponse<MedicalClaimDetail>>(
			`${GUEST_URL}/${encodeURIComponent(claimId)}/resubmit`,
			formData,
		);
		return response.data?.data;
	},
};

/**
 * Public claim endpoints use the emailed link token and do not require a
 * guest-authenticated Axios client.
 */
export const publicReimburseClaimApi = {
	getByToken: async (token: string): Promise<MedicalClaimDetail> => {
		const response = await PublicAxios.get<ApiDataResponse<MedicalClaimDetail>>(
			`${PUBLIC_URL}/${encodeURIComponent(token)}`,
		);
		return response.data.data;
	},

	listGrades: async (token: string): Promise<GradeEligibilityRow[]> => {
		if (!MEDICLAIM_BACKEND.gradesEndpoint) return [];
		const response = await PublicAxios.get<ApiDataResponse<GradeEligibilityRow[]>>(
			`${PUBLIC_URL}/${encodeURIComponent(token)}/grades`,
		);
		return Array.isArray(response.data?.data) ? response.data.data : [];
	},

	submit: async (token: string, formData: FormData): Promise<string> => {
		const response = await PublicAxios.post<ApiDataResponse<unknown>>(
			`${PUBLIC_URL}/${encodeURIComponent(token)}/submit`,
			formData,
		);
		return response.data.message ?? "Claim submitted successfully";
	},

	/** Returns the saved claim (with server bill ids) so the form can re-sync. */
	saveDraft: async (
		token: string,
		formData: FormData,
	): Promise<MedicalClaimDetail | undefined> => {
		const response = await PublicAxios.patch<ApiDataResponse<MedicalClaimDetail>>(
			`${PUBLIC_URL}/${encodeURIComponent(token)}/draft`,
			formData,
		);
		return response.data?.data;
	},
};
