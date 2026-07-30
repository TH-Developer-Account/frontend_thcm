import type {
	CreateWorkflowPayload,
	WorkflowBasics,
	WorkflowGenErrors,
	WorkflowRow,
	WorkflowStage,
	WorkflowStageErrors,
	WorkflowTemplate,
} from "../types/types";
import { deriveStrategy } from "./strategy";
import { getFullName } from "./user";

export const buildWorkflowPayload = (
	basics: WorkflowBasics,
	stages: WorkflowStage[],
	workspaceId: string,
): CreateWorkflowPayload => ({
	name: basics.name.trim(),
	appId: basics.app,
	workspaceId,
	isActive: basics.isActive,
	description: basics.description.trim(),
	metaData_1: basics.category || "",
	metaData_2: "",
	metaData_3: "",
	stages: stages.map((stage) => {
		const baseStage = {
			name: stage.name.trim(),
			stageOrder: stage.stageOrder,
			strategy: stage.strategy,
			approverIds: stage.approvers.map((approver) => ({
				userId: approver.user.id,
				name: getFullName(approver.user),
				email: approver.user.email?.trim() ?? "",
				isExternalApprover: approver.isExternalApprover,
			})),
		};

		return stage.strategy === "SOME"
			? {
					...baseStage,
					minApprovals: Number(stage.minApprovals) || 1,
				}
			: baseStage;
	}),
});

export const validateWorkflowBasics = (
	basics: WorkflowBasics,
): WorkflowGenErrors => {
	const errors: WorkflowGenErrors = {};

	if (!basics.name.trim()) errors.name = "Workflow name is required";
	if (!basics.app.trim()) errors.app = "App is required";

	return errors;
};

export const validateWorkflow = (
	stages: WorkflowStage[],
): {
	formError?: string;
	stageErrors: WorkflowStageErrors[];
} => {
	const stageErrors: WorkflowStageErrors[] = stages.map(() => ({}));

	if (stages.length === 0) {
		return {
			formError: "Please add at least one stage",
			stageErrors,
		};
	}

	stages.forEach((stage, index) => {
		if (!stage.name.trim()) {
			stageErrors[index].name = "Stage name is required";
		}

		if (!stage.approvers.length) {
			stageErrors[index].approvers =
				`Stage ${stage.stageOrder} must have at least one approver`;
		}

		if (stage.strategy === "SOME") {
			const quorum = Number(stage.minApprovals || 0);

			if (quorum < 1) {
				stageErrors[index].minApprovals =
					`Stage ${stage.stageOrder} must have at least 1 approver`;
			}

			if (quorum > stage.approvers.length) {
				stageErrors[index].minApprovals =
					`Stage ${stage.stageOrder} quorum cannot exceed approver count`;
			}
		}
	});

	return { stageErrors };
};

export const updateStageField = <K extends keyof WorkflowStage>(
	stages: WorkflowStage[],
	stageId: string,
	key: K,
	value: WorkflowStage[K],
): WorkflowStage[] =>
	stages.map((stage) => {
		if (stage.id !== stageId) return stage;

		if (key !== "minApprovals") {
			return { ...stage, [key]: value };
		}

		const minApprovals = Number(value);
		return {
			...stage,
			minApprovals,
			strategy: deriveStrategy(minApprovals, stage.approvers.length),
		};
	});

export const toggleStageExpanded = (
	stages: WorkflowStage[],
	stageId: string,
): WorkflowStage[] =>
	stages.map((stage) =>
		stage.id === stageId ? { ...stage, isExpanded: !stage.isExpanded } : stage,
	);

export const removeStageApprover = (
	stages: WorkflowStage[],
	stageId: string,
	approverId: string,
): WorkflowStage[] =>
	stages.map((stage) => {
		if (stage.id !== stageId) return stage;

		const approvers = stage.approvers.filter(
			(approver) => approver.id !== approverId,
		);

		return {
			...stage,
			approvers,
			minApprovals: Math.min(stage.minApprovals ?? 1, approvers.length || 1),
		};
	});

export const addStageApprover = (
	stages: WorkflowStage[],
	stageId: string,
	approver: WorkflowStage["approvers"][number],
): WorkflowStage[] =>
	stages.map((stage) =>
		stage.id !== stageId ||
		stage.approvers.some((item) => item.user.id === approver.user.id)
			? stage
			: { ...stage, approvers: [...stage.approvers, approver] },
	);

export const mapWorkflowRows = (workflows: WorkflowTemplate[]): WorkflowRow[] =>
	workflows.map((workflow) => ({
		id: workflow.id,
		name: workflow.name,
		appName: workflow.app?.name || "",
		createdBy: getFullName(workflow.createdBy, ""),
		isActive: workflow.isActive,
		lastUpdated: workflow.updatedAt,
		updatedBy: getFullName(workflow.updatedBy, ""),
		workflowUsers: workflow.workflowUsers.map(({ user }) => ({
			id: user.id,
		})),
		workflowType: workflow.workflowType,
	}));
export const mapBasics = (data: any) => ({
	id: data?.id ?? "",
	name: data?.name ?? "",
	description: data?.description ?? "",
	workspaceId: data?.workspaceId ?? "",
	app: data?.appId ?? "",
	appDesc: data?.app?.name ?? data?.appDesc ?? "",
	isActive: data?.isActive ?? true,
	category: data?.metaData_1 ?? "",
	metaData_2: data?.metaData_2 ?? "",
	metaData_3: data?.metaData_3 ?? "",
});
export const mapStages = (stages: any[] = []): WorkflowStage[] => {
	return stages
		.slice()
		.sort((a, b) => Number(a.stageOrder) - Number(b.stageOrder))
		.map((stage, index) => ({
			id: stage?.id ?? `stage-${index + 1}`,
			name: stage?.name ?? `Stage ${index + 1}`,
			stageOrder: stage?.stageOrder ?? index + 1,
			strategy: stage?.strategy ?? "ANY",
			minApprovals: Number(stage?.minApprovals ?? 1),
			isExpanded: true,
			approvers:
				stage?.approvers?.map((approver: any) => ({
					id: approver?.id ?? approver?.userId ?? approver?.user?.id,
					stageId: approver?.stageId ?? stage?.id ?? "",
					user: {
						id: approver?.user?.id ?? approver?.userId ?? "",
						firstName:
							approver?.user?.firstName ??
							approver?.user?.first_name ??
							approver?.firstName ??
							"",
						lastName:
							approver?.user?.lastName ??
							approver?.user?.last_name ??
							approver?.lastName ??
							"",
						email: approver?.user?.email ?? approver?.email ?? "",
					},
					isExternalApprover: Boolean(approver?.isExternalApprover),
				})) ?? [],
		}));
};
export const getDefaultMapStages = (): WorkflowStage[] => [
	{
		id: "stage-1",
		stageOrder: 1,
		name: "Recommender",
		strategy: "ANY",
		approvers: [],
		minApprovals: 1,
		isExpanded: true,
	},
	// {
	// 	id: "stage-2",
	// 	stageOrder: 2,
	// 	name: "Checker",
	// 	strategy: "ANY",
	// 	approvers: [],
	// 	minApprovals: 1,
	// 	isExpanded: false,
	// },
	{
		id: "stage-2",
		stageOrder: 2,
		name: "Approver",
		strategy: "ANY",
		approvers: [],
		minApprovals: 1,
		isExpanded: false,
	},
];

export type WorkflowStagePosition = "PAST" | "CURRENT" | "FUTURE";

export type WorkflowUserIdentity = {
	id?: string | null;
	email?: string | null;
};

export type WorkflowApprovalLike<
	TUser extends WorkflowUserIdentity = WorkflowUserIdentity,
> = {
	id?: string | null;
	status?: string | null;
	isExternalApprover?: boolean | null;
	approver?: TUser | null;
};

export type WorkflowRuntimeStageLike<
	TApproval extends WorkflowApprovalLike = WorkflowApprovalLike,
> = {
	id?: string | null;
	stageOrder: number;
	stageName?: string | null;
	status?: string | null;
	isCurrentIteration?: boolean | null;
	approvals?: readonly TApproval[] | null;
};

export type ActiveWorkflowLike<
	TStage extends WorkflowRuntimeStageLike = WorkflowRuntimeStageLike,
> = {
	isActive?: boolean | null;
	status?: string | null;
	currentStage?: number | null;
	stages?: readonly TStage[] | null;
};

export type WorkflowApprovalEntry<
	TStage extends WorkflowRuntimeStageLike,
	TApproval extends WorkflowApprovalLike,
> = {
	stage: TStage;
	approval: TApproval;
	position: WorkflowStagePosition;
};

const normalizeWorkflowUserValue = (value: unknown): string =>
	String(value ?? "")
		.trim()
		.toLowerCase();

export const isSameWorkflowUser = (
	first?: WorkflowUserIdentity | null,
	second?: WorkflowUserIdentity | null,
): boolean => {
	const firstId = normalizeWorkflowUserValue(first?.id);
	const secondId = normalizeWorkflowUserValue(second?.id);

	if (firstId && secondId && firstId === secondId) {
		return true;
	}

	const firstEmail = normalizeWorkflowUserValue(first?.email);
	const secondEmail = normalizeWorkflowUserValue(second?.email);

	return Boolean(firstEmail && secondEmail && firstEmail === secondEmail);
};

const getWorkflowStagePosition = (
	stage: WorkflowRuntimeStageLike,
	currentStageOrder?: number | null,
): WorkflowStagePosition => {
	// A stage from an older workflow iteration is always historical.
	if (stage.isCurrentIteration === false) {
		return "PAST";
	}

	if (currentStageOrder != null) {
		if (stage.stageOrder < currentStageOrder) return "PAST";
		if (stage.stageOrder > currentStageOrder) return "FUTURE";
		return "CURRENT";
	}

	// Fallback for responses that do not contain currentStage.
	const status = normalizeWorkflowUserValue(stage.status).toUpperCase();

	if (status === "IN_PROGRESS") return "CURRENT";
	if (["APPROVED", "COMPLETED", "REJECTED", "CLARIFIED"].includes(status)) {
		return "PAST";
	}

	return "FUTURE";
};

/**
 * Extracts complete approver information from one active workflow.
 *
 * Pass the logged-in user when user-specific flags are required. The returned
 * approval entries are intentionally not deduplicated because one person may
 * appear in multiple stages or workflow iterations.
 */
export const getWorkflowApproverData = <
	TUser extends WorkflowUserIdentity,
	TApproval extends WorkflowApprovalLike<TUser>,
	TStage extends WorkflowRuntimeStageLike<TApproval>,
>(
	activeWorkflow:
		| (ActiveWorkflowLike<TStage> & { stages?: readonly TStage[] | null })
		| null
		| undefined,
	user?: WorkflowUserIdentity | null,
) => {
	const stages = [...(activeWorkflow?.stages ?? [])].sort(
		(first, second) => first.stageOrder - second.stageOrder,
	);

	const stageEntries = stages.map((stage) => ({
		stage,
		position: getWorkflowStagePosition(stage, activeWorkflow?.currentStage),
	}));

	const pastStages = stageEntries
		.filter(({ position }) => position === "PAST")
		.map(({ stage }) => stage);

	const currentStage = stageEntries.find(
		({ position }) => position === "CURRENT",
	)?.stage;

	const futureStages = stageEntries
		.filter(({ position }) => position === "FUTURE")
		.map(({ stage }) => stage);

	const allApprovals: WorkflowApprovalEntry<TStage, TApproval>[] =
		stageEntries.flatMap(({ stage, position }) =>
			(stage.approvals ?? []).map((approval) => ({
				stage,
				approval,
				position,
			})),
		);

	const pastApprovals = allApprovals.filter(
		({ position }) => position === "PAST",
	);
	const currentApprovals = allApprovals.filter(
		({ position }) => position === "CURRENT",
	);
	const futureApprovals = allApprovals.filter(
		({ position }) => position === "FUTURE",
	);

	const getUniqueUsers = (
		entries: readonly WorkflowApprovalEntry<TStage, TApproval>[],
	): TUser[] => {
		const seenUsers = new Set<string>();
		const users: TUser[] = [];

		entries.forEach(({ approval }, index) => {
			const approver = approval.approver;
			if (!approver) return;

			const id = normalizeWorkflowUserValue(approver.id);
			const email = normalizeWorkflowUserValue(approver.email);
			const key = id ? `id:${id}` : email ? `email:${email}` : `row:${index}`;

			if (seenUsers.has(key)) return;

			seenUsers.add(key);
			users.push(approver);
		});

		return users;
	};

	const allUsers = getUniqueUsers(allApprovals);
	const pastUsers = getUniqueUsers(pastApprovals);
	const currentUsers = getUniqueUsers(currentApprovals);
	const futureUsers = getUniqueUsers(futureApprovals);

	const userApprovals = user
		? allApprovals.filter(({ approval }) =>
				isSameWorkflowUser(approval.approver, user),
			)
		: [];

	const pastUserApprovals = userApprovals.filter(
		({ position }) => position === "PAST",
	);

	const currentUserApprovals = userApprovals.filter(
		({ position }) => position === "CURRENT",
	);

	const futureUserApprovals = userApprovals.filter(
		({ position }) => position === "FUTURE",
	);

	const currentUserApproval = currentUserApprovals[0]?.approval;

	const hasStatus = (status: string): boolean =>
		userApprovals.some(
			({ approval }) =>
				normalizeWorkflowUserValue(approval.status).toUpperCase() === status,
		);

	const isCurrentStagePending = currentUserApprovals.some(
		({ approval }) =>
			normalizeWorkflowUserValue(approval.status).toUpperCase() === "PENDING",
	);

	const isWorkflowInProgress =
		activeWorkflow?.isActive !== false &&
		normalizeWorkflowUserValue(activeWorkflow?.status).toUpperCase() ===
			"IN_PROGRESS";

	return {
		stages,
		pastStages,
		currentStage,
		futureStages,

		allApprovals,
		pastApprovals,
		currentApprovals,
		futureApprovals,

		allUsers,
		pastUsers,
		currentUsers,
		futureUsers,

		userApprovals,
		pastUserApprovals,
		currentUserApprovals,
		futureUserApprovals,
		currentUserApproval,

		isPartOfWorkflow: userApprovals.length > 0,
		isInCurrentStage: currentUserApprovals.length > 0,
		canActNow: isWorkflowInProgress && isCurrentStagePending,
		hasApproved: hasStatus("APPROVED"),
		hasRejected: hasStatus("REJECTED"),
		hasPendingApproval: hasStatus("PENDING"),
		isExternalApprover: currentUserApproval?.isExternalApprover === true,
		wasExternalApprover: userApprovals.some(
			({ approval }) => approval.isExternalApprover === true,
		),
	};
};
