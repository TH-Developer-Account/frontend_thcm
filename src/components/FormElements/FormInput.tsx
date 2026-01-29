import React, {
  type ForwardRefRenderFunction,
  type InputHTMLAttributes,
} from "react";

// Define the props for the Input component
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string; // Required name prop for the input
  placeholder: string; // Required placeholder prop for the input
  value?: string | number; // Optional value prop for the input
  label: string; // Required label prop for the input
  error?: string; // Optional error message prop
}

// Create the Input component using ForwardRefRenderFunction
const Input: ForwardRefRenderFunction<HTMLInputElement, InputProps> = (
  { name, label, placeholder, value, ...otherProps },
  ref,
) => {
  return (
    <label className="block text-left text-sm font-medium text-black mb-4">
      {label}
      <input
        className="w-full px-4 mt-2 py-2 border rounded-lg font-light border-color-[#dad6d6] bg-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#f35a00] text-black"
        {...otherProps} // Spread other input attributes
        name={name} // Set the name attribute
        ref={ref}
        placeholder={placeholder} // Set the placeholder attribute
        value={value} // Set the value attribute
      />
    </label>
  );
};

// Wrap the Input component with React.forwardRef
const FormInput = React.forwardRef(Input);

// Export the FormInput component for use in other files
export default FormInput;
