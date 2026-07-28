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
					{ id: createStageId(), name: action.name, approver: action.approver },
				],
			};
		case "REMOVE_STAGE":
			return {
				...state,
				stages: state.stages.filter((s) => s.id !== action.id),
			};
		case "RENAME_STAGE":
			return {
				...state,
				stages: state.stages.map((s) =>
					s.id === action.id ? { ...s, name: action.name } : s,
				),
			};
		case "MOVE_STAGE": {
			const index = state.stages.findIndex((s) => s.id === action.id);
			if (index === -1) return state;
			const swapWith = action.direction === "up" ? index - 1 : index + 1;
			if (swapWith < 0 || swapWith >= state.stages.length) return state;
			const stages = [...state.stages];
			[stages[index], stages[swapWith]] = [stages[swapWith], stages[index]];
			return { ...state, stages };
		}
		case "SET_FLOW_TYPE":
			return { ...state, flowType: action.flowType };
		case "SET_SAVE_AS_TEMPLATE":
			return { ...state, saveAsTemplate: action.value };
		case "SET_TEMPLATE_NAME":
			return { ...state, templateName: action.value };
		default:
			return state;
	}
}

function toInitialState(initialStages?: WorkflowStage[]): WorkflowBuilderState {
	return {
		stages:
			initialStages?.map((stage) => ({
				...stage,
				approver: { ...stage.approver },
			})) ?? [],
		flowType: "SEQUENTIAL",
		saveAsTemplate: false,
		templateName: "",
	};
}

/**
 * Draft state + actions for building or customizing a workflow before it's
 * attached to a record. Pass `initialStages` when pre-filling from an
 * existing template the user chose to customize rather than build from
 * scratch (clone the stages in — never pass a live reference to the
 * original template's stage array).
 *
 * This hook only holds client-side draft state. Persisting the result
 * (creating a template row, snapshotting an active workflow, or both) is
 * the caller's responsibility, driven by the payload `buildPayload` returns.
 */
export function useWorkflowBuilder(initialStages?: WorkflowStage[]) {
	const [state, dispatch] = useReducer(reducer, initialStages, toInitialState);

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

	const isValid = useMemo(() => {
		if (state.stages.length === 0) return false;
		if (state.stages.some((stage) => stage.name.trim().length === 0))
			return false;
		if (state.saveAsTemplate && state.templateName.trim().length === 0)
			return false;
		return true;
	}, [state.stages, state.saveAsTemplate, state.templateName]);

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
