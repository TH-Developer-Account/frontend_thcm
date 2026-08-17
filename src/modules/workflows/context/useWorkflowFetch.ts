import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../../context/Auth/useAuth";
import { getStoredAppId } from "../../marketing/activity-planner/helpers/localstorage";
import { workflowApi } from "../api/workflow.api";
import { useAttachWorkflowMutation } from "../context/useWorkflowMutations";
import type {
	AttachWorkflowInput,
	CreateWorkflowPayload,
	PendingWorkflowSelection,
	SaveMode,
	WorkflowBuilderPayload,
	WorkflowExecutionMode,
	WorkflowListScope,
	WorkflowSummary,
	WorkflowTemplate,
} from "../types/types";
import { getFullName } from "../utils/user";
import { mapStages } from "../utils/workflow.helpers";

type ScreenState =
	| { view: "entry" }
	| {
			view: "builder";
			sourceWorkflow?: WorkflowTemplate;
			initialFlowType: WorkflowExecutionMode;
			initialSaveAsTemplate: boolean;
	  };

export type UseWorkflowFetchOptions = {
	sourceRecordRef: string;
	recordType: string;
	onWorkflowSelected?: (
		selection: PendingWorkflowSelection,
	) => void | Promise<void>;
	onWorkflowAttached?: () => void;
};

type BuildWorkflowPayloadOptions = {
	payload: WorkflowBuilderPayload;
	source?: WorkflowTemplate;
	workspaceId: string;
	appId: string;
	name: string;
	isReusable: boolean;
};

const getCreatedWorkflowId = (value: unknown): string | null => {
	let current = value;

	for (let depth = 0; depth < 3; depth += 1) {
		if (
			typeof current !== "object" ||
			current === null ||
			Array.isArray(current)
		) {
			return null;
		}

		const record = current as Record<string, unknown>;
		const id = record.id ?? record.workflowId ?? record.templateId;

		if (typeof id === "string" || typeof id === "number") {
			return String(id);
		}

		current = record.data ?? record.workflow;
	}

	return null;
};

const buildWorkflowPayload = ({
	payload,
	source,
	workspaceId,
	appId,
	name,
	isReusable,
}: BuildWorkflowPayloadOptions): CreateWorkflowPayload => ({
	name,
	workspaceId: source?.workspaceId ?? workspaceId,
	isActive: true,
	appId: source?.appId ?? appId,
	description: source?.description ?? "",
	metaData_1: source?.metaData_1 ?? "",
	metaData_2: source?.metaData_2 ?? "",
	metaData_3: source?.metaData_3 ?? "",
	isReusable,
	stages: payload.stages.map((stage) => ({
		name: stage.name.trim(),
		stageOrder: stage.stageOrder,
		strategy: stage.strategy,
		minApprovals:
			stage.strategy === "SOME" ? Number(stage.minApprovals) || 1 : undefined,
		approverIds: stage.approvers.map((approver) => ({
			userId: approver.user.id,
			name: getFullName(approver.user),
			email: approver.user.email?.trim() ?? "",
			isExternalApprover: approver.isExternalApprover,
		})),
	})),
});

export function useWorkflowFetch({
	sourceRecordRef,
	recordType,
	onWorkflowSelected,
	onWorkflowAttached,
}: UseWorkflowFetchOptions) {
	const { workspaceId: authWorkspaceId } = useAuth();

	const workspaceId = authWorkspaceId ?? "";
	const appId = useMemo(() => getStoredAppId() ?? "", []);

	const [screen, setScreen] = useState<ScreenState>({
		view: "entry",
	});

	const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);

	const [selectedFilter, setSelectedFilter] =
		useState<WorkflowListScope>("CREATED_BY_ME");

	const [loading, setLoading] = useState(true);
	const [customising, setCustomising] = useState(false);
	const [error, setError] = useState<unknown>(null);
	const [expandedWorkflowId, setExpandedWorkflowId] = useState<string | null>(
		null,
	);
	const [loadingWorkflowId, setLoadingWorkflowId] = useState<string | null>(
		null,
	);
	const [workflowDetails, setWorkflowDetails] = useState<
		Record<string, WorkflowTemplate>
	>({});
	const [workflowDetailErrors, setWorkflowDetailErrors] = useState<
		Record<string, string>
	>({});

	const attachMutation = useAttachWorkflowMutation();

	const getWorkflowDetail = useCallback(
		async (workflowId: string): Promise<WorkflowTemplate> => {
			const cached = workflowDetails[workflowId];
			if (cached) return cached;

			setLoadingWorkflowId(workflowId);
			setWorkflowDetailErrors((current) => {
				const next = { ...current };
				delete next[workflowId];
				return next;
			});

			try {
				const detail = await workflowApi.getById(workflowId);
				const normalizedDetail: WorkflowTemplate = {
					...detail,
					stages: mapStages(detail.stages),
				};
				setWorkflowDetails((current) => ({
					...current,
					[workflowId]: normalizedDetail,
				}));
				return normalizedDetail;
			} catch (nextError) {
				setWorkflowDetailErrors((current) => ({
					...current,
					[workflowId]:
						nextError instanceof Error
							? nextError.message
							: "Unable to load workflow stages.",
				}));
				throw nextError;
			} finally {
				setLoadingWorkflowId((current) =>
					current === workflowId ? null : current,
				);
			}
		},
		[workflowDetails],
	);

	const handleToggleWorkflow = useCallback(
		async (workflowId: string): Promise<void> => {
			if (expandedWorkflowId === workflowId) {
				setExpandedWorkflowId(null);
				return;
			}

			setExpandedWorkflowId(workflowId);
			if (!workflowDetails[workflowId]) {
				try {
					await getWorkflowDetail(workflowId);
				} catch {
					// The expanded row renders its own scoped error and can be retried.
				}
			}
		},
		[expandedWorkflowId, getWorkflowDetail, workflowDetails],
	);

	const ensureAssignmentContext = useCallback((): void => {
		if (!sourceRecordRef.trim()) {
			throw new Error("A source record is required to assign a workflow.");
		}

		if (!workspaceId || !appId) {
			throw new Error(
				"Workspace and application information are required to assign a workflow.",
			);
		}
	}, [appId, sourceRecordRef, workspaceId]);

	const loadWorkflows = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			let result: WorkflowSummary[];

			switch (selectedFilter) {
				case "ASSIGNED_TO_ME": {
					result = await workflowApi.listReusable("assigned", recordType);
					break;
				}

				case "ALL": {
					const [created, assigned] = await Promise.all([
						workflowApi.listReusable("created", recordType),
						workflowApi.listReusable("assigned", recordType),
					]);

					const uniqueWorkflows = new Map<string, WorkflowSummary>();

					[...created, ...assigned].forEach((workflow) => {
						uniqueWorkflows.set(workflow.id, workflow);
					});

					result = Array.from(uniqueWorkflows.values());
					break;
				}

				case "CREATED_BY_ME":
				default: {
					result = await workflowApi.listReusable("created", recordType);
					break;
				}
			}

			setWorkflows(result);
		} catch (nextError) {
			setWorkflows([]);
			setError(nextError);
		} finally {
			setLoading(false);
		}
	}, [recordType, selectedFilter]);

	const handleFilterChange = useCallback(
		(nextFilter: WorkflowListScope): void => {
			setExpandedWorkflowId(null);
			setSelectedFilter(nextFilter);
		},
		[],
	);

	useEffect(() => {
		void loadWorkflows();
	}, [loadWorkflows]);

	const completeSelection = useCallback(
		async (selection: PendingWorkflowSelection): Promise<void> => {
			if (onWorkflowSelected) {
				await onWorkflowSelected(selection);
				return;
			}

			ensureAssignmentContext();

			const input: AttachWorkflowInput = {
				...selection.attachInput,
				recordRef: sourceRecordRef,
				recordType,
				workspaceId,
				appId,
			};

			await attachMutation.mutateAsync(input);
			onWorkflowAttached?.();
		},
		[
			appId,
			attachMutation,
			ensureAssignmentContext,
			onWorkflowAttached,
			onWorkflowSelected,
			recordType,
			sourceRecordRef,
			workspaceId,
		],
	);

	const handleAttach = useCallback(
		async (workflow: WorkflowSummary): Promise<void> => {
			if (!onWorkflowSelected) {
				ensureAssignmentContext();

				await attachMutation.mutateAsync({
					recordRef: sourceRecordRef,
					recordType,
					workspaceId,
					appId,
					workflowId: workflow.id,
				});

				onWorkflowAttached?.();
				return;
			}

			setCustomising(true);

			try {
				const sourceWorkflow = await getWorkflowDetail(workflow.id);

				const previewStages = mapStages(sourceWorkflow.stages);

				if (previewStages.length === 0) {
					throw new Error("The selected workflow does not contain any stages.");
				}

				await completeSelection({
					key: `workflow:${workflow.id}`,
					name: workflow.name,
					previewStages,
					mode: "existing",
					attachInput: {
						workflowId: workflow.id,
					},
					isEditedExistingWorkflow: false,
				});
			} finally {
				setCustomising(false);
			}
		},
		[
			appId,
			attachMutation,
			completeSelection,
			ensureAssignmentContext,
			onWorkflowAttached,
			onWorkflowSelected,
			recordType,
			sourceRecordRef,
			workspaceId,
			getWorkflowDetail,
		],
	);

	const handleEditAndAttach = useCallback(
		async (workflow: WorkflowSummary, saveMode: SaveMode): Promise<void> => {
			setCustomising(true);

			try {
				const sourceWorkflow = await getWorkflowDetail(workflow.id);

				setScreen({
					view: "builder",
					sourceWorkflow,
					initialFlowType: workflow.flowType,
					initialSaveAsTemplate: saveMode === "template",
				});
			} finally {
				setCustomising(false);
			}
		},
		[getWorkflowDetail],
	);

	const handleCreate = useCallback((): void => {
		setScreen({
			view: "builder",
			initialFlowType: "SEQUENTIAL",
			initialSaveAsTemplate: false,
		});
	}, []);

	const handleCancel = useCallback((): void => {
		setScreen({ view: "entry" });
	}, []);

	const handleBuilderAttach = useCallback(
		async (payload: WorkflowBuilderPayload): Promise<void> => {
			if (screen.view !== "builder") {
				return;
			}

			const sourceWorkflow = screen.sourceWorkflow;

			const resolvedWorkspaceId = sourceWorkflow?.workspaceId ?? workspaceId;

			const resolvedAppId = sourceWorkflow?.appId ?? appId;

			if (!resolvedWorkspaceId || !resolvedAppId) {
				throw new Error(
					"Workspace or application information is required to create this workflow.",
				);
			}

			const isReusable = payload.saveAsTemplate;

			const workflowName = isReusable
				? payload.templateName?.trim()
				: `One-time workflow - ${sourceRecordRef}`;

			if (!workflowName) {
				throw new Error("A workflow name is required.");
			}

			/*
			 * Both modes create a workflow first:
			 *
			 * Use once:
			 * - Generated name
			 * - isReusable: false
			 *
			 * Save as template:
			 * - User-entered name
			 * - isReusable: true
			 */
			const created = await workflowApi.createUser(
				buildWorkflowPayload({
					payload,
					source: sourceWorkflow,
					workspaceId: resolvedWorkspaceId,
					appId: resolvedAppId,
					name: workflowName,
					isReusable,
				}),
			);

			const workflowId = getCreatedWorkflowId(created);

			if (!workflowId) {
				throw new Error("The workflow was created without an id.");
			}

			await completeSelection({
				key: `workflow:${workflowId}`,
				name: workflowName,
				previewStages: payload.stages,
				mode: sourceWorkflow ? "customized" : "new",
				attachInput: {
					workflowId,
				},
				isEditedExistingWorkflow: Boolean(sourceWorkflow),
			});
		},
		[appId, completeSelection, screen, sourceRecordRef, workspaceId],
	);

	const initialStages = useMemo(
		() =>
			screen.view === "builder" && screen.sourceWorkflow
				? mapStages(screen.sourceWorkflow.stages)
				: [],
		[screen],
	);

	const builderTitle =
		screen.view === "builder" && screen.sourceWorkflow
			? "Customise approval workflow"
			: "Create approval workflow";

	return {
		screen,
		workflows,
		selectedFilter,
		loading,
		customising,
		error,
		expandedWorkflowId,
		loadingWorkflowId,
		workflowDetails,
		workflowDetailErrors,
		attaching: attachMutation.loading,
		initialStages,
		builderTitle,
		loadWorkflows,
		handleFilterChange,
		handleToggleWorkflow,
		handleAttach,
		handleEditAndAttach,
		handleCreate,
		handleCancel,
		handleBuilderAttach,
	};
}
