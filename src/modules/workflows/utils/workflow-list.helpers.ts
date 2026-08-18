import type {
	WorkflowListPersonApi,
	WorkflowRow,
	WorkflowTemplate,
	WorkflowTemplateApi,
	WorkflowUser,
} from "../types/types";

const normalizeWorkflowPerson = (
	person: WorkflowListPersonApi | null | undefined,
	fallbackId: string,
): WorkflowUser => ({
	id: person?.id ?? fallbackId,
	firstName: person?.first_name ?? "",
	lastName: person?.last_name ?? "",
	email: person?.email ?? "",
});

const getWorkflowPersonName = (
	person: WorkflowUser | null | undefined,
): string => {
	if (!person) return "—";

	const fullName = [person.firstName?.trim(), person.lastName?.trim()]
		.filter(Boolean)
		.join(" ");

	return fullName || person.email?.trim() || "—";
};

/**
 * Converts the snake-case workflow object returned by GET /work-flow into
 * the normalized WorkflowTemplate used throughout the frontend.
 */
export const normalizeWorkflowTemplate = (
	workflow: WorkflowTemplateApi,
): WorkflowTemplate => ({
	id: String(workflow.id),
	name: workflow.name?.trim() || "Unnamed workflow",
	description: workflow.description ?? "",
	isActive: Boolean(workflow.isActive),
	appId: workflow.appId,
	workspaceId: workflow.workspaceId,

	metaData_1: workflow.metaData_1 ?? "",
	metaData_2: workflow.metaData_2 ?? "",
	metaData_3: workflow.metaData_3 ?? "",

	createdAt: workflow.created_at,
	updatedAt: workflow.updated_at,

	app: {
		id: workflow.app?.id ?? workflow.appId,
		key: workflow.app?.key ?? "",
		name: workflow.app?.name ?? "—",
	},

	createdBy: normalizeWorkflowPerson(
		workflow.created_by,
		workflow.created_by_id,
	),

	updatedBy: normalizeWorkflowPerson(
		workflow.updated_by,
		workflow.updated_by_id,
	),

	stages: (workflow.stages ?? []).map((stage) => ({
		id: stage.id,
		name: stage.name,
		stageOrder: stage.stageOrder,
		strategy: stage.strategy,

		/*
		 * The API returns null for ANY and ALL strategies. The normalized
		 * WorkflowStage requires a number.
		 */
		minApprovals: stage.minApprovals ?? 0,

		approvers: (stage.approvers ?? []).map((approver) => ({
			id: approver.id,
			stageId: approver.stageId,
			user: approver.user,
			isExternalApprover: approver.isExternalApprover,
		})),
	})),

	workflowUsers: (workflow.workFlowUsers ?? []).map((assignment) => ({
		id: assignment.id,
		templateId: assignment.templateId,
		createdAt: assignment.created_at,
		user: assignment.user,
	})),

	ownerType: workflow.ownerType,
	isReusable: workflow.isReusable,
	workflowType: workflow.workflowType,
});

/**
 * Converts multiple raw API workflows into normalized frontend templates.
 */
export const normalizeWorkflowTemplates = (
	workflows: readonly WorkflowTemplateApi[] = [],
): WorkflowTemplate[] => workflows.map(normalizeWorkflowTemplate);

/**
 * Maps normalized templates into the flat records required by DataTable.
 *
 * This function never filters workflows. One input template always produces
 * one table row.
 */
export const mapWorkflowRows = (
	workflows: readonly WorkflowTemplate[] = [],
): WorkflowRow[] =>
	workflows.map((workflow) => ({
		id: String(workflow.id),
		name: workflow.name?.trim() || "Unnamed workflow",
		appName: workflow.app?.name?.trim() || "—",
		createdBy: getWorkflowPersonName(workflow.createdBy),
		isActive: Boolean(workflow.isActive),
		lastUpdated: workflow.updatedAt ?? workflow.createdAt,
		updatedBy: getWorkflowPersonName(workflow.updatedBy),

		workflowUsers: (workflow.workflowUsers ?? [])
			.map((assignment) => assignment.user?.id)
			.filter((id): id is string => Boolean(id))
			.map((id) => ({ id })),

		ownerType: workflow.ownerType,
		workflowType: workflow.workflowType,
		created_by_id: workflow.createdBy?.id,
		updated_by_id: workflow.updatedBy?.id,
		appId: workflow.appId,
	}));
