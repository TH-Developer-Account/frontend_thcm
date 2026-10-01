import { useMemo } from "react";

import { useAuth } from "../context/Auth/AuthContext";
import type { SidebarItem } from "../layout/layout.types";

export function useSidebarPermissions(items: SidebarItem[]) {
  const { can, isSuperAdmin } = useAuth();

  return useMemo(() => {
    const isItemAllowed = (item: SidebarItem): boolean => {
      if (item.superAdminOnly && !isSuperAdmin) return false;
      if (!item.permission) return true;

      const { app, module, action = "read" } = item.permission;
      return can(action, app, module);
    };

    const filterItems = (sidebarItems: SidebarItem[]): SidebarItem[] =>
      sidebarItems.flatMap((item) => {
        if (!isItemAllowed(item)) return [];
        if (!item.children) return [item];

        const children = filterItems(item.children);
        return children.length > 0 ? [{ ...item, children }] : [];
      });

    return filterItems(items);
  }, [items, can, isSuperAdmin]);
}
