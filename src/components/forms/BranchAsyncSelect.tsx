// components/forms/BranchAsyncSelect.tsx
import React from "react";
import type { FormatOptionLabelMeta } from "react-select";

import { ServerAxios } from "../../services/ServerAxios";
import AsyncSearchSelect, { type AsyncSelectOption } from "./AsyncSearchSelect";

export type BranchOption = AsyncSelectOption & {
  ifsc: string;
  address: string;
  city: string;
};

type Props = {
  bankName: string | null; // branch search is scoped to a chosen bank
  value?: BranchOption | null;
  onChange: (option: BranchOption | null) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
  helperText?: string;
  name?: string;
  className?: string;
};

const BranchAsyncSelect: React.FC<Props> = ({ bankName, ...props }) => {
  // fetchOptions must be re-created when bankName changes so the effect
  // in AsyncSearchSelect re-runs the search against the new bank's branches.
  const fetchBranchOptions = React.useCallback(
    async (query: string): Promise<BranchOption[]> => {
      if (!bankName) return [];
      const { data } = await ServerAxios.get(
        `/search/banks/${encodeURIComponent(bankName)}/branches?search=${encodeURIComponent(query)}`,
      );
      return (data ?? []).map((branch: any) => ({
        value: branch.ifsc,
        label: branch.branch_name,
        ifsc: branch.ifsc,
        address: branch.address,
        city: branch.city,
      }));
    },
    [bankName],
  );

  const formatBranchOption = (
    option: BranchOption,
    meta: FormatOptionLabelMeta<BranchOption>,
  ) => {
    if (meta.context === "value") return <span>{option.label}</span>;
    return (
      <div className="select-option-content">
        <div className="select-option-primary">{option.label}</div>
        <div className="select-option-secondary">
          {[option.city, option.ifsc].filter(Boolean).join(" · ")}
        </div>
      </div>
    );
  };

  return (
    <AsyncSearchSelect<BranchOption>
      {...props}
      isDisabled={!bankName}
      fetchOptions={fetchBranchOptions}
      formatOptionLabel={formatBranchOption}
    />
  );
};

export default BranchAsyncSelect;
