import { ServerAxios } from "../services/ServerAxios";
import { USERS_URL, type User } from "./common.types";

export const budgetApi = {
	getBudgetInfo: async (budgetMasterId?: string | null) => {
		const response = budgetMasterId
			? await ServerAxios.get(`/master-data/budget/${budgetMasterId}`)
			: await ServerAxios.get("/master-data/budget");

		const raw = response?.data;

		return (
			raw?.data ??
			raw?.d?.results?.[0] ??
			raw?.data?.[0] ??
			raw?.results?.[0] ??
			raw
		);
	},
};

export interface ImportJobStatus<TRow = unknown> {
	success: boolean;
	status: "waiting" | "delayed" | "active" | "completed" | "failed";
	progress: {
		totalRows: number;
		processedRows: number;
		failedRows: number;
	};
	errors: TRow[];
	rows?: TRow[];
	failedReason?: string;
	jobId: string;
}

export interface EnqueueImportResponse {
	success: boolean;
	jobId: string;
	logId?: string;
	pollUrl?: string;
	message?: string;
}

type ImportApiOptions = {
	enqueuePath?: string;
	statusPath?: string;
	statusJobIdMode?: "path" | "query";
};

export function createImportApi<TRow = unknown>(
	baseUrl: string,
	options: ImportApiOptions = {},
) {
	const enqueuePath = options.enqueuePath ?? "";
	const statusPath = options.statusPath ?? "/status";
	const statusJobIdMode = options.statusJobIdMode ?? "path";

	return {
		enqueueImport: async (
			formData: FormData,
		): Promise<EnqueueImportResponse> => {
			const { data } = await ServerAxios.post<EnqueueImportResponse>(
				`${baseUrl}${enqueuePath}`,
				formData,
			);

			return data;
		},

		getImportStatus: async (jobId: string): Promise<ImportJobStatus<TRow>> => {
			const encodedJobId = encodeURIComponent(jobId);

			const { data } = await ServerAxios.get<ImportJobStatus<TRow>>(
				statusJobIdMode === "query"
					? `${baseUrl}${statusPath}`
					: `${baseUrl}${statusPath}/${encodedJobId}`,
				statusJobIdMode === "query" ? { params: { jobId } } : undefined,
			);

			return data;
		},
	};
}

export interface ExportJobStatus {
	success: boolean;
	status: "waiting" | "active" | "completed" | "failed";
	downloadUrl: string | null;
	jobId: string;
}

export interface EnqueueExportResponse {
	success: boolean;
	jobId: string;
	logId?: string;
	pollUrl?: string;
	message?: string;
}

export function createExportApi(
	baseUrl: string,
	options: { enqueuePath?: string } = {},
) {
	const enqueuePath = options.enqueuePath ?? "/bulk";

	return {
		enqueueBulkExport: async <TParams extends Record<string, unknown>>(
			params: TParams,
		): Promise<EnqueueExportResponse> => {
			const { data } = await ServerAxios.post<EnqueueExportResponse>(
				`${baseUrl}${enqueuePath}`,
				params,
			);
			return data;
		},

		getExportStatus: async (jobId: string): Promise<ExportJobStatus> => {
			const { data } = await ServerAxios.get<ExportJobStatus>(
				`${baseUrl}/status/${jobId}`,
			);
			return data;
		},

		getExportStatusVendor: async (jobId: string): Promise<ExportJobStatus> => {
			const { data } = await ServerAxios.get<ExportJobStatus>(
				`${baseUrl}/bulk/${jobId}`,
			);
			return data;
		},

		downloadExportFile: async (downloadUrl: string): Promise<Blob> => {
			const response = await fetch(downloadUrl);
			if (!response.ok) {
				throw new Error(`Failed to download export file (${response.status})`);
			}
			return response.blob();
		},
	};
}

type PdfUrlResponse = {
	success?: boolean;
	url?: string;
	data?: {
		url?: string;
	};
};

export function createPdfApi<TDocumentType extends string>(baseUrl = "/pdf") {
	return {
		getPdfUrl: async (
			documentType: TDocumentType,
			documentId: string,
		): Promise<string> => {
			const encodedType = encodeURIComponent(documentType);
			const encodedId = encodeURIComponent(documentId);

			const { data } = await ServerAxios.get<PdfUrlResponse>(
				`${baseUrl}/${encodedType}/${encodedId}/url`,
			);

			const url = data.url ?? data.data?.url;

			if (!url) {
				throw new Error("PDF URL was not returned by the server.");
			}

			return url;
		},
	};
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const unwrapData = <T>(value: unknown): T => {
	let current = value;

	for (let depth = 0; depth < 2; depth += 1) {
		if (!isRecord(current) || !("data" in current)) break;
		current = current.data;
	}

	return current as T;
};

export const mapUser = (emp: User): User => ({
	id: emp.id,
	firstName: emp.firstName,
	lastName: emp.lastName,
	email: emp.email,
	//   jobRole: emp.TJOB_UUID,
	phone: emp.phone,
});

export function usersApi() {
	return {
		getUsers: async (): Promise<User[]> => {
			const response = await ServerAxios.get(USERS_URL, {
				params: { profile: "all" },
			});
			const rawUsers = unwrapData<User[]>(response.data);
			return (Array.isArray(rawUsers) ? rawUsers : []).map(mapUser);
		},
	};
}
