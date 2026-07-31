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
	WorkflowExecutionMode,
	WorkflowStage,
	WorkflowSummary,
	WorkflowTemplate,
	WorkflowUser,
} from "../types/types";
import { mapStages } from "../utils/workflow.helpers";

const WORKFLOW_URL = "/work-flow";
const USERS_URL = "/users";
const ATTACH_WORKFLOW_URL = `${WORKFLOW_URL}/attach`;

/**
 * Scope used by the reusable-workflow selector.
 * These values are intentionally kept separate from WorkflowListScope because
 * the two endpoints currently use different query contracts.
 */
export type WorkflowScope = "created" | "assigned";

/**
 * Scope used by the paginated workflow-management listing.
 */
export type WorkflowListScope = "ALL" | "ASSIGNED_TO_ME" | "CREATED_BY_ME";

export type WorkflowListParams = {
	page: number;
	pageSize: number;
	search?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	filters?: Record<string, string[]>;
	scope?: WorkflowListScope;
};

export type WorkflowListResponse = {
	data: WorkflowTemplate[];
	meta: {
		totalPages: number;
	};
};

export type AttachWorkflowInput = {
	recordRef: string;
	recordType: string;
	workflowId?: string;
	stages?: Array<{
		order: number;
		name: string;
		approverId: string;
	}>;
	flowType?: WorkflowExecutionMode;
	saveAsTemplate?: boolean;
	templateName?: string;
};

type ReusableWorkflowApiItem = {
	id: string | number;
	name?: string;
	description?: string;
	stageCount?: number;
	approverCount?: number;
	flowType?: WorkflowSummary["flowType"];
	updatedAt?: string;
	updated_at?: string;
	stages?: unknown[];
};

type ApproverApiItem = {
	id: string | number;
	first_name?: string;
	last_name?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Supports the response shapes currently used by ServerAxios endpoints:
 * T, { data: T }, and { data: { data: T } }.
 */
const unwrapData = <T>(value: unknown): T => {
	let current = value;

	for (let depth = 0; depth < 2; depth += 1) {
		if (!isRecord(current) || !("data" in current)) break;
		current = current.data;
	}

	return current as T;
};

const normalizeWorkflowList = (value: unknown): WorkflowListResponse => {
	if (Array.isArray(value)) {
		return {
			data: value as WorkflowTemplate[],
			meta: { totalPages: value.length > 0 ? 1 : 0 },
		};
	}

	if (!isRecord(value)) {
		return {
			data: [],
			meta: { totalPages: 0 },
		};
	}

	const nested = value.data;
	const payload =
		isRecord(nested) &&
		(Array.isArray(nested.data) ||
			Array.isArray(nested.rows) ||
			isRecord(nested.meta))
			? nested
			: value;

	const rows = Array.isArray(payload.data)
		? payload.data
		: Array.isArray(payload.rows)
			? payload.rows
			: [];
	const meta = isRecord(payload.meta) ? payload.meta : {};
	const rawTotalPages = meta.totalPages ?? meta.total_pages;
	const totalPages = Number(rawTotalPages ?? (rows.length > 0 ? 1 : 0));

	return {
		data: rows as WorkflowTemplate[],
		meta: {
			totalPages: Number.isFinite(totalPages) ? totalPages : 0,
		},
	};
};

const getApproverName = (user: ApproverApiItem): string =>
	`${user.first_name ?? user.firstName ?? ""} ${
		user.last_name ?? user.lastName ?? ""
	}`.trim() ||
	user.email?.trim() ||
	"Unnamed user";

const createWorkflow = async (payload: CreateWorkflowPayload) => {
	const response = await ServerAxios.post(
		api_routes.create_workflow_api_route,
		payload,
	);

	return response.data;
};

export const getWorkflowErrorMessage = (
	error: unknown,
	fallback: string,
): string => {
	if (axios.isAxiosError(error)) {
		const response = error.response?.data;

		if (isRecord(response)) {
			const message = response.message;
			const responseError = response.error;

			if (typeof message === "string" && message.trim()) {
				return message;
			}

			if (typeof responseError === "string" && responseError.trim()) {
				return responseError;
			}

			if (isRecord(response.data)) {
				const nestedMessage = response.data.message;
				const nestedError = response.data.error;

				if (typeof nestedMessage === "string" && nestedMessage.trim()) {
					return nestedMessage;
				}

				if (typeof nestedError === "string" && nestedError.trim()) {
					return nestedError;
				}
			}
		}
	}

	return error instanceof Error && error.message.trim()
		? error.message
		: fallback;
};

export const workflowApi = {
	list: async (params: WorkflowListParams): Promise<WorkflowListResponse> => {
		const response = await ServerAxios.get(
			api_routes.get_all_workflow_api_route,
			{
				params: {
					...params,
					filters: JSON.stringify(params.filters ?? {}),
				},
			},
		);

		return normalizeWorkflowList(response.data);
	},

	getById: async (id: string): Promise<WorkflowTemplate> => {
		const response = await ServerAxios.get(
			`${WORKFLOW_URL}/${encodeURIComponent(id)}`,
		);

		return unwrapData<WorkflowTemplate>(response.data);
	},

	create: createWorkflow,

	createUser: async (payload: CreateWorkflowPayload) =>
		createWorkflow({
			...payload,
			workflowType: "USERCREATED",
		}),

	update: async (id: string, payload: CreateWorkflowPayload) => {
		const response = await ServerAxios.post(
			`${WORKFLOW_URL}/update/${encodeURIComponent(id)}`,
			payload,
		);

		return response.data;
	},

	remove: async (id: string) => {
		const response = await ServerAxios.delete(
			`${WORKFLOW_URL}/delete/${encodeURIComponent(id)}`,
		);

		return response.data;
	},

	assignUsers: async (templateId: string, userIds: string[]) => {
		const response = await ServerAxios.post(
			api_routes.create_assign_users_workflow_template,
			{ templateId, userIds },
		);

		return response.data;
	},

	getUsers: async (): Promise<User[]> => {
		const response = await ServerAxios.get(USERS_URL, {
			params: { profile: "all" },
		});
		const rawUsers = unwrapData<UserResponse[]>(response.data);

		return (Array.isArray(rawUsers) ? rawUsers : []).map(mapUser);
	},

	getUserOptions: async (): Promise<Option[]> => {
		const users = await workflowApi.getUsers();

		return users.map((user) => ({
			value: user.id,
			label:
				`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
				"Unnamed user",
		}));
	},

	listReusable: async (
		scope: WorkflowScope,
		module: string,
	): Promise<WorkflowSummary[]> => {
		const response = await ServerAxios.get(
			api_routes.get_all_workflow_api_route,
			{
				params: { scope, module },
			},
		);
		const rawWorkflows = unwrapData<ReusableWorkflowApiItem[]>(response.data);

		return (Array.isArray(rawWorkflows) ? rawWorkflows : []).map((item) => ({
			id: String(item.id),
			name: item.name?.trim() || "Unnamed workflow",
			description: item.description,
			stageCount: Number(item.stageCount ?? item.stages?.length ?? 0),
			approverCount: Number(item.approverCount ?? 0),
			flowType: item.flowType ?? "SEQUENTIAL",
			updatedAt: item.updatedAt ?? item.updated_at,
		}));
	},

	getBuilderStages: async (id: string): Promise<WorkflowStage[]> => {
		const workflow = await workflowApi.getById(id);

		return mapStages(workflow.stages);
	},

	searchApprovers: async (
		query: string,
		module: string,
	): Promise<WorkflowUser[]> => {
		const response = await ServerAxios.get(USERS_URL, {
			params: {
				search: query.trim(),
				module,
			},
		});
		const rawUsers = unwrapData<ApproverApiItem[]>(response.data);

		return (Array.isArray(rawUsers) ? rawUsers : []).map((user) => {
			const name = getApproverName(user);
			const [firstName = "", ...lastNameParts] = name.split(" ");

			return {
				id: String(user.id),
				firstName,
				lastName: lastNameParts.join(" "),
				name,
				email: user.email?.trim() ?? "",
			};
		});
	},

	attach: async (input: AttachWorkflowInput): Promise<void> => {
		await ServerAxios.post(ATTACH_WORKFLOW_URL, input);
	},
};
