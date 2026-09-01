import { forwardRef } from "react";
import { Search } from "lucide-react";
import type { SearchBoxProps } from "./input.types";

const joinClassNames = (
	...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(" ");

export const SearchInput = forwardRef<HTMLInputElement, SearchBoxProps>(
	(
		{
			value,
			onChange,
			placeholder = "Search...",
			disabled,
			className = "",
			containerClassName = "",
		},
		ref,
	) => (
		<div
			className={joinClassNames(
				"search-input-control",
				disabled && "is-disabled",
				containerClassName,
			)}
		>
			<Search aria-hidden="true" className="search-input-icon" />
			<input
				ref={ref}
				type="search"
				value={value}
				disabled={disabled}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				className={joinClassNames("search-input-field", className)}
			/>
		</div>
	),
);

SearchInput.displayName = "SearchInput";
