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
    <div className="relative sm:col-span-3 mb-4">
      <label
        htmlFor={name}
        className="text-left block text-sm/6 font-medium text-gray-900"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="mt-2">
      <input
        id={name}
        ref={ref}
        name={name}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6
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
        <ExclamationCircleIcon className="absolute right-3 top-10 h-5 w-5 text-red-500" />
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
