import { useMemo } from "react";
import { useAuth } from "../context/Auth/AuthContext";
import type { SidebarItem } from "../layout/layout.types";

export function useSidebarPermissions(items: SidebarItem[]) {
  const { can, isSuperAdmin } = useAuth();

  return useMemo(() => {
    const filterItems = (items: SidebarItem[]): SidebarItem[] => {
      return items
        .map((item) => {
          if (item.permission && !isSuperAdmin) {
            console.log({ item });
            const { app, module, action = "read" } = item.permission;

            const allowed = can(action, app, module);

            if (!allowed) return null;
          }

          if (item.children) {
            const children = filterItems(item.children);

            if (children.length === 0) return null;

            return {
              ...item,
              children,
            };
          }

          return item;
        })
        .filter((item): item is SidebarItem => item !== null);
    };

    return filterItems(items);
  }, [items, can, isSuperAdmin]);
}
