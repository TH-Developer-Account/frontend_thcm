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
		handleEditAndAttach,
		handleCreate,
		handleCancel,
		handleBuilderAttach,
	} = useWorkflowFetch(props);

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
			onEditAndAttach={handleEditAndAttach}
			onCreate={handleCreate}
			disabled={attaching || customising}
			loading={loading}
		/>
	);
}
