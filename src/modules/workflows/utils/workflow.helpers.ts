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
