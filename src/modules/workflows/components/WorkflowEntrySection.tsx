import { useState } from "react";
import { GitBranch, LibraryBig, Plus, Sparkles } from "lucide-react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import type {
	EntryMode,
	SaveMode,
	WorkflowFilter,
	WorkflowSummary,
} from "../types/types";
import { WorkflowFetchList } from "./WorkflowFetchList";
import { useNavigate } from "react-router-dom";
import { SearchInput } from "../../../components/forms/SearchInput";

export interface WorkflowEntrySectionProps {
	sourceRecordRef?: string;
	createdWorkflows: WorkflowSummary[];
	assignedWorkflows: WorkflowSummary[];
	onAttach: (workflow: WorkflowSummary) => void | Promise<void>;
	onEditAndAttach: (
		workflow: WorkflowSummary,
		saveMode: SaveMode,
	) => void | Promise<void>;
	title?: string;
	description?: string;
	required?: boolean;
	disabled?: boolean;
	loading?: boolean;
}

export function WorkflowEntrySection({
	sourceRecordRef,
	createdWorkflows,
	assignedWorkflows,
	onAttach,
	onEditAndAttach,
	title = "Approval workflow",
	description = "Choose an existing workflow or build one for this request.",
	required = true,
	disabled = false,
	loading = false,
}: WorkflowEntrySectionProps) {
	const navigate = useNavigate();
	const [mode, setMode] = useState<EntryMode>("idle");
	const [filter, setFilter] = useState<WorkflowFilter>("created");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [saveModes, setSaveModes] = useState<Record<string, SaveMode>>({});
	const [search, setSearch] = useState<string>("");

	const selectMode = (nextMode: EntryMode) => {
		setMode(nextMode);
		setEditingId(null);
	};

	const handleNavigatetoWorkflowCreate = () => {
		navigate("/workflow/create-workflows");
	};
	return (
		<Card
			className="workflow-entry-card"
			title={
				<div className="workflow-entry-heading">
					<GitBranch size={18} />
					<div className="workflow-entry-heading-copy">
						<div className="workflow-entry-title-row">
							<h3 className="workflow-entry-title">{title}</h3>
						</div>
						<p className="workflow-entry-description">
							{description}
							{sourceRecordRef ? (
								<span className="workflow-entry-reference">
									{" "}
									Reference: {sourceRecordRef}
								</span>
							) : null}
						</p>
					</div>
					{required ? (
						<span className="workflow-entry-required">Required</span>
					) : null}
				</div>
			}
		>
			<div
				className="workflow-entry-options"
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
					onClick={() => selectMode("create")}
					disabled={disabled}
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
					<div className="workflow-entry-create">
						<div>
							<p className="workflow-entry-create-title w-full">
								Search all your workflows
							</p>
							{/* <p className="workflow-entry-create-copy">
								Add, rename and reorder approval stages. You can attach it once
								or save it as a reusable template.
							</p> */}
						</div>
						<SearchInput
							value={search}
							onChange={setSearch}
							placeholder="Search users..."
						/>
					</div>
					<WorkflowFetchList
						filter={filter}
						onFilterChange={setFilter}
						createdWorkflows={createdWorkflows}
						assignedWorkflows={assignedWorkflows}
						editingId={editingId}
						onToggleEdit={(id) =>
							setEditingId((current) => (current === id ? null : id))
						}
						getSaveMode={(id) => saveModes[id] ?? "once"}
						onSetSaveMode={(id, saveMode) =>
							setSaveModes((current) => ({ ...current, [id]: saveMode }))
						}
						onAttach={onAttach}
						onContinueEdit={onEditAndAttach}
						disabled={disabled}
						loading={loading}
					/>
				</>
			) : null}

			{mode === "create" ? (
				<div className="workflow-entry-create">
					<div>
						<p className="workflow-entry-create-title">
							Build a custom workflow
						</p>
						<p className="workflow-entry-create-copy">
							Add, rename and reorder approval stages. You can attach it once or
							save it as a reusable template.
						</p>
					</div>
					<Button
						type="button"
						onClick={handleNavigatetoWorkflowCreate}
						disabled={disabled || loading}
						Icon={Plus}
						text="Open builder"
						appearance="standard"
						variant="brand"
					/>
				</div>
			) : null}
		</Card>
	);
}
