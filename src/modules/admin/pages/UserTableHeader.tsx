// UserTableHeader.tsx
import { Search, MoreVertical } from "lucide-react";

interface Props {
	search: string;
	onSearch: (val: string) => void;
}

export function UserTableHeader({ search, onSearch }: Props) {
	return (
		<div className="flex items-center gap-4 px-6 py-4">
			{/* Role Dropdown */}
			<select className="border rounded-xl px-4 py-2 text-sm bg-white">
				<option>Role</option>
			</select>

			{/* Search */}
			<div className="flex-1 relative">
				<Search
					size={18}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
				/>
				<input
					value={search}
					onChange={(e) => onSearch(e.target.value)}
					placeholder="Search..."
					className="w-full border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none"
				/>
			</div>

			<MoreVertical className="text-gray-500 cursor-pointer" />
		</div>
	);
}
