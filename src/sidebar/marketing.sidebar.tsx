import type { SidebarItem } from "../layout/layout.types";
import { LayoutDashboard, CalendarDays, Package } from "lucide-react";

export const marketingSidebar: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard />,
    link: "/marketing/dashboard",
  },
  {
    id: "epc",
    label: "EPC",
    icon: <CalendarDays />,
    link: "/marketing/epc",
  },
  {
    id: "epf",
    label: "EPF",
    icon: <CalendarDays />,
    link: "/marketing/epf",
  },
  {
    id: "crf",
    label: "CRF",
    icon: <Package />,
    link: "/marketing/crf",
  },
];

