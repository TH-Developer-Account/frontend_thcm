import { useCallback, useMemo, useReducer } from "react";

export interface Approver {
	id: string;
	name: string;
	email: string;
}

export interface WorkflowStage {
	id: string;
	name: string;
	approver: Approver;
}

export type FlowType = "SEQUENTIAL" | "PARALLEL";

export interface WorkflowBuilderPayload {
	stages: Array<{ name: string; approver: Approver }>;
	flowType: FlowType;
	saveAsTemplate: boolean;
	templateName?: string;
	sourceRecordRef: string;
}

export interface WorkflowBuilderState {
	stages: WorkflowStage[];
	flowType: FlowType;
	saveAsTemplate: boolean;
	templateName: string;
}

export interface WorkflowBuilderOptions {
	initialStages?: WorkflowStage[];
	initialFlowType?: FlowType;
	initialSaveAsTemplate?: boolean;
	initialTemplateName?: string;
}

type WorkflowBuilderAction =
	| { type: "ADD_STAGE"; approver: Approver; name: string }
	| { type: "REMOVE_STAGE"; id: string }
	| { type: "RENAME_STAGE"; id: string; name: string }
	| { type: "MOVE_STAGE"; id: string; direction: "up" | "down" }
	| { type: "SET_FLOW_TYPE"; flowType: FlowType }
	| { type: "SET_SAVE_AS_TEMPLATE"; value: boolean }
	| { type: "SET_TEMPLATE_NAME"; value: string };

function createStageId(): string {
	return typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `stage-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function reducer(
	state: WorkflowBuilderState,
	action: WorkflowBuilderAction,
): WorkflowBuilderState {
	switch (action.type) {
		case "ADD_STAGE":
			return {
				...state,
				stages: [
					...state.stages,
					{
						id: createStageId(),
						name: action.name,
						approver: { ...action.approver },
					},
				],
			};
		case "REMOVE_STAGE":
			return {
				...state,
				stages: state.stages.filter((stage) => stage.id !== action.id),
			};
		case "RENAME_STAGE":
			return {
				...state,
				stages: state.stages.map((stage) =>
					stage.id === action.id ? { ...stage, name: action.name } : stage,
				),
			};
		case "MOVE_STAGE": {
			const index = state.stages.findIndex((stage) => stage.id === action.id);
			const nextIndex = action.direction === "up" ? index - 1 : index + 1;
			if (index < 0 || nextIndex < 0 || nextIndex >= state.stages.length) {
				return state;
			}
			const stages = [...state.stages];
			[stages[index], stages[nextIndex]] = [stages[nextIndex], stages[index]];
			return { ...state, stages };
		}
		case "SET_FLOW_TYPE":
			return { ...state, flowType: action.flowType };
		case "SET_SAVE_AS_TEMPLATE":
			return {
				...state,
				saveAsTemplate: action.value,
				templateName: action.value ? state.templateName : "",
			};
		case "SET_TEMPLATE_NAME":
			return { ...state, templateName: action.value };
	}
}

function createInitialState(
	options: WorkflowBuilderOptions,
): WorkflowBuilderState {
	return {
		stages:
			options.initialStages?.map((stage) => ({
				...stage,
				id: createStageId(),
				approver: { ...stage.approver },
			})) ?? [],
		flowType: options.initialFlowType ?? "SEQUENTIAL",
		saveAsTemplate: options.initialSaveAsTemplate ?? false,
		templateName: options.initialTemplateName ?? "",
	};
}

export function useWorkflowBuilder(options: WorkflowBuilderOptions = {}) {
	const [state, dispatch] = useReducer(reducer, options, createInitialState);

	const addStage = useCallback((approver: Approver, name: string) => {
		dispatch({ type: "ADD_STAGE", approver, name });
	}, []);
	const removeStage = useCallback((id: string) => {
		dispatch({ type: "REMOVE_STAGE", id });
	}, []);
	const renameStage = useCallback((id: string, name: string) => {
		dispatch({ type: "RENAME_STAGE", id, name });
	}, []);
	const moveStage = useCallback((id: string, direction: "up" | "down") => {
		dispatch({ type: "MOVE_STAGE", id, direction });
	}, []);
	const setFlowType = useCallback((flowType: FlowType) => {
		dispatch({ type: "SET_FLOW_TYPE", flowType });
	}, []);
	const setSaveAsTemplate = useCallback((value: boolean) => {
		dispatch({ type: "SET_SAVE_AS_TEMPLATE", value });
	}, []);
	const setTemplateName = useCallback((value: string) => {
		dispatch({ type: "SET_TEMPLATE_NAME", value });
	}, []);

	const isValid = useMemo(
		() =>
			state.stages.length > 0 &&
			state.stages.every((stage) => stage.name.trim().length > 0) &&
			(!state.saveAsTemplate || state.templateName.trim().length > 0),
		[state],
	);

	const buildPayload = useCallback(
		(sourceRecordRef: string): WorkflowBuilderPayload => ({
			stages: state.stages.map(({ name, approver }) => ({
				name: name.trim(),
				approver: { ...approver },
			})),
			flowType: state.flowType,
			saveAsTemplate: state.saveAsTemplate,
			templateName: state.saveAsTemplate
				? state.templateName.trim()
				: undefined,
			sourceRecordRef,
		}),
		[state],
	);

	return {
		state,
		addStage,
		removeStage,
		renameStage,
		moveStage,
		setFlowType,
		setSaveAsTemplate,
		setTemplateName,
		isValid,
		buildPayload,
	};
}
