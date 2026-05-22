import { ServerAxios } from "../../../../services/ServerAxios";

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

	clarifyStage: async (stageId: string, reason: string) => {
		const {
			data: { data, message },
		} = await ServerAxios.post(`/soa/stages/${stageId}/clarify`, {
			reason,
		});

		return { data, message };
	},

	getComments: async (epcId: string) => {
		const {
			data: { data },
		} = await ServerAxios.get(`/comment/${epcId}`);

		return data;
	},

	createApprovalComment: async (payload: {
		approvalId: string;
		message: string;
		mentionedUsers?: [];
	}) => {
		const {
			data: { data, message },
		} = await ServerAxios.post("/comment", payload);

		return { data, message };
	},

	createCreatorComment: async (payload: {
		epcId: string;
		message: string;
		mentionedUsers?: [];
	}) => {
		const {
			data: { data, message },
		} = await ServerAxios.post("/comment/creator-comment", payload);

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
};
