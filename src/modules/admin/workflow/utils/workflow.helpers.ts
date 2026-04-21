import type {
	CreateWorkflowPayload,
	WorkflowBasics,
	WorkflowStage,
	WorkflowCard,
	WorkFlowTemplate,
	ApprovalRule,
	StrategyType,
	Approver,
	WorkflowGenErrors,
	WorkflowStageErrors,
} from "../types/workflow.types";

export const buildWorkflowPayload = (
	basics: WorkflowBasics,
	stages: WorkflowStage[],
	workspaceId: string,
): CreateWorkflowPayload => {
	return {
		name: basics.name.trim(),
		appId: basics.app,
		workspaceId,
		isActive: basics.isActive,
		description: basics.description,
		metaData_1: "",
		metaData_2: "",
		metaData_3: "",
		stages: stages.map((stage) => {
			const isQuorum = stage.strategy === "SOME";

			const baseStage = {
				name: stage.name,
				stageOrder: stage.stageOrder,
				strategy: stage.strategy,
				approverIds: stage.approvers.map((approver) => approver.userId),
			};

			if (isQuorum) {
				return {
					...baseStage,
					minApprovals: Number(stage.minApprovals) || 1,
				};
			}

			return baseStage;
		}),
	};
};

export const validateWorkflowBasics = (
	basics: WorkflowBasics,
): WorkflowGenErrors => {
	const errors: WorkflowGenErrors = {};

	if (!basics.name.trim()) {
		errors.name = "Workflow name is required";
	}

	if (!basics.app.trim()) {
		errors.app = "App is required";
	}

	// only add if description is required
	// if (!basics.description.trim()) {
	// 	errors.description = "Description is required";
	// }

	return errors;
};

// export const validateWorkflow = (
// 	stages: WorkflowStage[],
// ): {
// 	formError?: string;
// 	stageErrors: WorkflowStageErrors[];
// } => {
// 	const stageErrors: WorkflowStageErrors[] = stages.map(() => ({}));

// 	stages.forEach((stage, index) => {
// 		if (!stage.approvers.length) {
// 			stageErrors[index].approvers =
// 				`Stage ${stage.stageOrder} must have at least one approver`;
// 		}

// 		if (stage.strategy === "SOME") {
// 			const quorum = Number(stage.minApprovals || 0);

// 			if (quorum < 1) {
// 				stageErrors[index].minApprovals =
// 					`Stage ${stage.stageOrder} must have at least 1 approver`;
// 			}

// 			if (quorum > stage.approvers.length) {
// 				stageErrors[index].minApprovals =
// 					`Stage ${stage.stageOrder} quorum cannot exceed approver count`;
// 			}
// 		}
// 	});

// 	return {
// 		stageErrors,
// 	};
// };
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

	return {
		formError: undefined,
		stageErrors,
	};
};
function deriveStrategy(
	minApprovals: unknown,
	totalApprovers: number,
): StrategyType {
	if (minApprovals === 1) return "ANY";
	if (minApprovals === totalApprovers) return "ALL";
	return "SOME";
}

export const updateStageField = <K extends keyof WorkflowStage>(
	stages: WorkflowStage[],
	stageId: string,
	key: K,
	value: WorkflowStage[K],
): WorkflowStage[] => {
	let strategy = "All" as ApprovalRule;

	return stages.map((stage) => {
		if (key === "minApprovals") {
			strategy = deriveStrategy(value, stage.approvers.length) as ApprovalRule;
		}
		return stage.id === stageId ? { ...stage, [key]: value, strategy } : stage;
	});
};

export const toggleStageExpanded = (
	stages: WorkflowStage[],
	stageId: string,
): WorkflowStage[] => {
	return stages.map((stage) =>
		stage.id === stageId ? { ...stage, isExpanded: !stage.isExpanded } : stage,
	);
};

export const removeStageApprover = (
	stages: WorkflowStage[],
	stageId: string,
	approverId: string,
): WorkflowStage[] => {
	return stages.map((stage) =>
		stage.id === stageId
			? {
					...stage,
					approvers: stage.approvers.filter((a) => a.id !== approverId),
				}
			: stage,
	);
};

export const addStageApprover = (
	stages: WorkflowStage[],
	stageId: string,
	approver: Approver,
): WorkflowStage[] => {
	return stages.map((stage) => {
		if (stage.id !== stageId) return stage;

		const alreadyExists = stage.approvers.some((a) => a.id === approver.id);
		if (alreadyExists) return stage;

		return {
			...stage,
			approvers: [...stage.approvers, approver],
		};
	});
};

export const mapWorkflows = (data: WorkFlowTemplate[]): WorkflowCard[] => {
	return data.map((workflow) => ({
		id: workflow.id,
		name: workflow.name,
		app_name: workflow.app?.name || "",
		created_by: workflow.created_by
			? `${workflow.created_by.first_name} ${workflow.created_by.last_name}`
			: "",
		isActive: workflow.isActive,
		last_updated: workflow.updated_at,
		updated_by: workflow.updated_by
			? `${workflow.updated_by.first_name} ${workflow.updated_by.last_name}`
			: "",
		workflowUsers: workflow.workFlowUsers.map((each) => ({
			id: each.user.id,
		})),
	}));
};
