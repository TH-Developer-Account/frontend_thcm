import React, { useState, useMemo, type FC } from "react";
import { PasswordPolicy } from "../../containers/Login/constant";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface PasswordInputProps {
	label?: string;
	name: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // ✅ Add onChange
	placeholder?: string;
	error?: string;
	required?: boolean;
	className?: string;
	onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void; // ✅ Add onFocus
}

const PasswordInput: FC<PasswordInputProps> = ({
	label,
	name,
	value,
	onChange,
	onFocus,
	className = "",
	placeholder = "Enter password",
	error,
	required = false,
	...otherProps
}) => {
	const [showPassword, setShowPassword] = useState(false);

	// ✅ Check if all password rules pass
	const isValid = useMemo(
		() => PasswordPolicy.every((rule) => rule.test(value)),
		[value],
	);

	return (
		<div className="mb-2 sm:col-span-3 mb-4">
			<label
				htmlFor={name}
				className={`text-left block text-sm/6 font-medium text-gray-900
        `}
			>
				{label}
				{required && <span className="text-red-500"> *</span>}
			</label>

			<div className="relative mt-2 flex items-center">
				{/* Input */}
				<input
					id={name}
					name={name}
					placeholder={placeholder}
					value={value}
					onChange={onChange} // controlled
					onFocus={onFocus}
					type={showPassword ? "text" : "password"}
					required={required}
					aria-invalid={!!error}
					aria-describedby={error ? `${name}-error` : undefined}
					className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 
						outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 
						focus:-outline-offset-2 sm:text-sm/6
						${
							error
								? "focus:outline-red-500 outline-red-500 focus:ring-red-500 focus-ring-1 outline-1 placeholder-red-500"
								: "focus:outline-gray-400"
						}
						${isValid && !error && "outline-green-300"}
							${className}
						`}
					{...otherProps}
				/>

				{error ? (
					<ExclamationCircleIcon className="absolute right-3 top-2 h-5 w-5 text-red-500" />
				) : (
					<button
						type="button"
						onClick={() => setShowPassword((prev) => !prev)}
						className=" absolute ml-2 shrink-0 text-gray-500 hover:text-gray-700 top-1.5 right-3"
					>
						{showPassword ? (
							<AiOutlineEyeInvisible size={24} />
						) : (
							<AiOutlineEye size={24} />
						)}
					</button>
				)}
			</div>

			{/* Error message */}
			{error && (
				<p
					id={`${name}-error`}
					className="text-left mt-0 mb-0 text-xs text-red-600 text-left"
				>
					{error}
				</p>
			)}
		</div>
	);
};

export default PasswordInput;
