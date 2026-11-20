import { ServerAxios } from "../../../services/ServerAxios";
import type {
	CppApprovalMatrix,
	CppChain,
	CppMatrixMutationResult,
	CppMatrixSlotUpdate,
	CppPerson,
	CppTemplateSyncResult,
} from "../types/cpp.types";

const MATRIX_URL = "/cpp/approval-matrix";

type MutationResponse = {
	data: CppApprovalMatrix;
	message?: string;
	templates?: CppTemplateSyncResult;
};

export const cppMatrixApi = {
	get: async (): Promise<CppApprovalMatrix> => {
		const { data } = await ServerAxios.get<{ data: CppApprovalMatrix }>(
			MATRIX_URL,
		);
		return data.data;
	},

	/**
	 * Send only the slots that changed. A save that leaves a needed slot empty is refused (400).
	 * `templates` is the workflow-template refresh that runs after the save: the matrix can be
	 * saved while that refresh failed, so the screen must show it.
	 */
	save: async (
		assignments: CppMatrixSlotUpdate[],
	): Promise<CppMatrixMutationResult> => {
		const { data } = await ServerAxios.put<MutationResponse>(MATRIX_URL, {
			assignments,
		});
		return { matrix: data.data, templates: data.templates ?? null };
	},

	/** The yearly handover: one person takes over every role of another. */
	replaceUser: async (
		fromUserId: string,
		toUserId: string,
	): Promise<CppMatrixMutationResult> => {
		const { data } = await ServerAxios.post<MutationResponse>(
			`${MATRIX_URL}/replace-user`,
			{ fromUserId, toUserId },
		);
		return {
			matrix: data.data,
			templates: data.templates ?? null,
			message: data.message,
		};
	},

	/** Rebuilds the CPP workflow templates from the matrix as it is now (retry after a failed refresh). */
	syncTemplates: async (): Promise<CppTemplateSyncResult> => {
		const { data } = await ServerAxios.post<{ data: CppTemplateSyncResult }>(
			`${MATRIX_URL}/sync-templates`,
		);
		return data.data;
	},

	searchUsers: async (search: string): Promise<CppPerson[]> => {
		const { data } = await ServerAxios.get<{ data: CppPerson[] }>(
			`${MATRIX_URL}/users`,
			{
				params: { search: search.trim() || undefined },
			},
		);
		return data.data;
	},

	chains: async (): Promise<{ chains: CppChain[]; problems: string[] }> => {
		const { data } = await ServerAxios.get<{
			data: CppChain[];
			problems: string[];
		}>(`${MATRIX_URL}/chains`);
		return { chains: data.data, problems: data.problems ?? [] };
	},
};
