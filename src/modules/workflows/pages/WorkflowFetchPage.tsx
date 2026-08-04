import { WorkflowEntrySection } from "../components/WorkflowEntrySection";
import { WorkflowTemplateBuilder } from "../components/WorkflowTemplateBuilder";
import {
	useWorkflowFetch,
	type UseWorkflowFetchOptions,
} from "../context/useWorkflowFetch";

export type WorkflowFetchPageProps = UseWorkflowFetchOptions;

export function WorkflowFetchPage(props: WorkflowFetchPageProps) {
	const {
		screen,
		createdWorkflows,
		loading,
		customising,
		error,
		attaching,
		initialStages,
		builderTitle,
		loadWorkflows,
		handleAttach,
		handleEditAndAttach,
		handleCreate,
		handleCancel,
		handleBuilderAttach,
	} = useWorkflowFetch(props);

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
			createdWorkflows={createdWorkflows}
			onAttach={handleAttach}
			onEditAndAttach={handleEditAndAttach}
			onCreate={handleCreate}
			disabled={attaching || customising}
		/>
	);
}
