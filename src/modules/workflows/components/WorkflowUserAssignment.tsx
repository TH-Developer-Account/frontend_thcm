import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/common/Modal";
import Button from "../../../components/common/Button";
import Avatar from "../../../components/common/Avatar";
import { SearchInput } from "../../../components/forms/SearchInput";
import type { WorkflowRow, WorkflowUser } from "../types/types";
import { workflowApi, getWorkflowErrorMessage } from "../api/workflow.api";
import { useAssignWorkflowUsersMutation } from "../context/useWorkflowMutations";
import { useToast } from "../../../context/Auth/AuthContext";
import { getFullName } from "../utils/user";

type AssignProps = {
  workflow: WorkflowRow | null;
  onClose: () => void;
};

const isUserCreatedWorkflow = (workflow: WorkflowRow | null): boolean =>
  workflow?.ownerType === "USER";

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

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return users;

    return users.filter((user) => {
      const fullName = getFullName(user).toLowerCase();
      const email = (user.email ?? "").toLowerCase();
      const phone = (user.phone ?? "").toLowerCase();

      return (
        fullName.includes(keyword) ||
        email.includes(keyword) ||
        phone.includes(keyword)
      );
    });
  }, [users, search]);

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    if (!workflow?.id || isUserCreatedWorkflow(workflow)) return;

    const loadUsers = async () => {
      try {
        setLoading(true);
        setUsers(await workflowApi.getUsers());
        setSelectedUsers(workflow.workflowUsers?.map((each) => each.id) ?? []);
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [workflow]);

  const handleSubmit = async (): Promise<void> => {
    if (
      !workflow?.id ||
      isUserCreatedWorkflow(workflow) ||
      assignMutation.loading
    ) {
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

  if (isUserCreatedWorkflow(workflow)) return null;

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
