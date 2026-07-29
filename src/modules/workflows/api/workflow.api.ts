import axios from "axios";

import { ServerAxios } from "../../../services/ServerAxios";
import type {
	AttachWorkflowInput,
	CreateWorkflowPayload,
	WorkflowApp,
	WorkflowExecutionMode,
	WorkflowListParams,
	WorkflowListResponse,
	WorkflowStage,
	WorkflowSummary,
	WorkflowTemplate,
	WorkflowTemplateUser,
	WorkflowUser,
	WorkflowScope,
} from "../types/types";
import { normalizeWorkflowStatus } from "../utils/status";
import { deriveStrategy } from "../utils/strategy";
import { getFullName } from "../utils/user";

const WORKFLOW_URL = "/work-flow";
const USERS_URL = "/users";
const ATTACH_WORKFLOW_URL = `${WORKFLOW_URL}/attach`;
const ASSIGN_USERS_URL = `${WORKFLOW_URL}/assign-profile`;

type RawRecord = Record<string, unknown>;

type RawWorkflowUser = {
	id?: string | number;
	userId?: string | number;
	user_id?: string | number;
	first_name?: string | null;
	last_name?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	name?: string | null;
	email?: string | null;
	phone?: string | null;
	avatarUrl?: string | null;
	avatar_url?: string | null;
};

type RawWorkflowApprover = {
	id?: string | number;
	stageId?: string | number;
	stage_id?: string | number;
	userId?: string | number;
	user_id?: string | number;
	user?: RawWorkflowUser | null;
	approver?: RawWorkflowUser | null;
	isExternalApprover?: boolean | null;
	is_external_approver?: boolean | null;
};

type RawWorkflowStage = {
	id?: string | number;
	name?: string | null;
	stageName?: string | null;
	stage_name?: string | null;
	stageOrder?: number | string | null;
	stage_order?: number | string | null;
	strategy?: string | null;
	minApprovals?: number | string | null;
	min_approvals?: number | string | null;
	approvers?: RawWorkflowApprover[] | null;
};

type RawWorkflowTemplateUser = {
	id?: string | number;
	templateId?: string | number;
	template_id?: string | number;
	created_at?: string | null;
	createdAt?: string | null;
	user?: RawWorkflowUser | null;
};

type RawWorkflowTemplate = {
	id?: string | number;
	name?: string | null;
	description?: string | null;
	isActive?: boolean | null;
	is_active?: boolean | null;
	appId?: string | number | null;
	app_id?: string | number | null;
	workspaceId?: string | number | null;
	workspace_id?: string | number | null;
	metaData_1?: string | null;
	metaData_2?: string | null;
	metaData_3?: string | null;
	created_at?: string | null;
	createdAt?: string | null;
	updated_at?: string | null;
	updatedAt?: string | null;
	stages?: RawWorkflowStage[] | null;
	app?: Partial<WorkflowApp> | null;
	created_by?: RawWorkflowUser | null;
	createdBy?: RawWorkflowUser | null;
	updated_by?: RawWorkflowUser | null;
	updatedBy?: RawWorkflowUser | null;
	workFlowUsers?: RawWorkflowTemplateUser[] | null;
	workflowUsers?: RawWorkflowTemplateUser[] | null;
	stageCount?: number | string | null;
	approverCount?: number | string | null;
	flowType?: WorkflowExecutionMode | null;
};

type RawAttachWorkflowPayload = Omit<AttachWorkflowInput, "stages"> & {
	stages?: Array<{
		order: number;
		name: string;
		approverId: string;
	}>;
};

const isRecord = (value: unknown): value is RawRecord =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown): string =>
	value === undefined || value === null ? "" : String(value);

const asNumber = (value: unknown, fallback = 0): number => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const asArray = <T>(value: T[] | null | undefined): T[] =>
	Array.isArray(value) ? value : [];

/**
 * Supports the response shapes currently returned by ServerAxios endpoints:
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

/**
 * This is the only snake_case/camelCase compatibility mapper for workflow
 * users. Components, hooks and utilities only receive WorkflowUser.
 */
export const mapWorkflowUser = (
	raw?: RawWorkflowUser | null,
	fallbackId = "",
): WorkflowUser => ({
	id: asString(raw?.id ?? raw?.userId ?? raw?.user_id ?? fallbackId),
	firstName: (raw?.firstName ?? raw?.first_name ?? "").trim(),
	lastName: (raw?.lastName ?? raw?.last_name ?? "").trim(),
	name: raw?.name?.trim() || undefined,
	email: raw?.email?.trim() || undefined,
	phone: raw?.phone?.trim() || undefined,
	avatarUrl: (raw?.avatarUrl ?? raw?.avatar_url)?.trim() || undefined,
});

const mapWorkflowStage = (
	raw: RawWorkflowStage,
	index: number,
): WorkflowStage => {
	const id = asString(raw.id || `stage-${index + 1}`);
	const approvers = asArray(raw.approvers).map((approver, approverIndex) => {
		const userId = asString(
			approver.userId ??
				approver.user_id ??
				approver.user?.id ??
				approver.approver?.id,
		);

		return {
			id: asString(approver.id || `${id}-approver-${approverIndex + 1}`),
			stageId: asString(approver.stageId ?? approver.stage_id ?? id),
			user: mapWorkflowUser(approver.user ?? approver.approver, userId),
			isExternalApprover: Boolean(
				approver.isExternalApprover ?? approver.is_external_approver,
			),
		};
	});

	const minApprovals = asNumber(
		raw.minApprovals ?? raw.min_approvals,
		approvers.length > 0 ? 1 : 0,
	);
	const rawStrategy = normalizeWorkflowStatus(raw.strategy);
	const strategy =
		rawStrategy === "ANY" || rawStrategy === "ALL" || rawStrategy === "SOME"
			? rawStrategy
			: deriveStrategy(minApprovals, approvers.length);

	return {
		id,
		name:
			(raw.name ?? raw.stageName ?? raw.stage_name)?.trim() ||
			`Stage ${index + 1}`,
		stageOrder: asNumber(raw.stageOrder ?? raw.stage_order, index + 1),
		strategy,
		minApprovals,
		approvers,
		isExpanded: true,
	};
};

const mapTemplateUser = (
	raw: RawWorkflowTemplateUser,
	index: number,
): WorkflowTemplateUser => ({
	id: asString(raw.id || `workflow-user-${index + 1}`),
	templateId: asString(raw.templateId ?? raw.template_id),
	createdAt: asString(raw.createdAt ?? raw.created_at),
	user: mapWorkflowUser(raw.user),
});

export const mapWorkflowTemplate = (
	raw: RawWorkflowTemplate,
): WorkflowTemplate => ({
	id: asString(raw.id),
	name: raw.name?.trim() || "Unnamed workflow",
	description: raw.description?.trim() || "",
	isActive: Boolean(raw.isActive ?? raw.is_active),
	appId: asString(raw.appId ?? raw.app_id),
	workspaceId: asString(raw.workspaceId ?? raw.workspace_id) || undefined,
	metaData_1: raw.metaData_1?.trim() || "",
	metaData_2: raw.metaData_2?.trim() || "",
	metaData_3: raw.metaData_3?.trim() || "",
	createdAt: asString(raw.createdAt ?? raw.created_at),
	updatedAt: asString(raw.updatedAt ?? raw.updated_at),
	stages: asArray(raw.stages)
		.map(mapWorkflowStage)
		.sort((a, b) => a.stageOrder - b.stageOrder),
	app: {
		id: asString(raw.app?.id),
		key: raw.app?.key?.trim() || "",
		name: raw.app?.name?.trim() || "",
	},
	createdBy: mapWorkflowUser(raw.createdBy ?? raw.created_by),
	updatedBy: mapWorkflowUser(raw.updatedBy ?? raw.updated_by),
	workflowUsers: asArray(raw.workflowUsers ?? raw.workFlowUsers).map(
		mapTemplateUser,
	),
});

const normalizeWorkflowList = (value: unknown): WorkflowListResponse => {
	if (Array.isArray(value)) {
		return {
			data: (value as RawWorkflowTemplate[]).map(mapWorkflowTemplate),
			meta: { totalPages: value.length > 0 ? 1 : 0 },
		};
	}

	if (!isRecord(value)) {
		return { data: [], meta: { totalPages: 0 } };
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
	const totalPages = asNumber(
		meta.totalPages ?? meta.total_pages,
		rows.length > 0 ? 1 : 0,
	);

	return {
		data: (rows as RawWorkflowTemplate[]).map(mapWorkflowTemplate),
		meta: { totalPages },
	};
};

const toAttachApiPayload = (
	input: AttachWorkflowInput,
): RawAttachWorkflowPayload => ({
	recordRef: input.recordRef,
	recordType: input.recordType,
	workflowId: input.workflowId,
	flowType: input.flowType,
	saveAsTemplate: input.saveAsTemplate,
	templateName: input.templateName,
	stages: input.stages?.flatMap((stage) =>
		stage.approvers.map((approver) => ({
			order: stage.stageOrder,
			name: stage.name,
			approverId: approver.user.id,
		})),
	),
});

export const getWorkflowErrorMessage = (
	error: unknown,
	fallback: string,
): string => {
	if (axios.isAxiosError(error)) {
		const response = error.response?.data;

		if (isRecord(response)) {
			const directMessage = response.message ?? response.error;
			if (typeof directMessage === "string" && directMessage.trim()) {
				return directMessage;
			}

			if (isRecord(response.data)) {
				const nestedMessage = response.data.message ?? response.data.error;
				if (typeof nestedMessage === "string" && nestedMessage.trim()) {
					return nestedMessage;
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
		const response = await ServerAxios.get(WORKFLOW_URL, {
			params: {
				...params,
				filters: JSON.stringify(params.filters ?? {}),
			},
		});

		return normalizeWorkflowList(response.data);
	},

	getById: async (id: string): Promise<WorkflowTemplate> => {
		const response = await ServerAxios.get(
			`${WORKFLOW_URL}/${encodeURIComponent(id)}`,
		);

		return mapWorkflowTemplate(unwrapData<RawWorkflowTemplate>(response.data));
	},

	create: async (payload: CreateWorkflowPayload) => {
		const response = await ServerAxios.post(WORKFLOW_URL, payload);
		return response.data;
	},

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
		const response = await ServerAxios.post(ASSIGN_USERS_URL, {
			templateId,
			userIds,
		});
		return response.data;
	},

	getUsers: async (): Promise<WorkflowUser[]> => {
		const response = await ServerAxios.get(USERS_URL, {
			params: { profile: "all" },
		});
		const users = unwrapData<RawWorkflowUser[]>(response.data);

		return asArray(users).map((user) => mapWorkflowUser(user));
	},

	getUserOptions: async (): Promise<
		Array<{ value: string; label: string }>
	> => {
		const users = await workflowApi.getUsers();
		return users.map((user) => ({
			value: user.id,
			label: getFullName(user),
		}));
	},

	listReusable: async (
		scope: WorkflowScope,
		moduleName: string,
	): Promise<WorkflowSummary[]> => {
		const response = await ServerAxios.get(WORKFLOW_URL, {
			params: {
				scope,
				module: moduleName,
			},
		});

		const workflows = unwrapData<RawWorkflowTemplate[]>(response.data);

		return asArray(workflows).map((workflow) => ({
			id: asString(workflow.id),
			name: workflow.name?.trim() || "Unnamed workflow",
			description: workflow.description?.trim() || undefined,
			stageCount: asNumber(
				workflow.stageCount,
				asArray(workflow.stages).length,
			),
			approverCount: asNumber(workflow.approverCount),
			flowType: workflow.flowType ?? "SEQUENTIAL",
			updatedAt:
				(workflow.updatedAt ?? workflow.updated_at)?.trim() || undefined,
		}));
	},

	getBuilderStages: async (id: string): Promise<WorkflowStage[]> => {
		const workflow = await workflowApi.getById(id);

		return workflow.stages.map((stage) => ({
			...stage,
			minApprovals: stage.minApprovals ?? 1,
			approvers: stage.approvers.map((approver) => ({
				...approver,
				user: { ...approver.user },
			})),
		}));
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
		const users = unwrapData<RawWorkflowUser[]>(response.data);

		return asArray(users).map((user) => mapWorkflowUser(user));
	},

	attach: async (input: AttachWorkflowInput): Promise<void> => {
		await ServerAxios.post(ATTACH_WORKFLOW_URL, toAttachApiPayload(input));
	},
};
