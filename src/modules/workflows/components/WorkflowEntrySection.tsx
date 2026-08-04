import { useMemo, useState } from "react";
import { LibraryBig, Sparkles } from "lucide-react";

// import Button from "../../../components/common/Button";
// import Card from "../../../components/common/Card";
import type {
	EntryMode,
	SaveMode,
	WorkflowFilter,
	WorkflowSummary,
} from "../types/types";
import "../utils/workflow.css";
import { WorkflowFetchList } from "./WorkflowFetchList";
import { SearchInput } from "../../../components/forms/SearchInput";

export interface WorkflowEntrySectionProps {
	sourceRecordRef?: string;
	createdWorkflows: WorkflowSummary[];
	assignedWorkflows?: WorkflowSummary[];
	onAttach: (workflow: WorkflowSummary) => void | Promise<void>;
	onEditAndAttach: (
		workflow: WorkflowSummary,
		saveMode: SaveMode,
	) => void | Promise<void>;
	onCreate: () => void;
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
	if (!keyword) return workflows;

	return workflows.filter((workflow) =>
		`${workflow.name} ${workflow.description ?? ""}`
			.toLowerCase()
			.includes(keyword),
	);
};

export function WorkflowEntrySection({
	createdWorkflows,
	assignedWorkflows = [],
	onAttach,
	onEditAndAttach,
	onCreate,
	disabled = false,
	loading = false,
}: WorkflowEntrySectionProps) {
	const [mode, setMode] = useState<EntryMode>("idle");
	const [filter, setFilter] = useState<WorkflowFilter>("created");
	const [search, setSearch] = useState<string>("");

	const selectMode = (nextMode: EntryMode) => {
		setMode(nextMode);
	};

	const filteredCreatedWorkflows = useMemo(
		() => filterWorkflows(createdWorkflows, search),
		[createdWorkflows, search],
	);
	const filteredAssignedWorkflows = useMemo(
		() => filterWorkflows(assignedWorkflows, search),
		[assignedWorkflows, search],
	);
	return (
		// <Card
		// 	className="workflow-entry-card"
		// 	title={
		// 		<div className="workflow-entry-heading">
		// 			<GitBranch size={18} />
		// 			<div className="workflow-entry-heading-copy">
		// 				<div className="workflow-entry-title-row">
		// 					<h3 className="workflow-entry-title">{title}</h3>
		// 				</div>
		// 				<p className="workflow-entry-description">
		// 					{description}
		// 					{sourceRecordRef ? (
		// 						<span className="workflow-entry-reference">
		// 							{" "}
		// 							Reference: {sourceRecordRef}
		// 						</span>
		// 					) : null}
		// 				</p>
		// 			</div>
		// 			{required ? (
		// 				<span className="workflow-entry-required">Required</span>
		// 			) : null}
		// 		</div>
		// 	}
		// >
		<div>
			<div
				className="workflow-entry-options mb-4"
				role="group"
				aria-label="Workflow source"
			>
				<button
					type="button"
					className={`workflow-entry-option${
						mode === "fetch" ? " workflow-entry-option--active" : ""
					}`}
					onClick={() => selectMode("fetch")}
					disabled={disabled}
					aria-pressed={mode === "fetch"}
				>
					<LibraryBig size={18} aria-hidden="true" />
					<span>
						<strong>Use existing</strong>
						<small>Reuse or customise an available workflow</small>
					</span>
				</button>

				<button
					type="button"
					className={`workflow-entry-option${
						mode === "create" ? " workflow-entry-option--active" : ""
					}`}
					onClick={onCreate}
					disabled={disabled || loading}
					aria-pressed={mode === "create"}
				>
					<Sparkles size={18} aria-hidden="true" />
					<span>
						<strong>Create new</strong>
						<small>Build stages and select approvers</small>
					</span>
				</button>
			</div>

			{mode === "fetch" ? (
				<>
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Search all your workflows ..."
						className="w-full"
					/>
					<WorkflowFetchList
						filter={filter}
						onFilterChange={setFilter}
						createdWorkflows={filteredCreatedWorkflows}
						assignedWorkflows={filteredAssignedWorkflows}
						onAttach={onAttach}
						disabled={disabled}
						onCustomise={(workflow) => onEditAndAttach(workflow, "once")}
						loading={loading}
					/>
				</>
			) : null}

			{/* </Card> */}
		</div>
	);
}
