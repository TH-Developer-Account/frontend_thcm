import { useMemo, useState } from "react";
import { GitBranch, LibraryBig, Sparkles } from "lucide-react";
import Card from "../../../components/common/Card";
import type {
	EntryMode,
	SaveMode,
	WorkflowFilter,
	WorkflowSummary,
	WorkflowStage,
	WorkflowApprover,
	WorkflowStageErrors,
} from "../types/types";

import "../utils/workflow.css";
import { WorkflowFetchList } from "./WorkflowFetchList";
import { SearchInput } from "../../../components/forms/SearchInput";
import WorkflowStagesForm from "./WorkflowStagesForm";

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
	const [mode, setMode] = useState<EntryMode>("idle");
	const [filter, setFilter] = useState<WorkflowFilter>("created");
	const [search, setSearch] = useState<string>("");
	const [stages, setStages] = useState<WorkflowStage[]>([]);

	const [errors, setErrors] = useState<WorkflowStageErrors[]>([]);
	const [formError, setFormError] = useState<string | null>(null);

	const currentUserId = "user-123";

	const handleStageChange = <K extends keyof WorkflowStage>(
		stageId: string,
		key: K,
		value: WorkflowStage[K],
	) => {
		setStages((prev) =>
			prev.map((stage) =>
				stage.id === stageId
					? {
							...stage,
							[key]: value,
						}
					: stage,
			),
		);
	};

	const handleToggleStage = (stageId: string) => {
		setStages((prev) =>
			prev.map((stage) =>
				stage.id === stageId
					? {
							...stage,
							isExpanded: !stage.isExpanded,
						}
					: stage,
			),
		);
	};

	const handleAddApprover = (stageId: string, approver: WorkflowApprover) => {
		setStages((prev) =>
			prev.map((stage) =>
				stage.id === stageId
					? {
							...stage,
							approvers: [...stage.approvers, approver],
						}
					: stage,
			),
		);
	};

	const handleRemoveApprover = (stageId: string, approverId: string) => {
		setStages((prev) =>
			prev.map((stage) =>
				stage.id === stageId
					? {
							...stage,
							approvers: stage.approvers.filter((a) => a.id !== approverId),
						}
					: stage,
			),
		);
	};

	const handleAddStage = () => {
		setStages((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				stageOrder: prev.length + 1,
				name: `Stage ${prev.length + 1}`,
				minApprovals: 1,
				approvers: [],
				isExpanded: true,
			},
		]);
	};

	const handleBack = () => {
		console.log("Back clicked");
	};

	const handleSubmit = () => {
		console.log("Workflow", stages);

		// validate and submit API
	};
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
							placeholder="Search workflows..."
						/>
					</div>
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

			{mode === "create" ? (
				<div className="py-4">
					<WorkflowStagesForm
						stages={stages}
						errors={errors}
						formError={formError}
						currentUserId={currentUserId}
						onStageChange={handleStageChange}
						onToggleStage={handleToggleStage}
						onRemoveApprover={handleRemoveApprover}
						onAddApprover={handleAddApprover}
						onBack={handleBack}
						onAddStage={handleAddStage}
						onSubmit={handleSubmit}
					/>
				</div>
			) : null}
		</Card>
	);
}
