import React from "react";
import Select from "react-select";
import type { SingleValue, FormatOptionLabelMeta } from "react-select";
import { ServerAxios } from "../../services/ServerAxios";
import { useDebounce } from "../../hooks/useDebounce";

export type PincodeOption = {
  value: string;
  label: string;
  pincode: string;
  officeName: string;
  district: string;
  stateName: string;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  value?: PincodeOption | null;
  onChange: (option: PincodeOption | null) => void;
  placeholder?: string;
  isClearable?: boolean;
  error?: string;
  label?: string;
};

const PincodeAsyncSelect: React.FC<Props> = ({
  value,
  onChange,
  error,
  placeholder = "Search...",
  isClearable = true,
  label,
}) => {
  const [inputValue, setInputValue] = React.useState("");
  const [options, setOptions] = React.useState<PincodeOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const debouncedInput = useDebounce(inputValue, 400);

  React.useEffect(() => {
    const fetchPincodes = async () => {
      if (debouncedInput.length < 2) {
        setOptions([]);
        return;
      }

      setIsLoading(true);

      try {
        const { data } = await ServerAxios.get(
          `/pincodes/search?q=${encodeURIComponent(debouncedInput)}&limit=10`,
        );

        const formatted: PincodeOption[] = data.data.map((item: any) => ({
          value: item.id,
          label: item.label,
          pincode: item.pincode,
          officeName: item.officeName,
          district: item.district,
          stateName: item.stateName,
          latitude: item.latitude,
          longitude: item.longitude,
        }));

        setOptions(formatted);
      } catch (err) {
        console.error("Pincode search failed:", err);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPincodes();
  }, [debouncedInput]);

  const formatOptionLabel = (
    option: PincodeOption,
    meta: FormatOptionLabelMeta<PincodeOption>,
  ) => {
    if (meta.context === "value") {
      return <span>{option.label}</span>;
    }

    return (
      <div>
        <div className="font-medium">{option.officeName}</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {[option.district, option.stateName, option.pincode]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
    );
  };

  return (
    <React.Fragment>
      {label && (
        <label className="text-xs font-semibold text-zinc-600">{label}</label>
      )}
      <Select<PincodeOption>
        inputValue={inputValue}
        onInputChange={(val, { action }) => {
          if (action === "input-change") {
            setInputValue(val);
          }
        }}
        value={value ?? null}
        options={options}
        isLoading={isLoading}
        onChange={(selected: SingleValue<PincodeOption>) => {
          onChange(selected as PincodeOption | null);
          setInputValue(""); // clear search term — selected label takes over via `value`
          setOptions([]); // clear stale dropdown options
        }}
        isClearable={isClearable}
        placeholder={placeholder}
        filterOption={null}
        noOptionsMessage={({ inputValue: q }) =>
          q.length < 2 ? "Type at least 2 characters" : "No results found"
        }
        className={error ? "form-input-error" : ""}
        classNamePrefix="react-select"
        menuPortalTarget={document.body}
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          menu: (base) => ({ ...base, zIndex: 9999 }),
        }}
        formatOptionLabel={formatOptionLabel}
      />
      {error && <span className="mt-1 text-xs text-red-500">{error}</span>}
    </React.Fragment>
  );
};

export default PincodeAsyncSelect;
