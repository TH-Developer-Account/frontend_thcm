// Target: modules/marketing/marketing.sidebar.tsx
// sidebar.config.ts
// Every module is a top-level entry. "Activity Planner" is now just the EPC
// listing — Leads, Import/Export, Reports and Artworks used to / would
// otherwise nest under it. Handouts moved out entirely — it's its own app
// now, reached via the Module Selector and its own sidebar
// (handouts.sidebar.tsx), not this one.
import type { SidebarItem } from "../../layout/layout.types";
import {
  Home,
  // Settings,
  Table,
  CalendarDays,
  LayoutDashboard,
  Users,
  Upload,
  Wallpaper,
} from "lucide-react";

export const marketingSidebar: SidebarItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home size={20} />,
    link: "/",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    link: "/marketing/dashboard",
  },
  {
    id: "epc",
    label: "Activity Planner",
    icon: <CalendarDays size={20} />,
    link: "/marketing/activity-planner/listing",
    permission: {
      app: "MAP",
      module: "EPC",
      action: "read",
    },
  },
  {
    id: "lead-list",
    label: "Leads Listing",
    icon: <Users size={20} />,
    link: "/marketing/activity-planner/leads/listing",
    permission: {
      app: "MAP",
      module: "Leads",
      action: "read",
    },
  },
  {
    id: "file-module",
    label: "Import/Export Module",
    icon: <Upload size={20} />,
    link: "/marketing/activity-planner/file-module/listing",
    permission: {
      app: "MAP",
      module: "file-module",
      action: "read",
    },
  },
  {
    id: "reports-module",
    label: "Reports Module",
    icon: <Table size={20} />,
    link: "/marketing/activity-planner/reports/listing",
    permission: {
      app: "MAP",
      module: "reports-module",
      action: "read",
    },
  },
  {
    id: "artworks",
    label: "Artworks",
    icon: <Wallpaper size={20} />,
    link: "/marketing/activity-planner/artworks",
    // TODO (when ARTWORK exists in the profile editor): restrict to the team with
    // permission: { app: "MAP", module: "ARTWORK", action: "read" },
  },
  // {
  // 	id: "settings",
  // 	label: "Settings",
  // 	icon: <Settings size={20} />,
  // 	link: "/marketing/profile",
  // },
];
