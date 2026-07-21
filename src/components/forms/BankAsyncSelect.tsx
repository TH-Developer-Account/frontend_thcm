// components/forms/BankAsyncSelect.tsx
import React from "react";
import type { FormatOptionLabelMeta } from "react-select";

import { ServerAxios } from "../../services/ServerAxios";
import AsyncSearchSelect, { type AsyncSelectOption } from "./AsyncSearchSelect";

export type BankOption = AsyncSelectOption; // bank name is both value and label here

type Props = {
  value?: BankOption | null;
  onChange: (option: BankOption | null) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
  helperText?: string;
  name?: string;
  isDisabled?: boolean;
  className?: string;
};

const fetchBankOptions = async (query: string): Promise<BankOption[]> => {
  const { data } = await ServerAxios.get(
    `/search/banks?search=${encodeURIComponent(query)}`,
  );
  return (data ?? []).map((bankName: string) => ({
    value: bankName,
    label: bankName,
  }));
};

const formatBankOption = (
  option: BankOption,
  meta: FormatOptionLabelMeta<BankOption>,
) => <span>{option.label}</span>;

const BankAsyncSelect: React.FC<Props> = (props) => (
  <AsyncSearchSelect<BankOption>
    {...props}
    fetchOptions={fetchBankOptions}
    formatOptionLabel={formatBankOption}
  />
);

export default BankAsyncSelect;
