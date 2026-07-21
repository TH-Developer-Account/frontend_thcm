// components/forms/PincodeAsyncSelect.tsx
import React from "react";
import type { FormatOptionLabelMeta } from "react-select";

import { ServerAxios } from "../../services/ServerAxios";
import AsyncSearchSelect, { type AsyncSelectOption } from "./AsyncSearchSelect";

export type PincodeOption = AsyncSelectOption & {
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
  required?: boolean;
  helperText?: string;
  isTooltip?: boolean;
  name?: string;
  isDisabled?: boolean;
  className?: string;
};

const fetchPincodeOptions = async (query: string): Promise<PincodeOption[]> => {
  const { data } = await ServerAxios.get(
    `/search/pincodes?q=${encodeURIComponent(query)}&limit=10`,
  );
  return (data.data ?? []).map((item: any) => ({
    value: item.id,
    label: item.label,
    pincode: item.pincode,
    officeName: item.officeName,
    district: item.district,
    stateName: item.stateName,
    latitude: item.latitude,
    longitude: item.longitude,
  }));
};

const formatPincodeOption = (
  option: PincodeOption,
  meta: FormatOptionLabelMeta<PincodeOption>,
) => {
  if (meta.context === "value") return <span>{option.label}</span>;
  return (
    <div className="select-option-content">
      <div className="select-option-primary">{option.officeName}</div>
      <div className="select-option-secondary">
        {[option.district, option.stateName, option.pincode]
          .filter(Boolean)
          .join(" · ")}
      </div>
    </div>
  );
};

const PincodeAsyncSelect: React.FC<Props> = (props) => (
  <AsyncSearchSelect<PincodeOption>
    {...props}
    fetchOptions={fetchPincodeOptions}
    formatOptionLabel={formatPincodeOption}
  />
);

export default PincodeAsyncSelect;
