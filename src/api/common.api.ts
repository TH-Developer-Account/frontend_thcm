import { ServerAxios } from "../services/ServerAxios";

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
	status: "waiting" | "active" | "completed" | "failed";
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

export function createImportApi<TRow = unknown>(
	baseUrl: string,
	options: { enqueuePath?: string; statusPath?: string } = {},
) {
	const enqueuePath = options.enqueuePath ?? "";
	const statusPath = options.statusPath ?? "/status";

	return {
		enqueueImport: async (
			formData: FormData,
		): Promise<EnqueueImportResponse> => {
			const { data } = await ServerAxios.post<EnqueueImportResponse>(
				`${baseUrl}${enqueuePath}`,
				formData,
				{ headers: { "Content-Type": "multipart/form-data" } },
			);
			return data;
		},

		getImportStatus: async (jobId: string): Promise<ImportJobStatus<TRow>> => {
			const { data } = await ServerAxios.get<ImportJobStatus<TRow>>(
				`${baseUrl}${statusPath}/${jobId}`,
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
			const response = await fetch(downloadUrl); // no auth headers, no baseURL
			if (!response.ok) {
				throw new Error(`Failed to download export file (${response.status})`);
			}
			return response.blob();
		},
	};
}
