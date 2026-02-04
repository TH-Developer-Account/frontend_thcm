import React, {
  type ForwardRefRenderFunction,
  type InputHTMLAttributes,
} from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

// Define the props for the Input component
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string; // Required
  label: string; // Required
  placeholder: string; // Required
  value?: string | number;

  error?: string; // NEW: error message
  helperText?: string; // NEW: helper text
  className?: string;
}

// Create the Input component using ForwardRefRenderFunction
const Input: ForwardRefRenderFunction<HTMLInputElement, InputProps> = (
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
    <div className="mb-4 relative">
      <label
        htmlFor={name}
        className="block text-left text-sm font-medium text-black"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <input
        id={name}
        ref={ref}
        name={name}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`  placeholder-gray-400 placeholder:text-sm py-2 mt-2 font-light text-black
          w-full rounded-lg border px-3 py-2 text-sm outline-none transition
          bg-[#F3F4F6] focus:outline-none focus:ring-1
           ${
             error
               ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500"
               : "border-[#F3F4F6] focus:ring-[#f35a00] focus:ring-2"
           }
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          ${className}
        `}
        {...otherProps}
      />
      {error && (
        <ExclamationCircleIcon className="absolute right-3 top-9 h-5 w-5 text-red-500" />
      )}
      {/* Error message */}
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-red-600 text-left">
          {error}
        </p>
      )}
    </div>
  );
};

// Wrap the Input component with React.forwardRef
const FormInput = React.forwardRef(Input);

export default FormInput;
