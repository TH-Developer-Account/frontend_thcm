// components/common/SearchBox.tsx

import React, { forwardRef } from "react";
import { Search, X } from "lucide-react";
import type { SearchBoxProps } from "./input.types";

export const SearchInput = forwardRef<HTMLInputElement, SearchBoxProps>(
	(
		{
			value,
			onChange,
			onClear,
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
					className={`flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-xs outline-none focus::border-none  ${containerClassName}`}
				>
					{/* Left Icon */}
					<Search size={18} className="text-orange-600 mr-2" />

					{/* Input */}
					<input
						ref={ref}
						type="text"
						value={value}
						disabled={disabled}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
						className={`flex-1 bg-transparent text-xs  focus:outline-none focus:border-amber-500${className}`}
					/>

					{/* Clear Button */}
					{value && (
						<button
							onClick={onClear}
							className="ml-2 text-gray-400 hover:text-gray-600"
							type="button"
						>
							<X size={16} />
						</button>
					)}

					{/* Optional Right Element */}
					{/* {rightElement && <div className="ml-2">{rightElement}</div>} */}
				</div>
			</React.Fragment>
		);
	},
);

SearchInput.displayName = "SearchInput";
