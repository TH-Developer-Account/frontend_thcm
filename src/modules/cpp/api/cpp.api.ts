import { ServerAxios } from "../../../services/ServerAxios";
import type {
	CppAttachment,
	CppDetail,
	CppListingApiResponse,
	CppListingParams,
	CppListingResult,
	CppMutationResponse,
	CppRequestPayload,
} from "../types/cpp.types";

export const CPP_URL = "/cpp";

const idUrl = (id: string) => `${CPP_URL}/${encodeURIComponent(id)}`;

export const cppApi = {
	list: async (params: CppListingParams): Promise<CppListingResult> => {
		const { data: body } = await ServerAxios.get<CppListingApiResponse>(CPP_URL, {
			params: {
				tab: params.tab,
				search: params.search?.trim() || undefined,
				status: params.status,
				page_index: params.pageIndex,
				page_size: params.pageSize,
				sortBy: params.sortBy,
				sortOrder: params.sortOrder,
			},
		});

		const rows = body.data ?? [];
		return {
			rows,
			totalCount: body.total ?? rows.length,
			pageIndex: body.page_index ?? params.pageIndex,
			pageSize: body.page_size ?? params.pageSize,
		};
	},

	getById: async (id: string): Promise<CppDetail> => {
		const { data } = await ServerAxios.get<{ data: CppDetail }>(idUrl(id));
		return data.data;
	},

	create: async (payload: CppRequestPayload = {}): Promise<CppMutationResponse> => {
		const { data } = await ServerAxios.post<CppMutationResponse>(CPP_URL, payload);
		return data;
	},

	/** Only the keys you send change; a section sent again replaces that whole section. */
	update: async (id: string, payload: CppRequestPayload): Promise<CppMutationResponse> => {
		const { data } = await ServerAxios.put<CppMutationResponse>(idUrl(id), payload);
		return data;
	},

	deleteDraft: async (id: string): Promise<void> => {
		await ServerAxios.delete(idUrl(id));
	},

	uploadAttachment: async (
		id: string,
		file: File,
		type: string,
	): Promise<CppAttachment> => {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("type", type);
		const { data } = await ServerAxios.post<{ data: CppAttachment }>(
			`${idUrl(id)}/attachments`,
			formData,
		);
		return data.data;
	},

	deleteAttachment: async (id: string, attachmentId: string): Promise<void> => {
		await ServerAxios.delete(
			`${idUrl(id)}/attachments/${encodeURIComponent(attachmentId)}`,
		);
	},
};
