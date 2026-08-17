import { useMemo, useState } from "react";

import { SearchInput } from "../../../components/forms/SearchInput";

import type {
	WorkflowListScope,
	WorkflowSummary,
	WorkflowTemplate,
} from "../types/types";
import "../utils/workflow.css";
import { WorkflowFetchList } from "./WorkflowFetchList";

export interface WorkflowEntrySectionProps {
	sourceRecordRef?: string;
	workflows: WorkflowSummary[];
	expandedWorkflowId: string | null;
	loadingWorkflowId: string | null;
	workflowDetails: Record<string, WorkflowTemplate>;
	workflowDetailErrors: Record<string, string>;
	selectedFilter: WorkflowListScope;
	onFilterChange: (filter: WorkflowListScope) => void;
	onToggleWorkflow: (workflowId: string) => void | Promise<void>;
	onAttach: (workflow: WorkflowSummary) => void | Promise<void>;
	onCreate?: () => void;
	title?: string;
	description?: string;
	required?: boolean;
	disabled?: boolean;
	loading?: boolean;
}

const filterWorkflows = (
	workflows: WorkflowSummary[],
	search: string,
): WorkflowSummary[] => {
	const keyword = search.trim().toLowerCase();

	if (!keyword) {
		return workflows;
	}

	return workflows.filter((workflow) =>
		`${workflow.name} ${workflow.description ?? ""}`
			.toLowerCase()
			.includes(keyword),
	);
};

export function WorkflowEntrySection({
	workflows,
	expandedWorkflowId,
	loadingWorkflowId,
	workflowDetails,
	workflowDetailErrors,
	selectedFilter,
	onFilterChange,
	onToggleWorkflow,
	onAttach,
	disabled = false,
	loading = false,
}: WorkflowEntrySectionProps) {
	const [search, setSearch] = useState("");

	const filteredWorkflows = useMemo(
		() => filterWorkflows(workflows, search),
		[workflows, search],
	);

	return (
		<div>
			<SearchInput
				value={search}
				onChange={setSearch}
				placeholder="Search workflows..."
				aria-label="Search available workflows"
				className="w-full "
			/>

			<WorkflowFetchList
				filter={selectedFilter}
				onFilterChange={onFilterChange}
				workflows={filteredWorkflows}
				expandedWorkflowId={expandedWorkflowId}
				loadingWorkflowId={loadingWorkflowId}
				workflowDetails={workflowDetails}
				workflowDetailErrors={workflowDetailErrors}
				onToggleWorkflow={onToggleWorkflow}
				onAttach={onAttach}
				disabled={disabled}
				loading={loading}
			/>
		</div>
	);
}
