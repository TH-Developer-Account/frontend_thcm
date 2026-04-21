import Select from "react-select";
import type { Props, GroupBase } from "react-select";

export interface BaseOption {
  label: string;
  value: string;
}

interface SelectInputProps<T extends BaseOption> extends Props<
  T,
  false,
  GroupBase<T>
> {
  label?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
}

export default function SelectInput<T extends BaseOption>({
  label,
  error,
  required,
  className,
  helperText,
  isDisabled,
  ...props
}: SelectInputProps<T>) {
  return (
    <div className="form-field">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="form-required"> *</span>}
        </label>
      )}

      <div className="form-input-wrapper relative">
        <Select<T, false, GroupBase<T>>
          {...props}
          value={props.value}
          onChange={props.onChange}
          isDisabled={isDisabled}
          classNamePrefix="react-select"
          menuPortalTarget={
            typeof window !== "undefined" ? document.body : undefined
          }
          menuPosition="fixed"
          menuPlacement="auto"
          styles={{
            menuPortal: (base) => ({
              ...base,
              zIndex: 9999,
            }),
          }}
          className={`form-select-wrap ${className} ${
            error ? "form-input-error" : ""
          }`}
        />
      </div>

      {error && <p className="mt-1 text-xs text-red-600 text-left">{error}</p>}
      {!error && helperText && <p className="form-helper-text">{helperText}</p>}
    </div>
  );
}
