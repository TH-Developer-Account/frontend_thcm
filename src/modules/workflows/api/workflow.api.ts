import axios from "axios";

import type { Option } from "../../../components/forms/input.types";
import { ServerAxios } from "../../../services/ServerAxios";
import type { EventDeviationPayload } from "../../../types/common.types";
import type {
	User,
	UserResponse,
} from "../../admin/user-profile/types/profile.types";
import { mapUser } from "../../admin/user-profile/types/profile.types";
import { api_routes } from "../constant/workflow.constant";
import type {
	AttachWorkflowInput,
	CreateWorkflowPayload,
	WorkflowModuleListParams,
	WorkflowStage,
	WorkflowSummary,
	WorkflowTemplate,
	WorkflowUser,
} from "../types/types";
import { mapStages } from "../utils/workflow.helpers";
import type { WorkflowScope } from "../types/types";

export type { AttachWorkflowInput } from "../types/types";
import type {
	WorkflowListApiResponse,
	WorkflowListParams,
	WorkflowListResponse,
} from "../types/types";
import { normalizeWorkflowTemplates } from "../utils/workflow-list.helpers";

const WORKFLOW_URL = "/work-flow";

const createEmptyMeta = (
	params: WorkflowListParams,
): WorkflowListResponse["meta"] => ({
	total: 0,
	page: params.page,
	limit: params.pageSize,
	totalPages: 0,
});
const WORKFLOW_TEMPLATE_URL = "/work-flow";
const WORKFLOW_RUNTIME_URL = "/soa";
const USERS_URL = "/users";

export type WorkflowSubjectType =
	| "EVENT_PROPOSAL"
	| "VENDOR_ONBOARDING"
	| "MEDICAL_CLAIM";

export type WorkflowCriteria = Record<string, unknown> & {
	workflowId?: string;
};

export type AssignWorkflowPayload = {
	subjectType: WorkflowSubjectType;
	subjectId: string;
	workspaceId: string;
	appId: string;
	criteria: WorkflowCriteria;
};

export type PreviewWorkflowPayload = Omit<AssignWorkflowPayload, "subjectId">;

export type ActivateFirstStageEdit = {
	stageOrder: number;
	strategy: "ALL" | "ANY" | "SOME";
	minApprovals?: number;
	approvers: Array<{
		approverId: string;
		isExternalApprover: boolean;
	}>;
};

export type ActivateFirstStagePayload = {
	workflowId: string | null;
	newTemplateId?: string | null;
	stageEdits?: ActivateFirstStageEdit[];
};

export type TriggerDeviationPayload = {
	eventProposalId: string;
	workspaceId: string;
	appId: string;
	newBudget: string | number;
};

type ApiEnvelope<T> = {
	success?: boolean;
	data: T;
	message?: string;
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

const unwrapData = <T>(value: unknown): T => {
	let current = value;

	for (let depth = 0; depth < 2; depth += 1) {
		if (!isRecord(current) || !("data" in current)) break;
		current = current.data;
	}

	return current as T;
};

const unwrapEnvelope = <T>(value: unknown): ApiEnvelope<T> => {
	const envelope = value as ApiEnvelope<T>;
	return {
		success: envelope.success,
		data: envelope.data,
		message: envelope.message,
	};
};

const normalizeWorkflowList = (value: unknown): WorkflowListResponse => {
	if (Array.isArray(value)) {
		return {
			data: value as WorkflowTemplate[],
			meta: {
				total: value.length,
				page: 1,
				limit: value.length,
				totalPages: value.length > 0 ? 1 : 0,
			},
		};
	}

	if (!isRecord(value)) {
		return { data: [], meta: { total: 0, page: 1, limit: 0, totalPages: 0 } };
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

	const rawTotal = meta.total ?? meta.total_count;
	const total = Number(rawTotal ?? rows.length);

	const rawPage = meta.page ?? meta.current_page;
	const page = Number(rawPage ?? 1);

	const rawLimit = meta.limit ?? meta.pageSize ?? meta.page_size;
	const limit = Number(rawLimit ?? rows.length);

	return {
		data: rows as WorkflowTemplate[],
		meta: {
			total: Number.isFinite(total) ? total : 0,
			page: Number.isFinite(page) ? page : 1,
			limit: Number.isFinite(limit) ? limit : 0,
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

const createAttachCriteria = (
	input: Pick<
		AttachWorkflowInput,
		"workflowId" | "stages" | "flowType" | "saveAsTemplate" | "templateName"
	>,
): WorkflowCriteria => ({
	...(input.workflowId ? { workflowId: input.workflowId } : {}),
	...(input.stages ? { stages: input.stages } : {}),
	...(input.flowType ? { flowType: input.flowType } : {}),
	...(input.saveAsTemplate !== undefined
		? { saveAsTemplate: input.saveAsTemplate }
		: {}),
	...(input.templateName ? { templateName: input.templateName } : {}),
});

export const getWorkflowErrorMessage = (
	error: unknown,
	fallback: string,
): string => {
	if (axios.isAxiosError(error)) {
		const response = error.response?.data;
		if (isRecord(response)) {
			const candidates = [
				response.message,
				response.error,
				isRecord(response.data) ? response.data.message : undefined,
				isRecord(response.data) ? response.data.error : undefined,
			];
			const message = candidates.find(
				(value): value is string =>
					typeof value === "string" && value.trim().length > 0,
			);
			if (message) return message;
		}
	}

	return error instanceof Error && error.message.trim()
		? error.message
		: fallback;
};

/**
 * Fetches and normalizes the workflow-management listing.
 *
 * The backend listing response uses snake-case fields. This API function
 * converts them into the normalized WorkflowTemplate format before the data
 * reaches the listing hook or table.
 */
export const getWorkflowList = async (
	params: WorkflowListParams,
): Promise<WorkflowListResponse> => {
	const { page, pageSize, search, sortBy, sortOrder, filters, scope } = params;

	const response = await ServerAxios.get<WorkflowListApiResponse>(
		WORKFLOW_URL,
		{
			params: {
				page,

				/*
				 * The backend uses `limit`. This was confirmed by the
				 * response returning limit: 10 when pageSize: 25 was sent.
				 */
				limit: pageSize,

				...(search?.trim() ? { search: search.trim() } : {}),

				...(sortBy ? { sortBy } : {}),
				...(sortOrder ? { sortOrder } : {}),
				...(scope ? { scope } : {}),

				filters: JSON.stringify({
					createdBy: filters?.createdBy ?? [],
					apps: filters?.apps ?? [],
				}),
			},
		},
	);

	const body = response.data;

	if (!body || !Array.isArray(body.data)) {
		console.error("Unexpected workflow listing response:", body);

		return {
			data: [],
			meta: createEmptyMeta(params),
		};
	}

	return {
		data: normalizeWorkflowTemplates(body.data),

		meta: {
			total: body.meta?.total ?? body.data.length,
			page: body.meta?.page ?? page,
			limit: body.meta?.limit ?? pageSize,
			totalPages: body.meta?.totalPages ?? (body.data.length > 0 ? 1 : 0),
		},
	};
};

/**
 * Maps a raw reusable-workflow API item to the normalized WorkflowSummary shape.
 * Shared by listReusable and listForModule so the mapping logic lives in one place.
 */
const mapReusableWorkflowItem = (
	item: ReusableWorkflowApiItem,
): WorkflowSummary => ({
	id: String(item.id),
	name: item.name?.trim() || "Unnamed workflow",
	description: item.description,
	stageCount: Number(item.stageCount ?? item.stages?.length ?? 0),
	approverCount: Number(item.approverCount ?? 0),
	flowType: item.flowType ?? "SEQUENTIAL",
	updatedAt: item.updatedAt ?? item.updated_at,
});

export const workflowListApi = {
	list: getWorkflowList,
};

export const workflowApi = {
	// Workflow template management
	list: async (params: WorkflowListParams): Promise<WorkflowListResponse> => {
		const { pageSize, ...rest } = params;

		const response = await ServerAxios.get(
			api_routes.get_all_workflow_api_route,
			{
				params: {
					...rest,
					limit: pageSize,
					filters: JSON.stringify(params.filters ?? {}),
				},
			},
		);
		return normalizeWorkflowList(response.data);
	},

	getById: async (id: string): Promise<WorkflowTemplate> => {
		const response = await ServerAxios.get(
			`${WORKFLOW_TEMPLATE_URL}/${encodeURIComponent(id)}`,
		);
		return unwrapData<WorkflowTemplate>(response.data);
	},

	create: createWorkflow,

	createUser: async (payload: CreateWorkflowPayload) =>
		createWorkflow({ ...payload, scope: "USER" }),

	update: async (id: string, payload: CreateWorkflowPayload) => {
		const response = await ServerAxios.post(
			`${WORKFLOW_TEMPLATE_URL}/update/${encodeURIComponent(id)}`,
			payload,
		);
		return response.data;
	},

	remove: async (id: string) => {
		const response = await ServerAxios.delete(
			`${WORKFLOW_TEMPLATE_URL}/delete/${encodeURIComponent(id)}`,
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
			{ params: { scope, module } },
		);
		const rawWorkflows = unwrapData<ReusableWorkflowApiItem[]>(response.data);
		return (Array.isArray(rawWorkflows) ? rawWorkflows : []).map(
			mapReusableWorkflowItem,
		);
	},

	/**
	 * Fetches workflows assigned to the current user for a given app + module
	 * (e.g. Medical Claim Initiation). Used by modules like medi-claim that only
	 * support admin-assigned workflows — no on-the-fly attach/build here.
	 */
	listForModule: async (
		params: WorkflowModuleListParams,
	): Promise<WorkflowSummary[]> => {
		const response = await ServerAxios.get(
			api_routes.get_all_workflow_api_route,
			{
				params: {
					appId: params.appId,
					appKey: params.appKey,
					moduleKey: params.moduleKey,
					scope: params.scope,
				},
			},
		);
		const rawWorkflows = unwrapData<ReusableWorkflowApiItem[]>(response.data);
		return (Array.isArray(rawWorkflows) ? rawWorkflows : []).map(
			mapReusableWorkflowItem,
		);
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
			params: { search: query.trim(), module },
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

	// Runtime workflow operations
	assignWorkflow: async (payload: AssignWorkflowPayload) => {
		const response = await ServerAxios.post<ApiEnvelope<unknown>>(
			`${WORKFLOW_RUNTIME_URL}/assign-workflow`,
			payload,
		);
		return unwrapEnvelope<unknown>(response.data);
	},

	previewWorkflow: async (payload: PreviewWorkflowPayload) => {
		const response = await ServerAxios.post<ApiEnvelope<WorkflowTemplate>>(
			`${WORKFLOW_RUNTIME_URL}/preview-workflow`,
			payload,
		);
		return unwrapEnvelope<WorkflowTemplate>(response.data).data;
	},

	attach: async (input: AttachWorkflowInput) =>
		workflowApi.assignWorkflow({
			subjectType: input.recordType as WorkflowSubjectType,
			subjectId: input.recordRef,
			workspaceId: input.workspaceId,
			appId: input.appId,
			criteria: createAttachCriteria(input),
		}),

	previewAttachment: async (input: AttachWorkflowInput) =>
		workflowApi.previewWorkflow({
			subjectType: input.recordType as WorkflowSubjectType,
			workspaceId: input.workspaceId,
			appId: input.appId,
			criteria: createAttachCriteria(input),
		}),

	approveStage: async (stageId: string) => {
		const response = await ServerAxios.post<ApiEnvelope<unknown>>(
			`${WORKFLOW_RUNTIME_URL}/stages/${encodeURIComponent(stageId)}/approve`,
		);
		return unwrapEnvelope<unknown>(response.data);
	},

	clarifyStage: async (stageId: string, reason: string) => {
		const response = await ServerAxios.post<ApiEnvelope<unknown>>(
			`${WORKFLOW_RUNTIME_URL}/stages/${encodeURIComponent(stageId)}/clarify`,
			{ reason },
		);
		return unwrapEnvelope<unknown>(response.data);
	},
	submitClarifiedUpdatedForm: async (workflowId: string) => {
		const {
			data: { data, message },
		} = await ServerAxios.post(`/soa/stages/activate-first-stage`, {
			workflowId,
		});

		return { data, message };
	},
	activateFirstStage: async ({
		workflowId,
		stageEdits,
		newTemplateId,
	}: ActivateFirstStagePayload) => {
		const response = await ServerAxios.post<ApiEnvelope<unknown>>(
			`${WORKFLOW_RUNTIME_URL}/stages/activate-first-stage`,
			{
				workflowId,
				newTemplateId,
				...(stageEdits?.length ? { stageEdits } : {}),
			},
		);
		return unwrapEnvelope<unknown>(response.data);
	},

	triggerDeviation: async (payload: TriggerDeviationPayload) => {
		const response = await ServerAxios.post<ApiEnvelope<unknown>>(
			`${WORKFLOW_RUNTIME_URL}/stages/trigger-deviation`,
			payload,
		);
		return unwrapEnvelope<unknown>(response.data);
	},

	getInstance: async <T = unknown>(id: string): Promise<T> => {
		const response = await ServerAxios.get<ApiEnvelope<T>>(
			`${WORKFLOW_RUNTIME_URL}/workflow-instance/${encodeURIComponent(id)}`,
		);
		return unwrapEnvelope<T>(response.data).data;
	},

	getHistory: async <T = unknown>(id: string): Promise<T> => {
		const response = await ServerAxios.get<ApiEnvelope<T>>(
			`${WORKFLOW_RUNTIME_URL}/workflow-instance/${encodeURIComponent(id)}/history`,
		);
		return unwrapEnvelope<T>(response.data).data;
	},

	// EPC-specific workflow helpers retained here so there is no second workflow API.
	initiateDeviation: async (epcId: string, payload: EventDeviationPayload) => {
		const isFormData = payload instanceof FormData;
		const response = await ServerAxios.post(
			`/epc/${encodeURIComponent(epcId)}/initiate-deviation`,
			payload,
			isFormData
				? { headers: { "Content-Type": "multipart/form-data" } }
				: undefined,
		);
		return response.data;
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
	getComments: async (epcId: string) => {
		const response = await ServerAxios.get(
			`/comment/EVENT_PROPOSAL/${encodeURIComponent(epcId)}/activity`,
		);
		return unwrapData<unknown>(response.data);
	},

	createApprovalComment: async (payload: {
		approvalId: string;
		message: string;
		to?: string[];
		cc?: string[];
	}) => {
		const response = await ServerAxios.post<ApiEnvelope<unknown>>(
			"/comment",
			payload,
		);
		return unwrapEnvelope<unknown>(response.data);
	},

	createCreatorComment: async (payload: {
		epcId: string;
		message: string;
		to?: string[];
		cc?: string[];
	}) => {
		const response = await ServerAxios.post<ApiEnvelope<unknown>>(
			`/comment/EVENT_PROPOSAL/${encodeURIComponent(payload.epcId)}/creator-comment`,
			payload,
		);
		return unwrapEnvelope<unknown>(response.data);
	},
};
