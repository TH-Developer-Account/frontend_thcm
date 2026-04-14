import React, { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import type {
	ApprovalRule,
	WorkflowStage,
	Approver,
} from "../types/workflow.types";

type Props = {
	stages: WorkflowStage[];
	currentUserId: string;
	availableUsers: Approver[];
	onStageChange: <K extends keyof WorkflowStage>(
		stageId: string,
		key: K,
		value: WorkflowStage[K],
	) => void;
	onToggleStage: (stageId: string) => void;
	onRemoveApprover: (stageId: string, approverId: string) => void;
	onAddApprover: (stageId: string, approver: Approver) => void;
	onBack: () => void;
	onSubmit: () => void;
};

const WorkflowStagesForm = ({
	stages,
	availableUsers,
	onStageChange,
	onToggleStage,
	onRemoveApprover,
	onAddApprover,
	onBack,
	onSubmit,
}: Props) => {
	const [searchMap, setSearchMap] = useState<Record<string, string>>({});

	const handleSearchChange = (stageId: string, value: string) => {
		setSearchMap((prev) => ({
			...prev,
			[stageId]: value,
		}));
	};

	const getFilteredUsers = (stage: WorkflowStage) => {
		const query = (searchMap[stage.id] || "").trim().toLowerCase();

		return availableUsers.filter((user) => {
			const alreadyAdded = stage.approvers.some((a) => a.id === user.id);
			if (alreadyAdded) return false;

			if (!query) return true;

			return (
				user.name.toLowerCase().includes(query) ||
				user.role?.toLowerCase().includes(query) ||
				user.email?.toLowerCase().includes(query)
			);
		});
	};

	return (
		<div>
			<div className="workflow-stage-list">
				{stages.map((stage) => {
					const isProposer = stage.name === "Proposer";
					const filteredUsers = getFilteredUsers(stage);
					const searchValue = searchMap[stage.id] || "";

					return (
						<div
							key={stage.id}
							className={`workflow-stage-card ${
								stage.isExpanded ? "workflow-stage-card-expanded" : ""
							}`}
						>
							<button
								type="button"
								className="workflow-stage-header"
								onClick={() => onToggleStage(stage.id)}
							>
								<div
									className={`workflow-stage-number ${
										stage.isExpanded ? "workflow-stage-number-active" : ""
									}`}
								>
									{stage.stageOrder}
								</div>

								<div className="workflow-stage-header-content">
									<div className="workflow-stage-title">{stage.name}</div>
									<div className="workflow-stage-meta">
										{stage.approvers.length} approver
										{stage.approvers.length === 1 ? "" : "s"}
									</div>
								</div>

								<span className="workflow-stage-step-pill">
									Step {stage.stageOrder}
								</span>

								<span
									className={`workflow-stage-chevron ${
										stage.isExpanded ? "workflow-stage-chevron-open" : ""
									}`}
								>
									›
								</span>
							</button>

							{stage.isExpanded && (
								<div className="workflow-stage-body">
									<div className="workflow-create-field-row workflow-create-field-row-2">
										<div className="workflow-create-field-group">
											<label className="workflow-create-label">
												Stage name
											</label>
											<input
												className="workflow-create-input workflow-create-input-sm"
												value={stage.name}
												disabled
												readOnly
											/>
										</div>

										<div className="workflow-create-field-group">
											<label className="workflow-create-label">
												Approval rule
											</label>
											<select
												className="workflow-create-input workflow-create-input-sm"
												value={stage.strategy}
												// disabled={isProposer}
												onChange={(e) =>
													onStageChange(
														stage.id,
														"strategy",
														e.target.value as ApprovalRule,
													)
												}
											>
												<option value="ANY">Any one approves</option>
												<option value="ALL">All must approve</option>
												<option value="QUORUM">Quorum approves</option>
											</select>
										</div>
									</div>
									{/* !isProposer && */}
									{stage.strategy === "QUORUM" && (
										<div className="workflow-create-field-row workflow-create-field-row-2">
											<div className="workflow-create-field-group">
												<label className="workflow-create-label">
													Minimum approvals
												</label>
												<input
													type="number"
													min={1}
													className="workflow-create-input workflow-create-input-sm"
													value={stage.minApprovals ?? 1}
													onChange={(e) =>
														onStageChange(
															stage.id,
															"minApprovals",
															Number(e.target.value),
														)
													}
												/>
											</div>
										</div>
									)}
									<label className="workflow-create-label">
										{isProposer ? "Assigned user" : "Approvers"}
									</label>
									<div className="workflow-approver-list">
										{stage.approvers.map((approver) => (
											<div key={approver.id} className="workflow-approver-row">
												<div className="workflow-approver-avatar workflow-approver-avatar-orange">
													{approver.initials ||
														approver.name
															.split(" ")
															.map((word) => word[0])
															.join("")
															.slice(0, 2)
															.toUpperCase()}
												</div>

												<div className="workflow-approver-content">
													<div className="workflow-approver-name">
														{approver.name}
													</div>
													<div className="workflow-approver-role">
														{approver.role || approver.id}
													</div>
												</div>

												{/* {!isProposer && ( */}
												<button
													type="button"
													className="workflow-remove-btn"
													onClick={() =>
														onRemoveApprover(stage.id, approver.id)
													}
												>
													×
												</button>
												{/* // )} */}
											</div>
										))}
									</div>
									{/* {!isProposer && ( */}
									<>
										<div className="workflow-search">
											<Search size={14} className="workflow-search-icon" />
											<input
												type="text"
												value={searchValue}
												onChange={(e) =>
													handleSearchChange(stage.id, e.target.value)
												}
												placeholder="Search users by name or role"
												className="workflow-search-input"
											/>
										</div>

										{searchValue && filteredUsers.length > 0 && (
											<div className="workflow-approver-list mt-2">
												{filteredUsers.slice(0, 5).map((user) => (
													<button
														key={user.id}
														type="button"
														className="workflow-approver-row w-full text-left"
														onClick={() => {
															onAddApprover(stage.id, user);
															handleSearchChange(stage.id, "");
														}}
													>
														<div className="workflow-approver-avatar workflow-approver-avatar-blue">
															{user.initials ||
																user.name
																	.split(" ")
																	.map((word) => word[0])
																	.join("")
																	.slice(0, 2)
																	.toUpperCase()}
														</div>

														<div className="workflow-approver-content">
															<div className="workflow-approver-name">
																{user.name}
															</div>
															<div className="workflow-approver-role">
																{user.role || user.id}
															</div>
														</div>

														<UserPlus size={14} />
													</button>
												))}
											</div>
										)}
									</>
									{/* )} */}
								</div>
							)}
						</div>
					);
				})}
			</div>

			<div className="mt-4 flex justify-between">
				<button
					type="button"
					className="workflow-create-secondary-btn"
					onClick={onBack}
				>
					Back
				</button>

				<button
					type="button"
					className="workflow-create-primary-btn"
					onClick={onSubmit}
				>
					Next
				</button>
			</div>
		</div>
	);
};

export default WorkflowStagesForm;
