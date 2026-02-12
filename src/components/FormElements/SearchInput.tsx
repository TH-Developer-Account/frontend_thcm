// components/common/SearchBox.tsx

import React, { forwardRef } from "react";
import { Search, X } from "lucide-react";

type SearchBoxProps = {
	value: string;
	onChange: (value: string) => void;
	onClear?: () => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	containerClassName?: string;
	// rightElement?: React.ReactNode; // for filters / buttons
};

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
			<div
				className={`flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-xs outline-none focus::border-none focus-within:ring-2 focus-within:ring-orange-600 ${containerClassName}`}
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
					className={`flex-1 bg-transparent text-xs focus:outline-none ${className}`}
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
		);
	},
);

SearchInput.displayName = "SearchInput";
