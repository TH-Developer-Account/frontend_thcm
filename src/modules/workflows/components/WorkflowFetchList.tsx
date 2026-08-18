import React from "react";
import { GitFork, Paperclip, Pencil, Plus, Users } from "lucide-react";

import Button from "../../../components/common/Button";
import { FilterTabs } from "../../../components/ui/FilterTabs";

import { workflowListFilterOptions } from "../constant/workflow.constant";
import type { WorkflowListScope, WorkflowSummary } from "../types/types";

interface WorkflowFetchListProps {
	filter: WorkflowListScope;
	onFilterChange: (filter: WorkflowListScope) => void;
	workflows: WorkflowSummary[];
	onAttach: (workflow: WorkflowSummary) => void | Promise<void>;
	onCustomise: (workflow: WorkflowSummary) => void | Promise<void>;
	disabled?: boolean;
	loading?: boolean;
}

const getEmptyMessage = (filter: WorkflowListScope): string => {
	switch (filter) {
		case "ASSIGNED_TO_ME":
			return "No workflows assigned to you are available.";

		case "CREATED_BY_ME":
			return "No workflows created by you are available.";

		default:
			return "No workflows are available.";
	}
};

export function WorkflowFetchList({
	filter,
	onFilterChange,
	workflows,
	onAttach,
	onCustomise,
	disabled = false,
	loading = false,
}: WorkflowFetchListProps) {
	const filterTabs = React.useMemo(
		() =>
			workflowListFilterOptions.map((option) => ({
				value: option.value,
				label: option.label,
				tooltipLabel: option.tooltipLabel,
				Icon: option.Icon,
			})),
		[],
	);

	const handleFilterChange = React.useCallback(
		(value: WorkflowListScope) => {
			if (disabled || loading) return;

			onFilterChange(value);
		},
		[disabled, loading, onFilterChange],
	);

	return (
		<div className="workflow-fetch-panel">
			<FilterTabs
				ariaLabel="Filter available workflows"
				items={filterTabs}
				value={filter}
				onChange={handleFilterChange}
				className="border-b-none px-0 py-0"
			/>

			{loading ? (
				<div className="workflow-fetch-empty" role="status">
					Loading workflows…
				</div>
			) : workflows.length === 0 ? (
				<div className="workflow-fetch-empty">
					<GitFork size={20} aria-hidden="true" />

					<p>{getEmptyMessage(filter)}</p>
				</div>
			) : (
				<div className="workflow-fetch-scroll max-h-[28rem] overflow-y-auto overscroll-contain pr-1">
					<div className="workflow-fetch-list">
						{workflows.map((workflow) => (
							<section className="workflow-fetch-item" key={workflow.id}>
								<div className="workflow-fetch-row">
									<div className="workflow-fetch-row-main">
										<div
											className="workflow-fetch-item-icon"
											aria-hidden="true"
										>
											<GitFork size={16} />
										</div>

										<div className="workflow-fetch-copy">
											<h4>{workflow.name}</h4>

											<p>
												<span>
													<Plus size={12} />
													{workflow.stageCount} stage
													{workflow.stageCount === 1 ? "" : "s"}
												</span>

												<span>
													<Users size={12} />

													{workflow.flowType === "SEQUENTIAL"
														? "Sequential"
														: "Parallel"}
												</span>
											</p>
										</div>
									</div>

									<div className="workflow-fetch-actions">
										<Button
											type="button"
											appearance="standard"
											variant="outline"
											Icon={Pencil}
											text="Customise"
											disabled={disabled}
											onClick={() => onCustomise(workflow)}
										/>

										<Button
											type="button"
											appearance="standard"
											variant="outline"
											Icon={Paperclip}
											text="Attach"
											disabled={disabled}
											onClick={() => onAttach(workflow)}
										/>
									</div>
								</div>
							</section>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
