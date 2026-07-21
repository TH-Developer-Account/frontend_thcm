// components/forms/AsyncSearchSelect.tsx
import React, { useId } from "react";
import Select from "react-select";
import type { SingleValue, FormatOptionLabelMeta } from "react-select";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import { useDebounce } from "../../hooks/useDebounce";
import HelperTooltip from "../common/HelperTooltip";

export type AsyncSelectOption = {
  value: string;
  label: string;
};

type Props<TOption extends AsyncSelectOption> = {
  value?: TOption | null;
  onChange: (option: TOption | null) => void;
  // signal lets fetchOptions pass AbortController.signal through to the
  // underlying request, so a superseded search is actually cancelled,
  // not just ignored.
  fetchOptions: (query: string, signal: AbortSignal) => Promise<TOption[]>;
  formatOptionLabel: (
    option: TOption,
    meta: FormatOptionLabelMeta<TOption>,
  ) => React.ReactNode;
  minChars?: number;
  debounceMs?: number;
  placeholder?: string;
  isClearable?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  helperText?: string;
  isTooltip?: boolean;
  loadingMessage?: string;
  noResultsMessage?: string;
  name?: string;
  isDisabled?: boolean;
  className?: string;
};

const joinClassNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

function AsyncSearchSelect<TOption extends AsyncSelectOption>({
  value,
  onChange,
  fetchOptions,
  formatOptionLabel,
  minChars = 2,
  debounceMs = 400,
  error,
  placeholder = "Search...",
  isClearable = true,
  label,
  required = false,
  helperText,
  isTooltip = true,
  loadingMessage = "Searching...",
  noResultsMessage = "No results found",
  name,
  isDisabled = false,
  className = "",
}: Props<TOption>) {
  const generatedId = useId();
  const inputId = name ?? `async-select-${generatedId}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const [inputValue, setInputValue] = React.useState("");
  const [options, setOptions] = React.useState<TOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const debouncedInput = useDebounce(inputValue.trim(), debounceMs);

  React.useEffect(() => {
    if (debouncedInput.length < minChars || isDisabled) {
      setOptions([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let requestIsActive = true;
    setIsLoading(true);

    const runSearch = async () => {
      try {
        const results = await fetchOptions(debouncedInput, controller.signal);
        if (requestIsActive) setOptions(results);
      } catch (err) {
        if (!requestIsActive || controller.signal.aborted) return;
        console.error("Async select search failed:", err);
        setOptions([]);
      } finally {
        if (requestIsActive) setIsLoading(false);
      }
    };

    void runSearch();

    return () => {
      requestIsActive = false;
      controller.abort();
    };
  }, [debouncedInput, minChars, isDisabled, fetchOptions]);

  const describedBy = [
    error ? errorId : undefined,
    helperText && !isTooltip ? helperId : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={joinClassNames(
        "form-field select-field",
        error && "has-error",
        isDisabled && "is-disabled",
      )}
    >
      {label ? (
        <div className="form-label-row">
          <label htmlFor={inputId} className="form-label">
            {label}
            {required ? (
              <span className="form-required" aria-hidden="true">
                *
              </span>
            ) : null}
          </label>
          {helperText && isTooltip && !error ? (
            <HelperTooltip label={label} text={helperText} />
          ) : null}
        </div>
      ) : null}

      <div className="form-input-wrapper">
        <Select<TOption>
          inputId={inputId}
          name={name}
          inputValue={inputValue}
          onInputChange={(nextValue, { action }) => {
            if (action === "input-change") setInputValue(nextValue);
          }}
          value={value ?? null}
          options={options}
          isLoading={isLoading}
          onChange={(selected: SingleValue<TOption>) => {
            onChange(selected ?? null);
            setInputValue("");
            setOptions([]);
          }}
          isClearable={isClearable}
          isDisabled={isDisabled}
          placeholder={placeholder}
          filterOption={null}
          noOptionsMessage={({ inputValue: query }) =>
            query.trim().length < minChars
              ? `Type at least ${minChars} character${minChars === 1 ? "" : "s"}`
              : noResultsMessage
          }
          loadingMessage={() => loadingMessage}
          unstyled
          classNamePrefix="react-select"
          className={joinClassNames(
            "react-select-container",
            error && "react-select-container-error",
            className,
          )}
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : undefined
          }
          menuPosition="fixed"
          menuPlacement="auto"
          formatOptionLabel={formatOptionLabel}
          aria-invalid={error ? "true" : undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy || undefined}
        />
        {error ? (
          <ExclamationCircleIcon
            aria-hidden="true"
            className="form-error-icon select-error-icon"
          />
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="form-error-text" role="alert">
          {error}
        </p>
      ) : helperText && !isTooltip ? (
        <p id={helperId} className="form-helper-text">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export default AsyncSearchSelect;
