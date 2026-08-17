import { useEffect } from "react";

import { WorkflowEntrySection } from "../components/WorkflowEntrySection";
import { WorkflowTemplateBuilder } from "../components/WorkflowTemplateBuilder";
import {
	useWorkflowFetch,
	type UseWorkflowFetchOptions,
} from "../context/useWorkflowFetch";

export type WorkflowFetchPageProps = UseWorkflowFetchOptions & {
	onScreenChange?: (view: "list" | "builder") => void;
};

export function WorkflowFetchPage({
	onScreenChange,
	...props
}: WorkflowFetchPageProps) {
	const {
		screen,
		workflows,
		selectedFilter,
		loading,
		customising,
		error,
		attaching,
		initialStages,
		builderTitle,
		loadWorkflows,
		handleFilterChange,
		handleAttach,
		handleCreate,
		handleCancel,
		handleBuilderAttach,
		expandedWorkflowId,
		loadingWorkflowId,
		workflowDetails,
		workflowDetailErrors,
		handleToggleWorkflow,
	} = useWorkflowFetch(props);

	useEffect(() => {
		onScreenChange?.(screen.view === "builder" ? "builder" : "list");
	}, [screen.view, onScreenChange]);

	if (error) {
		return (
			<div role="alert">
				<p>Unable to load workflows.</p>

				<button
					type="button"
					onClick={() => void loadWorkflows()}
					disabled={loading}
				>
					{loading ? "Loading..." : "Retry"}
				</button>
			</div>
		);
	}

	if (screen.view === "builder") {
		return (
			<WorkflowTemplateBuilder
				sourceRecordRef={props.sourceRecordRef}
				initialStages={initialStages}
				initialFlowType={screen.initialFlowType}
				initialSaveAsTemplate={screen.initialSaveAsTemplate}
				title={builderTitle}
				onAttach={handleBuilderAttach}
				onCancel={handleCancel}
				disabled={attaching}
			/>
		);
	}

	return (
		<WorkflowEntrySection
			sourceRecordRef={props.sourceRecordRef}
			workflows={workflows}
			selectedFilter={selectedFilter}
			onFilterChange={handleFilterChange}
			onAttach={handleAttach}
			expandedWorkflowId={expandedWorkflowId}
			loadingWorkflowId={loadingWorkflowId}
			workflowDetails={workflowDetails}
			workflowDetailErrors={workflowDetailErrors}
			onToggleWorkflow={handleToggleWorkflow}
			onCreate={handleCreate}
			disabled={attaching || customising}
			loading={loading}
		/>
	);
}
