// components/forms/UserAsyncSelect.tsx
import React, { useMemo } from "react";

import { ServerAxios } from "../../services/ServerAxios";
import type { UserResponse } from "../../modules/admin/user-profile/types/profile.types";
import AsyncSearchSelect, { type AsyncSelectOption } from "./AsyncSearchSelect";

export type UserOption = AsyncSelectOption & {
  email?: string;
  firstName?: string;
  lastName?: string;
};

type Props = {
  name?: string;
  value?: UserOption | null;
  onChange: (user: UserOption | null) => void;
  excludedUserIds?: string[];
  placeholder?: string;
  isClearable?: boolean;
  isDisabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  className?: string;
};

const UserAsyncSelect: React.FC<Props> = ({
  excludedUserIds = [],
  placeholder = "Search users...",
  ...props
}) => {
  // Stable key so the fetcher only changes identity when the excluded set
  // actually changes, not on every render.
  const excludedUserIdKey = excludedUserIds.join("|");

  const fetchUserOptions = useMemo(() => {
    return async (
      query: string,
      signal: AbortSignal,
    ): Promise<UserOption[]> => {
      const excludedSet = new Set(
        excludedUserIdKey ? excludedUserIdKey.split("|") : [],
      );
      const { data } = await ServerAxios.get<UserResponse[]>("/users", {
        params: { search: query },
        signal,
      });
      return data
        .filter((user) => !excludedSet.has(user.id))
        .map<UserOption>((user) => ({
          value: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          label: `${user.first_name} ${user.last_name}`.trim(),
          email: user.email,
        }));
    };
  }, [excludedUserIdKey]);

  const formatUserOption = (option: UserOption) => (
    <div className="select-option-content">
      <div className="select-option-primary">{option.label}</div>
      {option.email && (
        <div className="select-option-secondary">{option.email}</div>
      )}
    </div>
  );

  return (
    <AsyncSearchSelect<UserOption>
      {...props}
      placeholder={placeholder}
      minChars={1}
      isTooltip={false}
      loadingMessage="Searching users..."
      noResultsMessage="No matching users found"
      fetchOptions={fetchUserOptions}
      formatOptionLabel={formatUserOption}
    />
  );
};

export default UserAsyncSelect;
