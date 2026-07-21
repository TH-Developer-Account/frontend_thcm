export type WorkflowStage = {
	id: string;
	stageOrder: number;
	name: string;
	strategy: ApprovalRule;
	minApprovals?: number;
	approvers: Approver[];
	isExpanded?: boolean;
};
export type BudgetCategory = {
	value: string;
	label: string;
	min: number | null;
	max: number | null;
};
export type WorkflowBasics = {
	name: string;
	app: string;
	appDesc?: string;
	category?: string;
	isActive: boolean;
	description: string;
};

export type StrategyType = "ANY" | "ALL" | "SOME";

export type WorkFlowProps = {
	currentStep: number;
	goNext: () => void;
	goBack: () => void;
	basics: WorkflowBasics;
	stages: WorkflowStage[];
	currentUserId: string;
	onBasicChange: <K extends keyof WorkflowBasics>(
		key: K,
		value: WorkflowBasics[K],
	) => void;
	onStageChange: <K extends keyof WorkflowStage>(
		stageId: string,
		key: K,
		value: WorkflowStage[K],
	) => void;
	onToggleStage: (stageId: string) => void;
	onRemoveApprover: (stageId: string, approverId: string) => void;
	onAddApprover: (stageId: string, approver: Approver) => void;
	onSubmit: () => void;
	loading?: boolean;
	onAddStage: () => void;
};

export type ApprovalRule = "ANY" | "ALL" | "SOME";
export type RejectionAction = "RETURN" | "CANCEL" | "ESCALATE";

export type WorkflowApproverPayload = {
	userId: string;
	name: string;
	email: string;
	isExternalApprover: boolean;
};

export type CreateWorkflowPayload = {
	name: string;
	workspaceId: string;
	isActive: boolean;
	appId: string;
	description: string;
	metaData_1: string;
	metaData_2: string;
	metaData_3: string;
	stages: {
		name: string;
		stageOrder: number;
		strategy: ApprovalRule;
		approverIds: WorkflowApproverPayload[];
		minApprovals?: number;
	}[];
};

export type Approver = {
	id: string;
	stageId: string;
	userId: string;
	user: User;
	isExternalApprover: boolean;
};

export interface WorkflowRow {
	id?: string;
	name: string;
	app_name: string;
	created_by: string;
	isActive: boolean;
	last_updated: string;
	updated_by: string;
	workflowUsers?: Record<string, string>[];
}

export type WorkflowCard = {
	id: string;
	name: string;
	app_name: string;
	created_by: string;
	isActive: boolean;
	last_updated: string;
	updated_by: string;
	workflowUsers: Record<string, string>[];
};

type User = {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
};

type StageStrategy = "ANY" | "ALL" | "SOME";

export type Stage = {
	id: string;
	name: string;
	templateId: string;
	stageOrder: number;
	strategy: StageStrategy;
	minApprovals: number | null;
	approvers: Approver[];
};

type App = {
	id: string;
	key: string;
	name: string;
};

type CreatedUpdatedBy = {
	first_name: string;
	last_name: string;
};

type workFlowUser = {
	created_at: string;
	id: string;
	templateId: string;
	user: User;
};

export type WorkFlowTemplate = {
	id: string;
	name: string;
	description: string;
	isActive: boolean;
	appId: string;
	metaData_1: string;
	metaData_2: string;
	metaData_3: string;
	created_at: string; // ISO date
	updated_at: string; // ISO date
	stages: Stage[];
	app: App;
	created_by: CreatedUpdatedBy;
	updated_by: CreatedUpdatedBy;
	workFlowUsers: workFlowUser[];
};

export type SubmitWorkflowParams = {
	basics: WorkflowBasics;
	stages: WorkflowStage[];
	workspaceId: string;
	path: string;
};

export type SubmitWorkflowResult = {
	data: unknown;
	message: string;
	payload: CreateWorkflowPayload;
};

export type WorkflowGenErrors = Partial<Record<keyof WorkflowBasics, string>>;
export type WorkflowStageErrors = Partial<Record<keyof WorkflowStage, string>>;
