import axios from "axios";

import type { Option } from "../../../components/forms/input.types";
import { ServerAxios } from "../../../services/ServerAxios";
import type {
	User,
	UserResponse,
} from "../../admin/user-profile/types/profile.types";
import { mapUser } from "../../admin/user-profile/types/profile.types";
import { api_routes } from "../constant/workflow.constant";
import type {
	CreateWorkflowPayload,
	WorkFlowTemplate,
	WorkflowSummary,
} from "../types/workflow.types";
import type {
	Approver,
	WorkflowBuilderPayload,
} from "../context/useWorkflowBuilder";

export type WorkflowScope = "created" | "assigned";

export type WorkflowListParams = {
	page: number;
	pageSize: number;
	search?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	filters?: Record<string, string[]>;
	scope?: "ALL" | "ASSIGNED_TO_ME" | "CREATED_BY_ME";
};

export type WorkflowListResponse = {
	data: WorkFlowTemplate[];
	meta: { totalPages: number };
};

export type AttachWorkflowInput = {
	recordRef: string;
	recordType: string;
	workflowId?: string;
	stages?: Array<{ order: number; name: string; approverId: string }>;
	flowType?: WorkflowBuilderPayload["flowType"];
	saveAsTemplate?: boolean;
	templateName?: string;
};

type ReusableWorkflowApiItem = {
	id: string;
	name?: string;
	description?: string;
	stageCount?: number;
	approverCount?: number;
	flowType?: "SEQUENTIAL" | "PARALLEL";
	updatedAt?: string;
	updated_at?: string;
	stages?: unknown[];
};

type ApproverApiItem = {
	id: string;
	first_name?: string;
	last_name?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
};

const unwrapData = <T>(value: unknown): T => {
	const response = value as { data?: unknown };
	const first = response?.data ?? value;
	const nested = first as { data?: unknown };
	return (nested?.data ?? first) as T;
};

export const getWorkflowErrorMessage = (
	error: unknown,
	fallback: string,
): string => {
	if (axios.isAxiosError(error)) {
		const response = error.response?.data as
			| { message?: unknown; error?: unknown }
			| undefined;

		if (typeof response?.message === "string" && response.message.trim()) {
			return response.message;
		}
		if (typeof response?.error === "string" && response.error.trim()) {
			return response.error;
		}
	}

	return error instanceof Error && error.message.trim()
		? error.message
		: fallback;
};

export const workflowApi = {
	async list(params: WorkflowListParams): Promise<WorkflowListResponse> {
		const response = await ServerAxios.get(
			api_routes.get_all_workflow_api_route,
			{
				params: {
					...params,
					filters: JSON.stringify(params.filters ?? {}),
				},
			},
		);
		const body = response.data as {
			data?: unknown;
			meta?: { totalPages?: number };
		};
		const payload = (
			body?.data &&
			!Array.isArray(body.data) &&
			typeof body.data === "object" &&
			("data" in body.data || "meta" in body.data)
				? body.data
				: body
		) as {
			data?: WorkFlowTemplate[];
			meta?: { totalPages?: number };
		};

		return {
			data: Array.isArray(payload?.data) ? payload.data : [],
			meta: { totalPages: Number(payload?.meta?.totalPages ?? 0) },
		};
	},

	async getById(id: string): Promise<WorkFlowTemplate> {
		const response = await ServerAxios.get(
			`/work-flow/${encodeURIComponent(id)}`,
		);
		return unwrapData<WorkFlowTemplate>(response.data);
	},

	async create(payload: CreateWorkflowPayload) {
		const response = await ServerAxios.post(
			api_routes.create_workflow_api_route,
			payload,
		);
		return response.data;
	},

	async update(id: string, payload: CreateWorkflowPayload) {
		const response = await ServerAxios.post(
			`/work-flow/update/${encodeURIComponent(id)}`,
			payload,
		);
		return response.data;
	},

	async remove(id: string) {
		const response = await ServerAxios.delete(
			`/work-flow/delete/${encodeURIComponent(id)}`,
		);
		return response.data;
	},

	async assignUsers(templateId: string, userIds: string[]) {
		const response = await ServerAxios.post(
			api_routes.create_assign_users_workflow_template,
			{ templateId, userIds },
		);
		return response.data;
	},

	async getUsers(): Promise<User[]> {
		const response = await ServerAxios.get("/users", {
			params: { profile: "all" },
		});
		const raw = unwrapData<UserResponse[]>(response.data);
		return (Array.isArray(raw) ? raw : []).map(mapUser);
	},

	async getUserOptions(): Promise<Option[]> {
		const users = await this.getUsers();
		return users.map((user) => ({
			value: user.id,
			label:
				`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
				"Unnamed user",
		}));
	},

	async listReusable(
		scope: WorkflowScope,
		module: string,
	): Promise<WorkflowSummary[]> {
		const response = await ServerAxios.get(
			api_routes.get_all_workflow_api_route,
			{ params: { scope, module } },
		);
		const raw = unwrapData<ReusableWorkflowApiItem[]>(response.data);
		return (Array.isArray(raw) ? raw : []).map((item) => ({
			id: String(item.id),
			name: item.name ?? "Unnamed workflow",
			description: item.description,
			stageCount: Number(item.stageCount ?? item.stages?.length ?? 0),
			approverCount: Number(item.approverCount ?? 0),
			flowType: item.flowType ?? "SEQUENTIAL",
			updatedAt: item.updatedAt ?? item.updated_at,
		}));
	},

	async getBuilderStages(
		id: string,
	): Promise<Array<{ stageName: string; approver: Approver }>> {
		const workflow = await this.getById(id);
		return (workflow.stages ?? []).flatMap((stage) =>
			(stage.approvers ?? []).map((approver) => ({
				stageName: stage.name,
				approver: {
					id: approver.userId,
					name:
						`${approver.user.first_name ?? ""} ${
							approver.user.last_name ?? ""
						}`.trim() || approver.user.email,
					email: approver.user.email,
				},
			})),
		);
	},

	async searchApprovers(
		query: string,
		module: string,
	): Promise<ApproverApiItem[]> {
		const response = await ServerAxios.get("/users", {
			params: { search: query, module },
		});
		const raw = unwrapData<ApproverApiItem[]>(response.data);
		return (Array.isArray(raw) ? raw : []).map((user) => ({
			id: String(user.id),
			name:
				`${user.first_name ?? user.firstName ?? ""} ${
					user.last_name ?? user.lastName ?? ""
				}`.trim() || user.email,
			email: user.email ?? "",
		}));
	},

	async attach(input: AttachWorkflowInput): Promise<void> {
		await ServerAxios.post("/work-flow/attach", input);
	},
};
