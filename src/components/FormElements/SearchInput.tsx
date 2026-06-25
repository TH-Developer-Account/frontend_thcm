// components/common/SearchBox.tsx

import React, { forwardRef } from "react";
import { Search } from "lucide-react";
import type { SearchBoxProps } from "./input.types";

export const SearchInput = forwardRef<HTMLInputElement, SearchBoxProps>(
	(
		{
			value,
			onChange,
			placeholder = "Search...",
			disabled,
			className,
			containerClassName,
			// rightElement,
		},
		ref,
	) => {
		return (
			<React.Fragment>
				<div
					className={`flex items-center bg-white border border-gray-300 rounded-xl px-2 py-1.5 shadow-xs outline-none focus::border-none  ${containerClassName}`}
				>
					{/* Left Icon */}
					<Search size={14} className="text-orange-600 mr-2" />

					{/* Input */}
					<input
						ref={ref}
						type="search"
						value={value}
						disabled={disabled}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
						className={`flex-1 bg-transparent text-xs  focus:outline-none focus:border-amber-500${className}`}
					/>
				</div>
			</React.Fragment>
		);
	},
);

SearchInput.displayName = "SearchInput";
