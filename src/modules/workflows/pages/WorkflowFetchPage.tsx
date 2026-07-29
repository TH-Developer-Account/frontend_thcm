import { useCallback, useEffect, useState } from "react";

import { WorkflowEntrySection } from "../components/WorkflowEntrySection";
import { WorkflowTemplateBuilder } from "../components/WorkflowTemplateBuilder";
import { workflowApi } from "../api/workflow.api";
import { useAttachWorkflowMutation } from "../context/useWorkflowMutations";

import type {
	SaveMode,
	WorkflowSummary,
	WorkflowStage,
} from "../types/workflow.types";
import type { WorkflowBuilderPayload, WorkflowUser } from "../types/types";

type ScreenState =
	| { view: "entry" }
	| {
			view: "builder";
			initialStages?: WorkflowStage[];
			initialSaveAsTemplate?: boolean;
	  };

export type WorkflowFetchPageProps = {
	sourceRecordRef: string;
	recordType: string;
	onWorkflowAttached?: () => void;
};

const createLocalStageId = (): string =>
	typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `stage-${Date.now()}-${Math.random().toString(16).slice(2)}`;

/**
 * Reusable workflow attachment component.
 * The parent supplies only record identity; data fetching and mutations stay here.
 */
export function WorkflowFetchPage({
	sourceRecordRef,
	recordType,
	onWorkflowAttached,
}: WorkflowFetchPageProps) {
	const [screen, setScreen] = useState<ScreenState>({ view: "entry" });
	const [createdWorkflows, setCreatedWorkflows] = useState<WorkflowSummary[]>(
		[],
	);
	const [assignedWorkflows, setAssignedWorkflows] = useState<WorkflowSummary[]>(
		[],
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<unknown>(null);
	const attachMutation = useAttachWorkflowMutation();

	const loadWorkflows = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [created, assigned] = await Promise.all([
				workflowApi.listReusable("created", recordType),
				workflowApi.listReusable("assigned", recordType),
			]);
			setCreatedWorkflows(created);
			setAssignedWorkflows(assigned);
		} catch (nextError) {
			setError(nextError);
		} finally {
			setLoading(false);
		}
	}, [recordType]);

	useEffect(() => {
		void loadWorkflows();
	}, [loadWorkflows]);

	const handleAttach = async (workflow: WorkflowSummary) => {
		await attachMutation.mutateAsync({
			recordRef: sourceRecordRef,
			recordType,
			workflowId: workflow.id,
		});
		onWorkflowAttached?.();
	};

	const handleEditAndAttach = async (
		workflow: WorkflowSummary,
		saveMode: SaveMode,
	) => {
		const stages = await workflowApi.getBuilderStages(workflow.id);

		setScreen({
			view: "builder",
			initialStages: stages.map(
				(stage, index): WorkflowStage => ({
					id: createLocalStageId(),
					stageOrder: index + 1,
					name: stage.stageName,
					strategy: stage.strategy ?? "ANY",
					approvers: [...stage.approver],
					minApprovals:
						stage.minApprovals ?? Math.max(stage.approver.length, 1),
					isExpanded: true,
				}),
			),
			initialSaveAsTemplate: saveMode === "template",
		});
	};

	const handleSearchApprovers = (query: string): Promise<WorkflowUser[]> =>
		workflowApi.searchApprovers(query, recordType);

	const handleBuilderAttach = async (payload: WorkflowBuilderPayload) => {
		await attachMutation.mutateAsync({
			recordRef: sourceRecordRef,
			recordType,
			stages: payload.stages.map((stage, index) => ({
				order: index + 1,
				name: stage.name,
				approverId: stage.approver.id,
			})),
			flowType: payload.flowType,
			saveAsTemplate: payload.saveAsTemplate,
			templateName: payload.templateName,
		});
		onWorkflowAttached?.();
	};

	if (loading) {
		return <div role="status">Loading workflows...</div>;
	}

	if (error) {
		return (
			<div role="alert">
				Unable to load workflows.
				<button type="button" onClick={() => void loadWorkflows()}>
					Retry
				</button>
			</div>
		);
	}

	if (screen.view === "builder") {
		return (
			<WorkflowTemplateBuilder
				sourceRecordRef={sourceRecordRef}
				initialStages={screen.initialStages}
				initialSaveAsTemplate={screen.initialSaveAsTemplate}
				searchApprovers={handleSearchApprovers}
				onAttach={handleBuilderAttach}
				onCancel={() => setScreen({ view: "entry" })}
			/>
		);
	}

	return (
		<WorkflowEntrySection
			createdWorkflows={createdWorkflows}
			assignedWorkflows={assignedWorkflows}
			onAttach={handleAttach}
			onEditAndAttach={handleEditAndAttach}
		/>
	);
}
