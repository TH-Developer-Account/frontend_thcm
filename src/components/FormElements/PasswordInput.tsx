import React, { useState, useMemo, type FC } from "react";
import { PasswordPolicy } from "./PasswordPolicy";
import { CiCircleCheck } from "react-icons/ci";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

interface PasswordInputProps {
  label: string;
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
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Check if all password rules pass
  const isValid = useMemo(
    () => PasswordPolicy.every((rule) => rule.test(value)),
    [value]
  );

  return (
    <div className="mb-4">
    <label
        htmlFor={name}
        className="block text-left text-sm font-medium text-black"
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
        className={`  placeholder-gray-400 placeholder:text-sm"
            w-full px-4 py-2 rounded-lg font-light text-black
            bg-[#F3F4F6] focus:outline-none focus:ring-1
            ${error
            ? "border border-red-500 focus:ring-red-500"
            : "border border-[#dad6d6] focus:ring-[#f35a00]"}
            ${isValid ? "border-green-500 focus:ring-green-500" : ""}
            ${className}
        `}
        />

        {/* Green tick */}
        {isValid && !error && (
        <CiCircleCheck className="w-5 h-5 text-green-500 absolute right-10 top-1/2 -translate-y-1/2" />
        )}
        {/* Show/Hide toggle */}
        <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="ml-2 flex-shrink-0 text-gray-500 hover:text-gray-700"
        >
        {showPassword ? (
            <AiOutlineEyeInvisible size={24} />
        ) : (
            <AiOutlineEye size={24} />
        )}
        </button>

    </div>

    {/* Error message */}
    {error && (
        <p id={`${name}-error`} className="text-left mt-1 text-xs text-red-600 text-left">
        {error}
        </p>
    )}
    </div>
  );
};

export default PasswordInput;
