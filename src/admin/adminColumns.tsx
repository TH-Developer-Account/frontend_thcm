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
