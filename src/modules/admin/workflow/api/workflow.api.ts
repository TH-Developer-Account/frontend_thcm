import type { CreateWorkflowPayload } from "../types/workflow.types";

export const createWorkflowApi = async (payload: CreateWorkflowPayload) => {
	// replace with your real API client
	// return axios.post("/api/workflows", payload);

	console.log("API Payload:", payload);

	return Promise.resolve({
		success: true,
		data: payload,
	});
};
