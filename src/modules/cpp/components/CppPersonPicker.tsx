// A small "type a name, pick a person" box. Used by the approval matrix.
import { useState } from "react";

import { useCppPeopleSearch } from "../hooks/useCppMatrix";
import type { CppPerson } from "../types/cpp.types";

export const personLabel = (person: CppPerson): string =>
	person.name?.trim() || person.email || "Unknown user";

type Props = {
	onPick: (person: CppPerson) => void;
	/** People already chosen — hidden from the list. */
	excludeIds?: string[];
	placeholder?: string;
	autoFocus?: boolean;
	onClose?: () => void;
};

export default function CppPersonPicker({
	onPick,
	excludeIds = [],
	placeholder = "Search by name or email",
	autoFocus = false,
	onClose,
}: Props) {
	const [search, setSearch] = useState("");
	const { data = [], isFetching, isError } = useCppPeopleSearch(search);
	const options = data.filter((person) => !excludeIds.includes(person.id));

	return (
		<div className="relative w-72 max-w-full">
			<input
				type="text"
				value={search}
				autoFocus={autoFocus}
				onChange={(event) => setSearch(event.target.value.slice(0, 60))}
				onKeyDown={(event) => {
					if (event.key === "Escape") onClose?.();
				}}
				placeholder={placeholder}
				aria-label={placeholder}
				className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
			/>
			<ul
				role="listbox"
				className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg"
			>
				{isError ? (
					<li className="px-3 py-2 text-sm text-red-600">Could not load people.</li>
				) : options.length === 0 ? (
					<li className="px-3 py-2 text-sm text-slate-500">
						{isFetching ? "Searching…" : "No matching people"}
					</li>
				) : (
					options.map((person) => (
						<li key={person.id} role="option" aria-selected={false}>
							<button
								type="button"
								className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50"
								onClick={() => {
									onPick(person);
									setSearch("");
								}}
							>
								<span className="text-sm text-slate-800">{personLabel(person)}</span>
								{person.email ? (
									<span className="text-xs text-slate-500">{person.email}</span>
								) : null}
							</button>
						</li>
					))
				)}
			</ul>
		</div>
	);
}
