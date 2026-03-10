import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Modal } from "../../../../components/common/Modal";
import Button from "../../../../components/common/Button";
import { mapUser, type User } from "../types/profile.types";
import { ServerAxios } from "../../../../services/ServerAxios";
import Avatar from "../../../../components/common/Avatar";
// import { Badge } from "../../../../components/common/Badge";
import { SearchInput } from "../../../../components/FormElements/SearchInput";
import { CircleX } from "lucide-react";

type AssignProps = {
	profileId: string | null;
	onClose: () => void;
	handleAssignUser: (
		userIds: string[],
		profileId: string | null,
	) => Promise<void>;
};

type UserRowProps = {
  user: User;
  selected: boolean;
  toggleUser: (id: string) => void;
};

const UserRow = React.memo(({ user, selected, toggleUser }: UserRowProps) => {
  return (
    <div
      onClick={() => toggleUser(user.id)}
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
        selected
          ? "bg-amber-500/5 border-amber-500/30"
          : "bg-gray-100/40 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
      }`}
    >
      <Avatar firstName={user.firstName} lastName={user.lastName} />

      <div className="min-w-0">
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
          selected ? "bg-amber-500 border-amber-500" : "border-gray-300"
        }`}
      >
        {selected && <span className="text-white text-xs font-bold">✓</span>}
      </div>
    </div>
  );
});

export const AssignUsers: React.FC<AssignProps> = ({
	profileId,
	onClose,
	handleAssignUser,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

	// Filter users
	const filteredUsers = useMemo(() => {
		return users.filter((user) =>
			user.firstName?.toLowerCase().includes(search.toLowerCase()),
		);
	}, [users, search]);

    const controller = new AbortController();

    const loadUsers = async () => {
      try {
        setLoading(true);

        const [usersRes, profileRes] = await Promise.all([
          ServerAxios.get("/users", { signal: controller.signal }),
          ServerAxios.get(`/profile/${profileId}`, {
            signal: controller.signal,
          }),
        ]);

        const mappedUsers: User[] = usersRes.data.map(mapUser);
        setUsers(mappedUsers);

        const selectedIds = new Set<string>(
          profileRes.data.users.map((u: User) => u.id),
        );

        setSelectedUsers(selectedIds);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch users", err);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUsers();

    return () => controller.abort();
  }, [profileId]);

  const toggleUser = useCallback((id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase();

    return users.filter((user) =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(query),
    );
  }, [users, search]);

  const handleSubmit = () => {
    handleAssignUser([...selectedUsers], profileId);
  };

  return (
    <Modal open={!!profileId} onClose={onClose}>
      <div className="w-[1000px] max-h-[520px] flex flex-col mx-auto bg-white p-4 rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <span>👥</span> Assign Users
          </h2>
          <Badge variant="primary">Users</Badge>
        </div>

        {/* Search */}
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} />
        </div>

        {/* Content */}
        <div className="space-y-2 overflow-y-auto p-6 flex-1">
          {loading ? (
            <p className="text-sm text-gray-400">Loading users...</p>
          ) : (
            filteredUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                selected={selectedUsers.has(user.id)}
                toggleUser={toggleUser}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-3">
          <Button text="Cancel" variant="primary" onClick={onClose} />
          <Button text="Assign Users" status="Brand" onClick={handleSubmit} />
        </div>
      </div>
    </Modal>
  );
};
