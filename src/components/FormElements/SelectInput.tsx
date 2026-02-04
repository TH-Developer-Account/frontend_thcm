import Select from "react-select";
import type { Props, GroupBase } from "react-select";

export interface Option {
  label: string;
  value: string;
}

interface SelectInputProps extends Props<Option, boolean, GroupBase<Option>> {
  label?: string;
  error?: string;
}

export default function SelectInput({
  label,
  error,
  className,
  ...props
}: SelectInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <Select
        {...props}
        className={`react-select-container ${className ?? ""}`}
        classNamePrefix="react-select"
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: "44px", // mobile friendly
            borderRadius: "0.5rem",
            borderColor: error
              ? "#ef4444"
              : state.isFocused
                ? "#3b82f6"
                : "#d1d5db",
            boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
            "&:hover": {
              borderColor: "#3b82f6",
            },
          }),
          menu: (base) => ({
            ...base,
            borderRadius: "0.5rem",
            zIndex: 50,
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
              ? "#3b82f6"
              : state.isFocused
                ? "#e0e7ff"
                : "white",
            color: state.isSelected ? "white" : "#111827",
            cursor: "pointer",
          }),
        }}
      />

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
