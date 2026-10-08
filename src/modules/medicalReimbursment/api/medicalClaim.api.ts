import { ServerAxios } from "../../../services/ServerAxios";

import type {
	GradeEligibilityRow,
	MedicalClaimDetail,
	MedicalClaimInitiationPayload,
	MedicalClaimListingApiResponse,
	MedicalClaimListingParams,
	MedicalClaimListingResult,
	MedicalClaimListItem,
	MedicalClaimMutationResponse,
	ReviewedBill,
} from "../types/medicalClaimListing.types";
import { createExportApi, createImportApi } from "../../../common/common.api";
import type { MedicalClaimImportError } from "../types/medicalClaimInitiation.types";
import {
	MEDICLAIM_BACKEND,
	MEDICLAIM_MAX_PAGE_SIZE,
} from "../utils/mediclaimBackend.config";

const MEDICAL_CLAIM_URL = "/medi-claim";
const medicalExportApi = createExportApi(`${MEDICAL_CLAIM_URL}/export`, {
	enqueuePath: "",
});
const medicalImportApi = createImportApi<MedicalClaimImportError>("/import", {
	enqueuePath: "/medical-claims",
	statusPath: "/status/medical-claims",
	statusJobIdMode: "query",
});

type ApiDataResponse<T> = {
	success: boolean;
	message?: string;
	data: T;
};

export type PdfType = "MEDICAL_CLAIM";

type PdfUrlResponse = {
	success: boolean;
	url: string;
};

export type ApproveLineItemPayload = {
	id: string;
	/** "" / null / undefined → server approves the full claimed amount. */
	approvedClaimAmount?: string | number | null;
	remarks?: string | null;
};

type ListingPage = MedicalClaimListingResult;

const fetchListingPage = async (
	params: MedicalClaimListingParams,
): Promise<ListingPage> => {
	const response = await ServerAxios.get<
		MedicalClaimListingApiResponse | MedicalClaimListItem[]
	>(MEDICAL_CLAIM_URL, {
		params: {
			tab: params.tab,
			search: params.search?.trim() || undefined,
			...(MEDICLAIM_BACKEND.listingStatusFilter && params.status
				? { status: params.status }
				: {}),
			page_index: params.pageIndex,
			page_size: params.pageSize,
		},
	});

	const body = response.data;
	const rows = Array.isArray(body) ? body : (body.data ?? []);

	return {
		rows,
		totalCount: Array.isArray(body) ? rows.length : (body.total ?? rows.length),
		pageIndex: Array.isArray(body)
			? params.pageIndex
			: (body.page_index ?? params.pageIndex),
		pageSize: Array.isArray(body)
			? params.pageSize
			: (body.page_size ?? params.pageSize),
	};
};

/** Upper bound for the client-side status filter (100 rows per request). */
const CLIENT_FILTER_MAX_PAGES = 30;

/**
 * The backend ignores `status`, so fetch every row for this tab + search
 * (100 per request, newest first), filter here, then paginate here.
 */
const listWithClientStatusFilter = async (
	params: MedicalClaimListingParams,
	status: string,
): Promise<ListingPage> => {
	const all: MedicalClaimListItem[] = [];
	for (let page = 0; page < CLIENT_FILTER_MAX_PAGES; page += 1) {
		const result = await fetchListingPage({
			...params,
			status: undefined,
			pageIndex: page,
			pageSize: MEDICLAIM_MAX_PAGE_SIZE,
		});
		all.push(...result.rows);
		if (
			result.rows.length < MEDICLAIM_MAX_PAGE_SIZE ||
			all.length >= result.totalCount
		) {
			break;
		}
	}

	const filtered = all.filter(
		(row) => String(row.status ?? "").trim().toUpperCase() === status,
	);
	const size = Math.max(params.pageSize, 1);
	const start = params.pageIndex * size;

	return {
		rows: filtered.slice(start, start + size),
		totalCount: filtered.length,
		pageIndex: params.pageIndex,
		pageSize: params.pageSize,
	};
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
		const status = params.status?.trim().toUpperCase();
		if (status && !MEDICLAIM_BACKEND.listingStatusFilter) {
			return listWithClientStatusFilter(params, status);
		}
		return fetchListingPage(params);
	},

	/** Every row of a tab + search with one status (client-side filter). */
	listAllByStatus: async (
		params: Pick<MedicalClaimListingParams, "tab" | "search">,
		status: string,
	): Promise<MedicalClaimListItem[]> => {
		const result = await listWithClientStatusFilter(
			{ ...params, pageIndex: 0, pageSize: Number.MAX_SAFE_INTEGER },
			status.trim().toUpperCase(),
		);
		return result.rows;
	},

	getById: async (claimId: string): Promise<MedicalClaimDetail> => {
		const {
			data: { data },
		} = await ServerAxios.get<ApiDataResponse<MedicalClaimDetail>>(
			`${MEDICAL_CLAIM_URL}/${encodeURIComponent(claimId)}`,
		);
		return data;
	},

	listGrades: async (): Promise<GradeEligibilityRow[]> => {
		if (!MEDICLAIM_BACKEND.gradesEndpoint) return [];
		const {
			data: { data },
		} = await ServerAxios.get<ApiDataResponse<GradeEligibilityRow[]>>(
			`${MEDICAL_CLAIM_URL}/grades`,
		);
		return Array.isArray(data) ? data : [];
	},

	/** Returns the whole body (`{ success, message, data: claim }`). */
	initiate: async (
		payload: MedicalClaimInitiationPayload,
	): Promise<MedicalClaimMutationResponse> => {
		const { data } = await ServerAxios.post<MedicalClaimMutationResponse>(
			MEDICAL_CLAIM_URL,
			payload,
		);
		return data;
	},

	resendLink: async (claimId: string): Promise<MedicalClaimMutationResponse> => {
		const { data } = await ServerAxios.post<MedicalClaimMutationResponse>(
			`${MEDICAL_CLAIM_URL}/${encodeURIComponent(claimId)}/resend-link`,
		);
		return data;
	},

	close: async (claimId: string): Promise<MedicalClaimMutationResponse> => {
		const { data } = await ServerAxios.post<MedicalClaimMutationResponse>(
			`${MEDICAL_CLAIM_URL}/${encodeURIComponent(claimId)}/close`,
		);
		return data;
	},

	/**
	 * Approves one bill. Body: `{ bills: [{ billId, approvedClaimAmount }] }`;
	 * a missing amount → the server approves the full claimed amount. The
	 * server does not store remarks here (use saveLineItemRemarks) and returns
	 * no rows, so callers patch the cache from what they sent.
	 */
	approveLineItem: async (
		claimId: string,
		lineItem: ApproveLineItemPayload,
	): Promise<ReviewedBill | undefined> => {
		const raw = lineItem.approvedClaimAmount;
		const approvedClaimAmount =
			raw === null || raw === undefined || String(raw).trim() === ""
				? undefined
				: Number(raw);

		const { data: body } = await ServerAxios.patch<
			Partial<ApiDataResponse<ReviewedBill[]>>
		>(
			`${MEDICAL_CLAIM_URL}/${encodeURIComponent(claimId)}/bills/approved-amounts`,
			{ bills: [{ billId: lineItem.id, approvedClaimAmount }] },
		);
		return Array.isArray(body?.data) ? body.data[0] : undefined;
	},

	/** Reverses a line-item approval — only when the backend supports it. */
	unapproveLineItem: async (
		claimId: string,
		billId: string,
	): Promise<ReviewedBill | undefined> => {
		if (!MEDICLAIM_BACKEND.unapproveLineItem) {
			throw new Error(
				"Removing an approval isn't supported yet. Change the approved amount and approve again instead.",
			);
		}
		const { data: body } = await ServerAxios.patch<
			Partial<ApiDataResponse<ReviewedBill[]>>
		>(
			`${MEDICAL_CLAIM_URL}/${encodeURIComponent(claimId)}/bills/approved-amounts`,
			{ bills: [{ billId, approved: false }] },
		);
		return Array.isArray(body?.data) ? body.data[0] : undefined;
	},

	saveLineItemRemarks: async (
		claimId: string,
		lineItem: { id: string; remarks?: string | null },
	): Promise<void> => {
		await ServerAxios.patch(
			`${MEDICAL_CLAIM_URL}/${encodeURIComponent(claimId)}/bills/remarks`,
			{
				bills: [{ billId: lineItem.id, remarks: lineItem.remarks?.trim() ?? null }],
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

	// --- Import (shared factory) ---
	enqueueInitiationImport: medicalImportApi.enqueueImport,
	getInitiationImportStatus: medicalImportApi.getImportStatus,

	// --- Export (shared factory) ---
	enqueueListingExport: medicalExportApi.enqueueBulkExport,
	getExportStatus: medicalExportApi.getExportStatus,
	downloadExportFile: medicalExportApi.downloadExportFile,

	exportOne: async (claimId: string): Promise<Blob> => {
		const { data } = await ServerAxios.get<Blob>(
			`${MEDICAL_CLAIM_URL}/export/${encodeURIComponent(claimId)}`,
			{ responseType: "blob" },
		);
		return data;
	},
};
