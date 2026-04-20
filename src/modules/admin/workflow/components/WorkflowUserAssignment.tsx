import React, { useEffect, useMemo, useState } from "react";
import { CircleX } from "lucide-react";
import { Modal } from "../../../../components/common/Modal";
import Button from "../../../../components/common/Button";
import { mapUser, type User } from "../../user-profile/types/profile.types";
import { ServerAxios } from "../../../../services/ServerAxios";
import Avatar from "../../../../components/common/Avatar";
import { SearchInput } from "../../../../components/FormElements/SearchInput";
import type { WorkflowRow } from "../types/workflow.types";

type AssignProps = {
  workflow: WorkflowRow | null;
  onClose: () => void;
  handleAssignUser: (
    userIds: string[],
    workflowId: string | undefined,
  ) => Promise<void>;
};

export const WorkflowUserAssignment: React.FC<AssignProps> = ({
  workflow,
  onClose,
  handleAssignUser,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState<string>("");

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return users;

    return users.filter((user) => {
      const fullName =
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase();
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
    if (!workflow?.id) return;

    const loadUsers = async () => {
      try {
        setLoading(true);
        const { data } = await ServerAxios.get("/users");
        const mappedUsers: User[] = data.map(mapUser);
        setUsers(mappedUsers);
        setSelectedUsers(workflow.workflowUsers?.map((each) => each.id) ?? []);
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [workflow]);

  return (
    <Modal open={!!workflow?.id} onClose={onClose}>
      <div className="w-[1000px] max-h-[520px] flex flex-col mx-auto bg-white p-4 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl text-zinc-900 flex items-center gap-2 ml-4">
            Assign Users
          </h2>

          <Button
            variant="primary"
            className="text-xs p-0 rounded-full bg-transparent"
            onClick={onClose}
            Icon={CircleX}
            iconSize="20"
          />
        </div>

        <div className="relative mb-4">
          <SearchInput value={search} onChange={setSearch} />
        </div>

        <div className="space-y-2 overflow-y-auto scrollbar-sleek p-6 flex-1">
          {loading ? (
            <p className="text-sm text-gray-400">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-gray-400">No users found.</p>
          ) : (
            filteredUsers.map((user) => {
              const selected = selectedUsers.includes(user.id);

              return (
                <div
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className={`flex items-center text-left justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                    selected
                      ? "bg-amber-500/5 border-amber-500/30"
                      : "bg-gray-100/40 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <div>
                    <Avatar
                      firstName={user.firstName}
                      lastName={user.lastName}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 truncate">
                      {user.email ?? "example@tatahitachi.co.in"}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 truncate">
                      {user.phone ?? "914******7"}
                    </p>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                      selected
                        ? "bg-amber-500 border-amber-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selected && (
                      <span className="text-white text-xs font-bold">✓</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-3">
          <Button text="Cancel" onClick={onClose} status="brand" />
          <Button
            text="Assign Users"
            status="brand"
            onClick={() => handleAssignUser(selectedUsers, workflow?.id)}
          />
        </div>
      </div>
    </Modal>
  );
};
