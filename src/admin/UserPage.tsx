import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { userApi } from "./userApi";
import type { TableUser } from "../utils/types";
import DataTable from "../components/ui/DataTable";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { UserForm } from "./UserForm";
import Button from "../components/common/Button";
import { Pencil, Trash } from "lucide-react";
import { mockUsers } from "./mockUsers";

export default function UsersPage() {
	const [users, setUsers] = useState<TableUser[]>(mockUsers);
	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState<TableUser | null>(null);

	// ✅ Proper API reload
	const loadUsers = async () => {
		const data = await userApi.getAll();
		setUsers(data);
	};

	const handleCreate = async (data: Omit<TableUser, "id">) => {
		await userApi.create(data);
		setOpen(false);
		await loadUsers();
	};

	const handleUpdate = async (data: Omit<TableUser, "id">) => {
		if (!editing) return;
		await userApi.update(editing.id, data);
		setEditing(null);
		await loadUsers();
	};

	const handleDelete = async (id: number) => {
		await userApi.delete(id);
		await loadUsers();
	};

	// ✅ TanStack ColumnDef
	const columns = useMemo<ColumnDef<TableUser>[]>(
		() => [
			{
				accessorKey: "name",
				header: "Name",
				cell: ({ row }) => {
					const user = row.original;
					return (
						<div className="flex items-center gap-3">
							<img
								src={user.avatar}
								className="w-9 h-9 rounded-full"
								alt={user.name}
							/>
							<div>
								<div className="font-medium">{user.name}</div>
								<div className="text-xs text-gray-500">{user.email}</div>
							</div>
						</div>
					);
				},
			},
			{
				accessorKey: "phone",
				header: "Phone number",
			},
			{
				accessorKey: "company",
				header: "Company",
			},
			{
				accessorKey: "role",
				header: "Role",
			},
			{
				accessorKey: "status",
				header: "Status",
				cell: ({ row }) => <Badge status={row.original.status || "Approved"} />,
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => {
					const user = row.original;
					return (
						<div className="flex gap-2">
							<Button
								text=""
								Icon={Pencil}
								onClick={() => setEditing(user)}
								iconPosition="right"
								disabled
							/>
							<Button
								text=""
								Icon={Trash}
								onClick={() => handleDelete(user.id)}
								iconPosition="right"
								disabled
							/>
						</div>
					);
				},
			},
		],
		[],
	);

	return (
		<div className="page">
			<Button text="+ Add User" onClick={() => setOpen(true)} />

			<DataTable<TableUser>
				data={users}
				columns={columns}
				scrollTargetId="tableScroll"
				emptyTitle="No user records found"
				emptyDescription="Try adjusting filters or search"
			/>

			<Modal open={open} onClose={() => setOpen(false)}>
				<div className="max-w-[600px] mx-auto p-6 bg-white rounded-xl text-sm">
					<UserForm onSubmit={handleCreate} />
				</div>
			</Modal>

			<Modal open={!!editing} onClose={() => setEditing(null)}>
				<div className="max-w-[600px] mx-auto p-6 bg-white rounded-xl text-sm">
					<UserForm initial={editing || undefined} onSubmit={handleUpdate} />
				</div>
			</Modal>
		</div>
	);
}
