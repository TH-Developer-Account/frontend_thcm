import { useMemo, useState } from "react";
import { LibraryBig, Sparkles } from "lucide-react";

import { SearchInput } from "../../../components/forms/SearchInput";

import type {
	EntryMode,
	SaveMode,
	WorkflowListScope,
	WorkflowSummary,
} from "../types/types";
import "../utils/workflow.css";
import { WorkflowFetchList } from "./WorkflowFetchList";

export interface WorkflowEntrySectionProps {
	sourceRecordRef?: string;
	workflows: WorkflowSummary[];
	selectedFilter: WorkflowListScope;
	onFilterChange: (filter: WorkflowListScope) => void;
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
	selectedFilter,
	onFilterChange,
	onAttach,
	onEditAndAttach,
	onCreate,
	disabled = false,
	loading = false,
}: WorkflowEntrySectionProps) {
	const [mode, setMode] = useState<EntryMode>("idle");
	const [search, setSearch] = useState("");

	const filteredWorkflows = useMemo(
		() => filterWorkflows(workflows, search),
		[workflows, search],
	);

	const handleUseExisting = () => {
		setMode("fetch");
	};

	const handleCreate = () => {
		setMode("create");
		onCreate();
	};

	return (
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
					onClick={handleUseExisting}
					disabled={disabled || loading}
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
					onClick={handleCreate}
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
						placeholder="Search workflows..."
						aria-label="Search available workflows"
						className="w-full"
					/>

					<WorkflowFetchList
						filter={selectedFilter}
						onFilterChange={onFilterChange}
						workflows={filteredWorkflows}
						onAttach={onAttach}
						onCustomise={(workflow) => onEditAndAttach(workflow, "once")}
						disabled={disabled}
						loading={loading}
					/>
				</>
			) : null}
		</div>
	);
}
