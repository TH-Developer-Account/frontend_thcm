import React, { type ForwardRefRenderFunction } from "react";
import type { TextareaProps } from "./input.types";

const Textarea: ForwardRefRenderFunction<HTMLTextAreaElement, TextareaProps> = (
	{
		name,
		label,
		placeholder,
		value,
		error,
		className = "",
		required,
		disabled,
		...otherProps
	},
	ref,
) => {
	return (
		<div className="mb-4 relative ">
			<label
				htmlFor={name}
				className="text-left block text-sm/6 font-medium text-gray-900"
			>
				{label}
				{required && <span className="text-red-500"> *</span>}
			</label>
			<div className="mt-2">
				<textarea
					id={name}
					ref={ref}
					name={name}
					placeholder={placeholder}
					value={value}
					disabled={disabled}
					rows={4}
					maxLength={500}
					aria-invalid={!!error}
					aria-describedby={error ? `${name}-error` : undefined}
					className={`block resize-none w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6
            ${
							error
								? "focus:outline-red-500 outline-red-500 focus:ring-red-500"
								: "focus:outline-gray-400"
						}
            ${disabled ? "opacity-60 cursor-not-allowed" : ""}
            ${className}
          `}
					{...otherProps}
				/>
			</div>

			{error && (
				<p id={`${name}-error`} className="mt-1 text-xs text-red-600 text-left">
					{error}
				</p>
			)}
		</div>
	);
};

const TextareaInput = React.forwardRef(Textarea);

export default TextareaInput;
