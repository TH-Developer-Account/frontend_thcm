import { useEffect, useRef, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	GitBranch,
	Plus,
	Search,
	Trash2,
	UserRound,
} from "lucide-react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormInput from "../../../components/forms/FormInput";
import { useWorkflowBuilder } from "../context/useWorkflowBuilder";
import type {
	Approver,
	FlowType,
	WorkflowBuilderPayload,
	WorkflowBuilderOptions,
	WorkflowStage,
} from "../context/useWorkflowBuilder";
import "../utils/workflow.css";

export interface WorkflowTemplateBuilderProps {
	sourceRecordRef: string;
	initialStages?: WorkflowStage[];
	initialFlowType?: FlowType;
	initialSaveAsTemplate?: boolean;
	searchApprovers: (query: string) => Promise<Approver[]>;
	onAttach: (payload: WorkflowBuilderPayload) => void | Promise<void>;
	onCancel?: () => void;
	title?: string;
	disabled?: boolean;
}

export function WorkflowTemplateBuilder({
	sourceRecordRef,
	initialStages,
	initialFlowType = "SEQUENTIAL",
	initialSaveAsTemplate = false,
	searchApprovers,
	onAttach,
	onCancel,
	title = "Build approval workflow",
	disabled = false,
}: WorkflowTemplateBuilderProps) {
	const options: WorkflowBuilderOptions = {
		initialStages,
		initialFlowType,
		initialSaveAsTemplate,
	};
	const {
		state,
		addStage,
		removeStage,
		renameStage,
		moveStage,
		setFlowType,
		setSaveAsTemplate,
		setTemplateName,
		isValid,
		buildPayload,
	} = useWorkflowBuilder(options);

	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Approver[]>([]);
	const [selectedApprover, setSelectedApprover] = useState<Approver | null>(
		null,
	);
	const [stageNameDraft, setStageNameDraft] = useState("");
	const [searching, setSearching] = useState(false);
	const [attaching, setAttaching] = useState(false);
	const [searchError, setSearchError] = useState("");
	const requestIdRef = useRef(0);

	useEffect(() => {
		const searchTerm = query.trim();
		if (searchTerm.length < 2 || selectedApprover) {
			setResults([]);
			setSearching(false);
			return;
		}

		const requestId = ++requestIdRef.current;
		const timeoutId = window.setTimeout(async () => {
			setSearching(true);
			setSearchError("");
			try {
				const found = await searchApprovers(searchTerm);
				if (requestId === requestIdRef.current) setResults(found);
			} catch {
				if (requestId === requestIdRef.current) {
					setResults([]);
					setSearchError("Could not load approvers. Please try again.");
				}
			} finally {
				if (requestId === requestIdRef.current) setSearching(false);
			}
		}, 350);

		return () => window.clearTimeout(timeoutId);
	}, [query, selectedApprover, searchApprovers]);

	const handleAddStage = () => {
		if (!selectedApprover) return;
		addStage(
			selectedApprover,
			stageNameDraft.trim() || `Stage ${state.stages.length + 1}`,
		);
		setSelectedApprover(null);
		setQuery("");
		setStageNameDraft("");
	};

	const handleAttach = async () => {
		if (!isValid || attaching || disabled) return;
		setAttaching(true);
		try {
			await onAttach(buildPayload(sourceRecordRef));
		} finally {
			setAttaching(false);
		}
	};

	return (
		<Card className="workflow-builder">
			<div className="workflow-builder-header">
				<div className="workflow-builder-heading">
					<div className="workflow-entry-icon" aria-hidden="true">
						<GitBranch size={18} />
					</div>
					<div>
						<h3>{title}</h3>
						<p>Add approvers in the order this request should be reviewed.</p>
					</div>
				</div>
				<span className="workflow-builder-count">
					{state.stages.length} stage{state.stages.length === 1 ? "" : "s"}
				</span>
			</div>

			<div className="workflow-builder-add">
				<div className="workflow-approver-search">
					<FormInput
						label="Approver"
						value={query}
						onChange={(event) => {
							const value = event.target.value;
							setQuery(value);
							if (selectedApprover?.name !== value) setSelectedApprover(null);
						}}
						placeholder="Search by name or email"
						disabled={disabled}
					/>
					<Search className="workflow-approver-search-icon" size={15} />
					{searching ? (
						<span className="workflow-search-status" role="status">
							Searching…
						</span>
					) : null}
					{results.length > 0 ? (
						<ul className="workflow-search-results" role="listbox">
							{results.map((approver) => (
								<li key={approver.id}>
									<button
										type="button"
										role="option"
										aria-selected={selectedApprover?.id === approver.id}
										onClick={() => {
											setSelectedApprover(approver);
											setQuery(approver.name);
											setResults([]);
										}}
									>
										<span className="workflow-search-avatar">
											<UserRound size={14} />
										</span>
										<span>
											<strong>{approver.name}</strong>
											<small>{approver.email}</small>
										</span>
									</button>
								</li>
							))}
						</ul>
					) : null}
					{searchError ? (
						<p className="workflow-field-error" role="alert">
							{searchError}
						</p>
					) : null}
				</div>

				<FormInput
					label="Stage name"
					value={stageNameDraft}
					onChange={(event) => setStageNameDraft(event.target.value)}
					placeholder={`Stage ${state.stages.length + 1}`}
					disabled={disabled}
				/>
				<Button
					type="button"
					onClick={handleAddStage}
					disabled={!selectedApprover || disabled}
					className="workflow-add-stage-action"
					Icon={Plus}
					text="Add Stage"
				/>
			</div>

			{state.stages.length === 0 ? (
				<div className="workflow-builder-empty">
					<GitBranch size={22} aria-hidden="true" />
					<p>No approval stages added yet.</p>
					<span>Search for an approver above to begin.</span>
				</div>
			) : (
				<ol className="workflow-builder-stage-list">
					{state.stages.map((stage, index) => (
						<li className="workflow-builder-stage" key={stage.id}>
							<span className="workflow-builder-stage-number">{index + 1}</span>
							<div className="workflow-builder-stage-fields">
								<FormInput
									label="Stage name"
									value={stage.name}
									onChange={(event) =>
										renameStage(stage.id, event.target.value)
									}
									disabled={disabled}
								/>
								<div className="workflow-builder-approver">
									<span className="workflow-search-avatar">
										<UserRound size={14} />
									</span>
									<span>
										<strong>{stage.approver.name}</strong>
										<small>{stage.approver.email}</small>
									</span>
								</div>
							</div>
							<div className="workflow-builder-stage-actions">
								<Button
									type="button"
									appearance="standard"
									variant="outline"
									onClick={() => moveStage(stage.id, "up")}
									disabled={disabled || index === 0}
									aria-label={`Move ${stage.name} up`}
									Icon={ArrowUp}
								/>
								<Button
									type="button"
									appearance="standard"
									variant="outline"
									onClick={() => moveStage(stage.id, "down")}
									disabled={disabled || index === state.stages.length - 1}
									aria-label={`Move ${stage.name} down`}
									Icon={ArrowDown}
								/>
								<Button
									type="button"
									appearance="standard"
									variant="outline"
									onClick={() => removeStage(stage.id)}
									disabled={disabled}
									aria-label={`Remove ${stage.name}`}
									Icon={Trash2}
								/>
							</div>
						</li>
					))}
				</ol>
			)}

			<div className="workflow-builder-settings">
				<fieldset>
					<legend>Approval order</legend>
					<div className="workflow-segmented-control">
						{(["SEQUENTIAL", "PARALLEL"] as const).map((flowType) => (
							<button
								key={flowType}
								type="button"
								className={
									state.flowType === flowType
										? "workflow-segment workflow-segment--active"
										: "workflow-segment"
								}
								aria-pressed={state.flowType === flowType}
								onClick={() => setFlowType(flowType)}
								disabled={disabled}
							>
								{flowType === "SEQUENTIAL" ? "Sequential" : "Parallel"}
							</button>
						))}
					</div>
					<p>
						{state.flowType === "SEQUENTIAL"
							? "Stages are reviewed one after another."
							: "All stages can review at the same time."}
					</p>
				</fieldset>

				<label className="workflow-template-toggle">
					<input
						type="checkbox"
						checked={state.saveAsTemplate}
						onChange={(event) => setSaveAsTemplate(event.target.checked)}
						disabled={disabled}
					/>
					<span>
						<strong>Save as reusable template</strong>
						<small>Make this workflow available for future forms.</small>
					</span>
				</label>
			</div>

			{state.saveAsTemplate ? (
				<div className="workflow-template-name">
					<FormInput
						label="Template name"
						value={state.templateName}
						onChange={(event) => setTemplateName(event.target.value)}
						placeholder="Enter a clear, reusable name"
						required
						disabled={disabled}
					/>
				</div>
			) : null}

			<div className="workflow-builder-footer">
				<p>
					{!isValid && state.stages.length > 0
						? "Complete all stage names and the template name, if enabled."
						: "The attached workflow is snapshotted for this form."}
				</p>
				<div>
					{onCancel ? (
						<Button
							type="button"
							appearance="standard"
							variant="outline"
							onClick={onCancel}
							disabled={attaching}
							text="Cancel"
						/>
					) : null}
					<Button
						type="button"
						onClick={handleAttach}
						disabled={!isValid || attaching || disabled}
						text={attaching ? "Attaching…" : "Attach workflow"}
					/>
				</div>
			</div>
		</Card>
	);
}
