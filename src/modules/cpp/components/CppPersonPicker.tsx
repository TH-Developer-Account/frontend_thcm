// "Type a name, pick a person" for the approval matrix. Built on the shared
// SelectInput; searches the matrix's own user endpoint (same workspace, active users).
import { useMemo, useState } from "react";

import SelectInput from "../../../components/forms/SelectInput";
import { useCppPeopleSearch } from "../hooks/useCppMatrix";
import type { CppPerson } from "../types/cpp.types";

export const personLabel = (person: CppPerson): string =>
	person.name?.trim() || person.email || "Unknown user";

type PersonOption = { value: string; label: string; person: CppPerson };

type Props = {
	onPick: (person: CppPerson) => void;
	/** People already chosen — hidden from the list. */
	excludeIds?: string[];
	label?: string;
	placeholder?: string;
	autoFocus?: boolean;
	onClose?: () => void;
};

export default function CppPersonPicker({
	onPick,
	excludeIds = [],
	label,
	placeholder = "Search by name or email",
	autoFocus = false,
	onClose,
}: Props) {
	const [search, setSearch] = useState("");
	const { data = [], isFetching, isError } = useCppPeopleSearch(search);

	const options = useMemo<PersonOption[]>(
		() =>
			data
				.filter((person) => !excludeIds.includes(person.id))
				.map((person) => ({
					value: person.id,
					label: personLabel(person),
					person,
				})),
		[data, excludeIds],
	);

	return (
		<div className="w-72 max-w-full">
			<SelectInput<PersonOption>
				label={label}
				value={null}
				options={options}
				placeholder={placeholder}
				autoFocus={autoFocus}
				openMenuOnFocus={autoFocus}
				inputValue={search}
				onInputChange={(next, meta) => {
					if (meta.action === "input-change") setSearch(next.slice(0, 60));
				}}
				// The server already filtered by the search text.
				filterOption={null}
				isLoading={isFetching}
				selectOnAutofill={false}
				noOptionsMessage={() =>
					isError
						? "Could not load people"
						: isFetching
							? "Searching…"
							: "No matching people"
				}
				formatOptionLabel={(option) => (
					<div className="select-option-content">
						<div className="select-option-primary">{option.label}</div>
						{option.person.email ? (
							<div className="select-option-secondary">
								{option.person.email}
							</div>
						) : null}
					</div>
				)}
				onChange={(option) => {
					if (!option) return;
					onPick(option.person);
					setSearch("");
				}}
				onMenuClose={() => {
					if (!search) onClose?.();
				}}
				onKeyDown={(event) => {
					if (event.key === "Escape") onClose?.();
				}}
			/>
		</div>
	);
}
