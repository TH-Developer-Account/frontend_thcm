/**
 * Single source of truth for workflow-module types.
 *
 * Replaces:
 *   - types/types.ts            (kept, now the consolidated file)
 *   - types/workflow.types.ts   (DELETE — was a near-identical copy)
 *   - the type declarations that lived inside api/workflow.api.ts
 *   - the helper types that lived inside utils/approvalWorkflow.helpers.ts
 *
 * Cross-cutting primitives (ApprovalRule, WorkflowUser, WorkflowListScope,
 * status unions, ApprovalStageLike, ...) live in ./shared.types and are
 * re-exported from here, so every existing `from "../types/types"` import
 * keeps working.
 *
 * Component-local prop types (WorkflowFetchPageProps,
 * WorkflowTemplateBuilderProps, ...) intentionally stay next to their
 * component.
 */

import type {
	ApiDateString,
	ApprovalRule,
	ApprovalStageLike,
	WorkflowApprovalLike,
	WorkflowApprovalStatus,
	WorkflowCreationScope,
	WorkflowExecutionMode,
	WorkflowListScope,
	WorkflowOwnerType,
	WorkflowStageStatus,
	WorkflowUser,
} from "./shared.types";

export * from "./shared.types";

/**
 * @deprecated Identical to WorkflowListScope. Kept only so existing imports
 * keep compiling — switch them to WorkflowListScope and delete this alias.
 */
export type WorkflowScope = WorkflowListScope;

/* -------------------------------------------------------------------------- */
/* Core domain                                                                 */
/* -------------------------------------------------------------------------- */

export type WorkflowType = "USERCREATED";

export type WorkflowApp = {
	id: string;
	key: string;
	name: string;
};

export type WorkflowSelectOption = {
	value: string;
	label: string;
};

export type WorkflowApprover = {
	id: string;
	stageId: string;
	user: WorkflowUser;
	isExternalApprover: boolean;
};

export type WorkflowApproval = {
	id: string;
	stageId: string;
	approverId: string;
	status: WorkflowApprovalStatus;
	actedAt: ApiDateString | null;
	reason: string | null;
	approver: WorkflowUser;
	comments: unknown[];
};

export type WorkflowStage = {
	id: string;
	stageOrder: number;
	name: string;
	strategy: ApprovalRule;
	minApprovals: number;
	approvers: WorkflowApprover[];
	isExpanded?: boolean;

	workflowId?: string | null;
	iteration?: number;
	isCurrentIteration?: boolean;
	startedAt?: ApiDateString | null;
	dueAt?: ApiDateString | null;
	escalatedTo?: string | null;
	status?: WorkflowStageStatus;
	approvals?: WorkflowApproval[];
	stageName?: string;
};

/* -------------------------------------------------------------------------- */
/* Raw API shapes (GET /work-flow) — backend snake_case is kept on purpose     */
/* -------------------------------------------------------------------------- */

export type WorkflowListPersonApi = {
	id?: string;
	first_name?: string;
	last_name?: string;
	email?: string;
	designation?: string | null;
};

/** A stage approver as returned by the listing endpoint. */
export type WorkflowListApproverApi = WorkflowApprover & {
	userId: string;
};

export type WorkflowListStageApi = {
	id: string;
	name: string;
	templateId: string;
	stageOrder: number;
	strategy: ApprovalRule;

	/**
	 * The listing endpoint returns null for strategies that do not require
	 * an explicit minimum.
	 */
	minApprovals: number | null;

	approvers: WorkflowListApproverApi[];
};

export type WorkflowTemplateUserApi = {
	id: string;
	templateId: string;
	userId: string;
	created_at: ApiDateString;
	user: WorkflowUser;
};

/**
 * Exact workflow shape returned by GET /work-flow.
 *
 * This type intentionally keeps the backend's snake-case property names.
 * The API layer converts it into WorkflowTemplate.
 */
export type WorkflowTemplateApi = {
	id: string;
	name: string;
	description: string;
	workspaceId: string;
	isActive: boolean;
	appId: string;

	metaData_1: string;
	metaData_2: string;
	metaData_3: string;

	created_by_id: string;
	updated_by_id: string;
	created_at: ApiDateString;
	updated_at: ApiDateString;

	stages: WorkflowListStageApi[];
	app: WorkflowApp;

	created_by: WorkflowListPersonApi;
	updated_by: WorkflowListPersonApi;

	/**
	 * Notice the capital F: this matches the current backend response.
	 */
	workFlowUsers: WorkflowTemplateUserApi[];

	/**
	 * These are optional until the backend returns them from GET /work-flow.
	 */
	ownerType?: WorkflowOwnerType;
	isReusable?: boolean;

	/**
	 * @deprecated Use ownerType.
	 */
	workflowType?: string;
};

/** Reusable-workflow item returned by the module/reusable listing calls. */
export type WorkflowSummaryApi = {
	id: string | number;
	name?: string;
	description?: string;
	stageCount?: number;
	approverCount?: number;
	flowType?: WorkflowExecutionMode;
	updatedAt?: string;
	updated_at?: string;
	stages?: unknown[];
};

/** User item returned by GET /users?search=... */
export type WorkflowApproverSearchApi = {
	id: string | number;
	first_name?: string;
	last_name?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
};

export type ApiEnvelope<T> = {
	success?: boolean;
	data: T;
	message?: string;
};

/* -------------------------------------------------------------------------- */
/* Normalized frontend workflow types                                          */
/* -------------------------------------------------------------------------- */

export type WorkflowTemplateUser = {
	id: string;
	templateId: string;
	createdAt: ApiDateString;
	user: WorkflowUser;
};

export type WorkflowTemplate = {
	id: string;
	name: string;
	description: string;
	isActive: boolean;
	appId: string;
	workspaceId?: string;

	metaData_1: string;
	metaData_2: string;
	metaData_3: string;

	createdAt: ApiDateString;
	updatedAt: ApiDateString;

	stages: WorkflowStage[];
	app: WorkflowApp;

	createdBy: WorkflowUser;
	updatedBy: WorkflowUser;

	workflowUsers: WorkflowTemplateUser[];

	/**
	 * ADMIN is an app-level template that can be assigned to other users.
	 * USER is a personal template owned by its creator.
	 *
	 * Optional until the listing endpoint returns this field.
	 */
	ownerType?: WorkflowOwnerType;

	/**
	 * Optional until the listing endpoint returns this field.
	 */
	isReusable?: boolean;

	/**
	 * @deprecated Use ownerType.
	 */
	workflowType?: string;
};

export type WorkflowRow = {
	id: string;
	name: string;
	appName: string;
	createdBy: string;
	isActive: boolean;
	lastUpdated: ApiDateString;
	updatedBy: string;
	workflowUsers: Array<Pick<WorkflowUser, "id">>;
	ownerType?: WorkflowOwnerType;

	/**
	 * @deprecated Use ownerType. (Both list mappers assign this, so it has to
	 * exist on the type; drop the assignment and this field together.)
	 */
	workflowType?: string;

	// Raw ids carried through by mapWorkflowRows. Nothing in the module reads
	// them — remove after a repo-wide search if nothing outside does either.
	created_by_id?: string;
	updated_by_id?: string;
	appId?: string;
};

export type WorkflowSummary = {
	id: string;
	name: string;
	stageCount: number;
	flowType: WorkflowExecutionMode;
	description?: string;
	approverCount?: number;
	updatedAt?: ApiDateString;
};

/* -------------------------------------------------------------------------- */
/* Workflow listing                                                            */
/* -------------------------------------------------------------------------- */

export type WorkflowModuleListParams = {
	appId: string;
	appKey: string;
	moduleKey: string;
	scope: "MODULE" | "USER" | "ALL";
};

export type WorkflowListParams = {
	page: number;
	pageSize: number;
	search?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	filters?: Record<string, string[]>;
	scope?: WorkflowListScope;
};

export type WorkflowListMeta = {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

/**
 * Raw response returned by GET /work-flow.
 */
export type WorkflowListApiResponse = {
	data: WorkflowTemplateApi[];
	meta: WorkflowListMeta;
};

/**
 * Normalized response returned by workflowApi.list().
 */
export type WorkflowListResponse = {
	data: WorkflowTemplate[];
	meta: WorkflowListMeta;
};

/* -------------------------------------------------------------------------- */
/* Create / update payloads                                                    */
/* -------------------------------------------------------------------------- */

export type WorkflowApproverPayload = {
	userId: string;
	name: string;
	email: string;
	isExternalApprover: boolean;
	designation?: string | null;
};

export type WorkflowStagePayload = {
	name: string;
	stageOrder: number;
	strategy: ApprovalRule;
	approverIds: WorkflowApproverPayload[];
	minApprovals?: number;
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

	stages: WorkflowStagePayload[];

	/**
	 * APP creates an admin/application template.
	 * USER creates a personal template.
	 */
	scope?: WorkflowCreationScope;

	/**
	 * True creates a reusable template.
	 * False creates an ad-hoc, one-time workflow.
	 */
	isReusable?: boolean;

	/**
	 * @deprecated The backend does not persist this field.
	 * Use scope instead.
	 */
	workflowType?: WorkflowType;
};

/* -------------------------------------------------------------------------- */
/* Form state (create / edit wizard)                                           */
/* -------------------------------------------------------------------------- */

export type WorkflowBasics = {
	name: string;
	app: string;
	appDesc?: string;
	category?: string;
	isActive: boolean;
	description: string;

	/**
	 * APP is available only when the caller can administer the selected app.
	 * USER creates a personal workflow owned by the current user.
	 */
	scope?: WorkflowCreationScope;
};

export type WorkflowGenErrors = Partial<Record<keyof WorkflowBasics, string>>;

export type WorkflowStageErrors = Partial<Record<keyof WorkflowStage, string>>;

/** Shared by WorkFlowProps, WorkflowGenForm's props and any custom form. */
export type WorkflowBasicChangeHandler = <K extends keyof WorkflowBasics>(
	key: K,
	value: WorkflowBasics[K],
) => void;

/**
 * Shared by WorkFlowProps, WorkflowStagesForm's props and
 * CustomizedWorkflowSection's handler (each used to re-declare this).
 */
export type WorkflowStageChangeHandler = <K extends keyof WorkflowStage>(
	stageId: string,
	key: K,
	value: WorkflowStage[K],
) => void;

export type WorkFlowProps = {
	currentStep: number;
	goNext: () => void;
	goBack: () => void;
	basics: WorkflowBasics;
	stages: WorkflowStage[];
	currentUserId: string;

	onBasicChange: WorkflowBasicChangeHandler;
	onStageChange: WorkflowStageChangeHandler;

	onToggleStage: (stageId: string) => void;

	onRemoveApprover: (stageId: string, approverId: string) => void;

	onAddApprover: (stageId: string, approver: WorkflowApprover) => void;

	/**
	 * Removes an entire stage (all of its approvers along with it) — distinct
	 * from onRemoveApprover, which only removes one approver from within a
	 * stage.
	 */
	onRemoveStage: (stageId: string) => void;

	/**
	 * Clears every configured stage and approver, leaving a single blank
	 * stage to start over from. Distinct from onRemoveStage, which removes
	 * one stage at a time.
	 */
	onResetStages: () => void;

	onSubmit: () => void;
	loading?: boolean;
	onAddStage: () => void;

	appOptions: WorkflowSelectOption[];
	categoryOptions?: WorkflowSelectOption[];
	showCategory?: boolean;
	showStatus?: boolean;
};

/* -------------------------------------------------------------------------- */
/* Workflow builder                                                            */
/* -------------------------------------------------------------------------- */

export type WorkflowBuilderStage = {
	name: string;
	stageOrder: number;
	strategy: ApprovalRule;
	minApprovals: number;
	approvers: WorkflowApprover[];
};

export type WorkflowBuilderPayload = {
	stages: WorkflowBuilderStage[];

	flowType: WorkflowExecutionMode;
	saveAsTemplate: boolean;
	templateName?: string;
	sourceRecordRef: string;

	/**
	 * Vendor reference number used to tag a saved workflow that was NOT saved
	 * as a named template. Set by WorkflowTemplateBuilder — this replaces its
	 * local `WorkflowBuilderPayloadWithVendorRef` type.
	 */
	referenceNumber?: string;
};

export type WorkflowBuilderState = {
	stages: WorkflowStage[];
	flowType: WorkflowExecutionMode;
	saveAsTemplate: boolean;
	templateName: string;
};

export type WorkflowBuilderOptions = {
	initialStages?: WorkflowStage[];
	initialFlowType?: WorkflowExecutionMode;
	initialSaveAsTemplate?: boolean;
	initialTemplateName?: string;
};

/* -------------------------------------------------------------------------- */
/* Workflow attachment                                                         */
/* -------------------------------------------------------------------------- */

export type WorkflowAttachCriteria = {
	workflowId?: string;
	stages?: WorkflowBuilderStage[];
	flowType?: WorkflowExecutionMode;
	saveAsTemplate?: boolean;
	templateName?: string;
};

export type AttachWorkflowInput = WorkflowAttachCriteria & {
	recordRef: string;
	recordType: string;
	workspaceId: string;
	appId: string;
};

export type PendingWorkflowSelection = {
	key: string;
	name: string;
	previewStages: WorkflowStage[];
	attachInput: WorkflowAttachCriteria;
	isEditedExistingWorkflow: boolean;
	saveAsTemplate?: boolean;
	templateName?: string;
	mode?: string;
};

/* -------------------------------------------------------------------------- */
/* Runtime API payloads (previously declared inside workflow.api.ts)           */
/* -------------------------------------------------------------------------- */

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
	strategy: ApprovalRule;
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

/* -------------------------------------------------------------------------- */
/* Approval workflow (runtime instances + approval table)                      */
/* -------------------------------------------------------------------------- */

export type ApprovalTableApproverRow = {
	id: string;
	name: string;
	email: string;
	isExternal?: boolean;
	minApprovals?: string | number | null;
	status?: string | null;
	designation?: string | null;
};

export type ApprovalTableRow = {
	id: string;
	stageOrder: number;
	stageName: string;
	strategy: string;
	minApprovals?: string | number | null;
	totalApprovers?: string | number | null;
	status?: string | null;
	name?: string;
	email?: string;
	approvers?: ApprovalTableApproverRow[];
	designation?: string | null;

	/**
	 * @deprecated Nothing reads or writes this (each approver row carries its
	 * own isExternal). Was typed with the `Boolean` wrapper type. Remove
	 * after a repo-wide search.
	 */
	isExternal?: boolean;
};

export type MapWorkflowStagesOptions = {
	showOnlyCurrentStageStatus?: boolean;
};

export type WorkflowActivityEntry = {
	entryType?: string | null;
	action?: string | null;
	reason?: string | null;
	message?: string | null;
	isActiveWorkflow?: boolean | null;
	workflowId?: string | null;
	createdAt?: ApiDateString | null;
};

export type WorkflowTemplateReference = Pick<
	WorkflowTemplate,
	"id" | "name" | "description"
>;

export type ActiveWorkflow = {
	id: string;
	templateId: string;
	workspaceId: string;
	eventProposalId: string;
	iteration: number;
	isActive: boolean;
	workflowType: "STANDARD";
	status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
	currentStage: number;
	created_at: ApiDateString;
	updated_at: ApiDateString;
	template: WorkflowTemplateReference;
	stages: WorkflowStage[];
};

/* -------------------------------------------------------------------------- */
/* Approver-data helper types (previously in approvalWorkflow.helpers.ts)      */
/* -------------------------------------------------------------------------- */

export type WorkflowStagePosition = "PAST" | "CURRENT" | "FUTURE";

export type WorkflowUserIdentity = {
	id?: string | null;
	email?: string | null;
	name?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	first_name?: string | null;
	last_name?: string | null;
	designation?: string | null;
};

export type ActiveWorkflowLike<
	TStage extends ApprovalStageLike = ApprovalStageLike,
> = {
	id?: string | null;
	iteration?: number | null;
	isActive?: boolean | null;
	status?: string | null;
	currentStage?: number | null;
	stages?: readonly TStage[] | null;
};

export type WorkflowApprovalEntry<
	TStage extends ApprovalStageLike,
	TApproval extends WorkflowApprovalLike,
> = {
	stage: TStage;
	approval: TApproval;
	user: TApproval["approver"] | TApproval["user"] | null | undefined;
	position: WorkflowStagePosition;
};

/* -------------------------------------------------------------------------- */
/* UI state                                                                    */
/* -------------------------------------------------------------------------- */

/** @deprecated-ish: only useWorkflowEntry uses this. Prefer WorkflowListScope. */
export type WorkflowFilter = "created" | "assigned";

export type SaveMode = "template" | "once";

export type EntryMode = "idle" | "fetch" | "create";

export type BudgetCategory = {
	value: string;
	label: string;
	min: number | null;
	max: number | null;
};
