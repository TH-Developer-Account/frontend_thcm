import { useQuery } from "@tanstack/react-query";

import { useDebounce } from "../../../hooks/useDebounce";
import { userApi, userKeys } from "./users.api";

const SEARCH_DEBOUNCE_MS = 300;

// Server-side search for pickers (e.g. Assign Users): the top matches for a
// term, no paging UI.
export const useUserSearch = (search: string, enabled = true) => {
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);

  return useQuery({
    queryKey: userKeys.search(debouncedSearch),
    queryFn: ({ signal }) =>
      userApi.getUsers({ search: debouncedSearch, signal }),
    enabled,
  });
};
