import React, {
  type ForwardRefRenderFunction,
  type InputHTMLAttributes,
} from "react";

// Define the props for the Input component
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string;                 // Required
  label: string;                // Required
  placeholder: string;          // Required
  value?: string | number;

  error?: string;               // NEW: error message
  helperText?: string;          // NEW: helper text
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
    helperText,
    className = "",
    required,
    disabled,
    ...otherProps
  },
  ref
) => {
  return (
    <div className="mb-4">
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
        className={`  placeholder-gray-400 placeholder:text-sm"
          w-full px-4 py-2 mt-2 rounded-lg font-light text-black
          bg-[#F3F4F6] focus:outline-none focus:ring-1
          ${error
            ? "border border-red-500 focus:ring-red-500"
            : "border border-[#F3F4F6] focus:ring-[#f35a00]"}
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          ${className}
        `}
        {...otherProps}
      />

      {/* Helper text */}
      {!error && helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}

      {/* Error message */}
      {error && (
        <p
          id={`${name}-error`}
          className="mt-1 text-xs text-red-600 text-left"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Wrap the Input component with React.forwardRef
const FormInput = React.forwardRef(Input);

export default FormInput;
