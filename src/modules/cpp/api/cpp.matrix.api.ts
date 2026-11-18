import { ServerAxios } from "../../../services/ServerAxios";
import type {
	CppApprovalMatrix,
	CppChain,
	CppMatrixSlotUpdate,
	CppPerson,
} from "../types/cpp.types";

const MATRIX_URL = "/cpp/approval-matrix";

export const cppMatrixApi = {
	get: async (): Promise<CppApprovalMatrix> => {
		const { data } = await ServerAxios.get<{ data: CppApprovalMatrix }>(MATRIX_URL);
		return data.data;
	},

	/** Send only the slots that changed. A save that leaves a needed slot empty is refused (400). */
	save: async (assignments: CppMatrixSlotUpdate[]): Promise<CppApprovalMatrix> => {
		const { data } = await ServerAxios.put<{ data: CppApprovalMatrix }>(MATRIX_URL, {
			assignments,
		});
		return data.data;
	},

	/** The yearly handover: one person takes over every role of another. */
	replaceUser: async (fromUserId: string, toUserId: string): Promise<CppApprovalMatrix> => {
		const { data } = await ServerAxios.post<{ data: CppApprovalMatrix }>(
			`${MATRIX_URL}/replace-user`,
			{ fromUserId, toUserId },
		);
		return data.data;
	},

	searchUsers: async (search: string): Promise<CppPerson[]> => {
		const { data } = await ServerAxios.get<{ data: CppPerson[] }>(`${MATRIX_URL}/users`, {
			params: { search: search.trim() || undefined },
		});
		return data.data;
	},

	chains: async (): Promise<{ chains: CppChain[]; problems: string[] }> => {
		const { data } = await ServerAxios.get<{ data: CppChain[]; problems: string[] }>(
			`${MATRIX_URL}/chains`,
		);
		return { chains: data.data, problems: data.problems ?? [] };
	},
};
