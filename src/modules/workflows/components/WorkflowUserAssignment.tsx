import axios from "axios";
import React, { useEffect, useState } from "react";
import { Modal } from "../../../components/common/Modal";
import Button from "../../../components/common/Button";
import Avatar from "../../../components/common/Avatar";
import { SearchInput } from "../../../components/forms/SearchInput";
import { useDebounce } from "../../../hooks/useDebounce";
import type { WorkflowRow, WorkflowUser } from "../types/types";
import { workflowApi, getWorkflowErrorMessage } from "../api/workflow.api";
import { useAssignWorkflowUsersMutation } from "../context/useWorkflowMutations";
import { useToast } from "../../../context/Auth/AuthContext";
import { getFullName } from "../utils/user";

const SEARCH_DEBOUNCE_MS = 300;

type AssignProps = {
	workflow: WorkflowRow | null;
	onClose: () => void;
};

export const WorkflowUserAssignment: React.FC<AssignProps> = ({
	workflow,
	onClose,
}) => {
	const [users, setUsers] = useState<WorkflowUser[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState<string>("");
	const assignMutation = useAssignWorkflowUsersMutation();
	const { showToast } = useToast();

	const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);

	// The backend already filters /users by `search` (name/email/phone) —
	// no client-side re-filtering needed, and none of it has to touch all
	// 10k rows to do it.
	const filteredUsers = users;

	const toggleUser = (id: string) => {
		setSelectedUsers((prev) =>
			prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
		);
	};

	/*
	 * Initialize the selected users whenever the opened workflow changes.
	 * Kept separate from the search-fetching effect so a search request
	 * never resets selections already made in the modal.
	 */
	useEffect(() => {
		if (!workflow?.id) {
			setSelectedUsers([]);
			return;
		}

		setSelectedUsers(workflow.workflowUsers?.map((each) => each.id) ?? []);
	}, [workflow?.id, workflow?.workflowUsers]);

	/*
	 * Backend search:
	 * - waits 300 ms after typing
	 * - sends `search` to /users
	 * - aborts the previous HTTP request when search changes
	 * - prevents stale responses from replacing newer results
	 */
	useEffect(() => {
		if (!workflow?.id) {
			setUsers([]);
			return;
		}

		const controller = new AbortController();

		setLoading(true);

		const fetchUsers = async () => {
			try {
				const result = await workflowApi.getUsers({
					search: debouncedSearch,
					signal: controller.signal,
				});

				setUsers(result);
			} catch (err) {
				if (axios.isCancel(err) || controller.signal.aborted) {
					return;
				}

				console.error("Failed to fetch users", err);
				setUsers([]);
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		};

		void fetchUsers();

		return () => {
			controller.abort();
		};
	}, [workflow?.id, debouncedSearch]);

	const handleSubmit = async (): Promise<void> => {
		if (!workflow?.id || assignMutation.loading) {
			return;
		}

		try {
			const response = (await assignMutation.mutateAsync(
				workflow.id,
				selectedUsers,
			)) as { message?: string };
			showToast({
				type: "success",
				title: "Users assigned",
				description: response?.message ?? "Users assigned successfully.",
			});
			onClose();
		} catch (error) {
			showToast({
				type: "error",
				title: "Assignment failed",
				description: getWorkflowErrorMessage(
					error,
					"Unable to assign users. Please try again.",
				),
			});
		}
	};

	return (
		<Modal
			open={!!workflow?.id}
			onClose={onClose}
			size="xl"
			title="Assign Users"
			footer_actions={
				<>
					<Button
						text="Cancel"
						onClick={onClose}
						appearance="standard"
						variant="outline"
					/>
					<Button
						text={assignMutation.loading ? "Assigning..." : "Assign Users"}
						appearance="standard"
						variant="brand"
						onClick={handleSubmit}
						disabled={!workflow?.id || assignMutation.loading}
					/>
				</>
			}
		>
			<div className="workflow-assignment-search">
				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder="Search users..."
				/>
			</div>

			<div className="workflow-assignment-list">
				{loading ? (
					<p className="workflow-assignment-empty">Loading users...</p>
				) : filteredUsers.length === 0 ? (
					<p className="workflow-assignment-empty">No users found.</p>
				) : (
					filteredUsers.map((user) => {
						const selected = selectedUsers.includes(user.id);

						return (
							<button
								type="button"
								key={user.id}
								onClick={() => toggleUser(user.id)}
								className={`workflow-assignment-row ${
									selected ? "workflow-assignment-row--selected" : ""
								}`}
							>
								<div>
									<Avatar firstName={user.firstName} lastName={user.lastName} />
								</div>

								<div className="workflow-assignment-name">
									<p className="workflow-assignment-primary">
										{getFullName(user)}
									</p>
								</div>

								<div className="workflow-assignment-detail">
									<p className="workflow-assignment-secondary">
										{user.email ?? "--"}
									</p>
								</div>

								<div className="workflow-assignment-detail">
									<p className="workflow-assignment-secondary">
										{user.phone ?? "--"}
									</p>
								</div>

								<div
									className={`workflow-assignment-check ${
										selected ? "workflow-assignment-check--selected" : ""
									}`}
								>
									{selected && (
										<span className="workflow-assignment-checkmark">✓</span>
									)}
								</div>
							</button>
						);
					})
				)}
			</div>
		</Modal>
	);
};
