import { useCallback, useMemo, useReducer } from "react";

import type {
	ApprovalRule,
	WorkflowBuilderOptions,
	WorkflowBuilderPayload,
	WorkflowBuilderState,
	WorkflowExecutionMode,
	WorkflowStage,
	WorkflowUser,
} from "../types/types";
import { deriveStrategy } from "../utils/strategy";

type WorkflowBuilderAction =
	| { type: "ADD_STAGE"; approver: WorkflowUser; name: string }
	| { type: "REMOVE_STAGE"; id: string }
	| { type: "RENAME_STAGE"; id: string; name: string }
	| { type: "MOVE_STAGE"; id: string; direction: "up" | "down" }
	| { type: "ADD_APPROVER"; stageId: string; approver: WorkflowUser }
	| { type: "REMOVE_APPROVER"; stageId: string; userId: string }
	| {
			type: "SET_MIN_APPROVALS";
			stageId: string;
			minApprovals: number;
	  }
	| {
			type: "SET_STRATEGY";
			stageId: string;
			strategy: ApprovalRule;
	  }
	| { type: "SET_FLOW_TYPE"; flowType: WorkflowExecutionMode }
	| { type: "SET_SAVE_AS_TEMPLATE"; value: boolean }
	| { type: "SET_TEMPLATE_NAME"; value: string };

const createStageId = (): string =>
	typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `stage-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const reorderStages = (stages: WorkflowStage[]): WorkflowStage[] =>
	stages.map((stage, index) => ({ ...stage, stageOrder: index + 1 }));

const reducer = (
	state: WorkflowBuilderState,
	action: WorkflowBuilderAction,
): WorkflowBuilderState => {
	switch (action.type) {
		case "ADD_STAGE": {
			const stageId = createStageId();

			return {
				...state,
				stages: [
					...state.stages,
					{
						id: stageId,
						name: action.name,
						stageOrder: state.stages.length + 1,
						strategy: "ANY",
						minApprovals: 1,
						approvers: [
							{
								id: action.approver.id,
								stageId,
								user: { ...action.approver },
								isExternalApprover: false,
							},
						],
					},
				],
			};
		}

		case "REMOVE_STAGE":
			return {
				...state,
				stages: reorderStages(
					state.stages.filter((stage) => stage.id !== action.id),
				),
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

			return { ...state, stages: reorderStages(stages) };
		}

		case "ADD_APPROVER":
			return {
				...state,
				stages: state.stages.map((stage) => {
					if (
						stage.id !== action.stageId ||
						stage.approvers.some(
							(approver) => approver.user.id === action.approver.id,
						)
					) {
						return stage;
					}

					const approvers = [
						...stage.approvers,
						{
							id: action.approver.id,
							stageId: stage.id,
							user: { ...action.approver },
							isExternalApprover: false,
						},
					];

					return {
						...stage,
						approvers,
						strategy: deriveStrategy(stage.minApprovals, approvers.length),
					};
				}),
			};

		case "REMOVE_APPROVER":
			return {
				...state,
				stages: state.stages.map((stage) => {
					if (stage.id !== action.stageId) return stage;

					const approvers = stage.approvers.filter(
						(approver) => approver.user.id !== action.userId,
					);
					const minApprovals = Math.min(
						stage.minApprovals,
						approvers.length || 1,
					);

					return {
						...stage,
						approvers,
						minApprovals,
						strategy: deriveStrategy(minApprovals, approvers.length),
					};
				}),
			};

		case "SET_MIN_APPROVALS":
			return {
				...state,
				stages: state.stages.map((stage) => {
					if (stage.id !== action.stageId) return stage;

					const minApprovals = Math.min(
						Math.max(action.minApprovals, 1),
						stage.approvers.length || 1,
					);

					return {
						...stage,
						minApprovals,
						strategy: deriveStrategy(minApprovals, stage.approvers.length),
					};
				}),
			};

		case "SET_STRATEGY":
			return {
				...state,
				stages: state.stages.map((stage) =>
					stage.id === action.stageId
						? { ...stage, strategy: action.strategy }
						: stage,
				),
			};

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
};

const createInitialState = (
	options: WorkflowBuilderOptions,
): WorkflowBuilderState => ({
	stages:
		options.initialStages?.map((stage, index) => {
			const stageId = createStageId();

			// Supports older initial-stage data containing `approver`
			const legacyApprover = (
				stage as WorkflowStage & {
					approver?: WorkflowUser;
				}
			).approver;

			const approvers = Array.isArray(stage.approvers)
				? stage.approvers
				: legacyApprover
					? [
							{
								id: legacyApprover.id,
								stageId,
								user: { ...legacyApprover },
								isExternalApprover: false,
							},
						]
					: [];

			const minApprovals = Math.min(
				Math.max(stage.minApprovals ?? 1, 1),
				approvers.length || 1,
			);

			return {
				...stage,
				id: stageId,
				name: stage.name || `Stage ${index + 1}`,
				stageOrder: index + 1,
				minApprovals,
				strategy:
					stage.strategy ?? deriveStrategy(minApprovals, approvers.length),
				approvers: approvers.map((approver) => ({
					...approver,
					stageId,
					user: { ...approver.user },
				})),
			};
		}) ?? [],
	flowType: options.initialFlowType ?? "SEQUENTIAL",
	saveAsTemplate: options.initialSaveAsTemplate ?? false,
	templateName: options.initialTemplateName ?? "",
});

export function useWorkflowBuilder(options: WorkflowBuilderOptions = {}) {
	const [state, dispatch] = useReducer(reducer, options, createInitialState);

	const addStage = useCallback((approver: WorkflowUser, name: string) => {
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

	const addApprover = useCallback((stageId: string, approver: WorkflowUser) => {
		dispatch({ type: "ADD_APPROVER", stageId, approver });
	}, []);

	const removeApprover = useCallback((stageId: string, userId: string) => {
		dispatch({ type: "REMOVE_APPROVER", stageId, userId });
	}, []);

	const setMinApprovals = useCallback(
		(stageId: string, minApprovals: number) => {
			dispatch({ type: "SET_MIN_APPROVALS", stageId, minApprovals });
		},
		[],
	);

	const setStrategy = useCallback((stageId: string, strategy: ApprovalRule) => {
		dispatch({ type: "SET_STRATEGY", stageId, strategy });
	}, []);

	const setFlowType = useCallback((flowType: WorkflowExecutionMode) => {
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
			state.stages.every(
				(stage) =>
					stage.name.trim().length > 0 &&
					stage.approvers.length > 0 &&
					stage.minApprovals >= 1 &&
					stage.minApprovals <= stage.approvers.length,
			) &&
			(!state.saveAsTemplate || state.templateName.trim().length > 0),
		[state],
	);

	const buildPayload = useCallback(
		(sourceRecordRef: string): WorkflowBuilderPayload => ({
			stages: state.stages.map(
				({ name, stageOrder, strategy, minApprovals, approvers }) => ({
					name: name.trim(),
					stageOrder,
					strategy,
					minApprovals,
					approvers: approvers.map((approver) => ({
						...approver,
						user: { ...approver.user },
					})),
				}),
			),
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
		addApprover,
		removeApprover,
		setMinApprovals,
		setStrategy,
		setFlowType,
		setSaveAsTemplate,
		setTemplateName,
		isValid,
		buildPayload,
	};
}
