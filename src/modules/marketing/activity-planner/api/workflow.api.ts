import { ServerAxios } from "../../../../services/ServerAxios";
import type { EventDeviationPayload } from "../types/event.outcome.types";

export const workflowApi = {
	assignWorkflow: async (payload: {
		eventProposalId: string;
		workspaceId: string;
		appId: string;
		budget: number;
	}) => {
		const {
			data: { data, message },
		} = await ServerAxios.post("/soa/assign-workflow", payload);

		return { data, message };
	},

	previewWorkflow: async (payload: {
		workspaceId: string;
		appId: string;
		budget: number;
	}) => {
		const {
			data: { data },
		} = await ServerAxios.post("/soa/preview-workflow", payload);

		return data;
	},

	approveStage: async (stageId: string) => {
		const {
			data: { data, message },
		} = await ServerAxios.post(`/soa/stages/${stageId}/approve`);

		return { data, message };
	},

	getComments: async (epcId: string) => {
		const {
			data: { data },
		} = await ServerAxios.get(`/comment/EVENT_PROPOSAL/${epcId}/activity`);

		return data;
	},

	createApprovalComment: async (payload: {
		approvalId: string;
		message: string;
		to?: string[];
		cc?: string[];
	}) => {
		const {
			data: { data, message },
		} = await ServerAxios.post("/comment", payload);

		return { data, message };
	},

	createCreatorComment: async (payload: {
		epcId: string;
		message: string;
		to?: string[];
		cc?: string[];
	}) => {
		const {
			data: { data, message },
		} = await ServerAxios.post(
			`/comment/EVENT_PROPOSAL/${payload.epcId}/creator-comment`,
			payload,
		);

		return { data, message };
	},

	clarifyStage: async (stageId: string, reason: string) => {
		const {
			data: { data, message },
		} = await ServerAxios.post(`/soa/stages/${stageId}/clarify`, {
			reason,
		});

		return { data, message };
	},
	submitClarifiedUpdatedForm: async (workflowId: string) => {
		const {
			data: { data, message },
		} = await ServerAxios.post(`/soa/stages/activate-first-stage`, {
			workflowId,
		});

		return { data, message };
	},

	deviationStage: async (epcId: string, payload: EventDeviationPayload) => {
		const isFormData = payload instanceof FormData;

		const { data } = await ServerAxios.post(
			`/epc/${epcId}/initiate-deviation`,
			payload,
			isFormData
				? {
						headers: {
							"Content-Type": "multipart/form-data",
						},
					}
				: undefined,
		);

		return data;
	},

	submitDeviationUpdatedForm: async (payload: {
		workflowId: string;
		eventProposalId?: string;
		workspaceId?: string;
		appId?: string;
		newBudget?: string | number;
	}) => {
		const {
			data: { data, message },
		} = await ServerAxios.post(`/soa/stages/trigger-deviation`, payload);

		return { data, message };
	},
};
