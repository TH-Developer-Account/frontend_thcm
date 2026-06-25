export type EditingSection = "epc" | "crf" | "epf" | null;

export type PlannerMode =
	| "NORMAL"
	| "CLARIFICATION_EDIT"
	| "DEVIATION_EDIT"
	| "REPORT_FLOW";

export type PlannerEditableFields = {
	epc: string[];
	crf: string[];
	epf: string[];
};

export type PlannerPermissions = {
	isProposerUser: boolean;
	canActOnCurrentStage: boolean;

	canEditEpc: boolean;
	canEditCrf: boolean;
	canEditEpf: boolean;

	canShowApprovalWorkflow: boolean;
	canShowComments: boolean;
	canShowOutcome: boolean;
	canShowDeviation: boolean;
	canShowReport: boolean;

	canSubmitClarifiedUpdate: boolean;
	canSubmitDeviationUpdate: boolean;

	editableFields: PlannerEditableFields;
};
