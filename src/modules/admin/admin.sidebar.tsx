import type { SidebarItem } from "../../layout/layout.types";
import {
  Home,
  Settings,
  Database,
  Users,
  User,
  BriefcaseBusinessIcon,
  ShieldCheck,
} from "lucide-react";

export const adminSidebar: SidebarItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home size={18} />,
    link: "/admin/dashboard",
  },
  {
    id: "users",
    label: "Business Users",
    icon: <Users size={18} />,
    link: "/admin/users",
  },
  {
    id: "profiles",
    label: "User Profiles",
    icon: <User size={18} />,
    link: "/admin/user-profiles",
  },
  {
    id: "app-administrators",
    label: "App Administrators",
    icon: <ShieldCheck size={18} />,
    link: "/admin/app-administrators",
    superAdminOnly: true,
  },
  {
    id: "masters",
    label: "Masters",
    icon: <Database size={18} />,
    link: "/admin/masters",
  },
  {
    id: "business-partners",
    label: "Business Partners",
    icon: <BriefcaseBusinessIcon size={18} />,
    link: "/admin/business-partners",
  },
  {
    id: "bydesign",
    label: "By Design Data",
    icon: <Database size={18} />,
    link: "/admin/bydesign",
  },
  {
    id: "c4c",
    label: "C4C Data",
    icon: <Database size={18} />,
    link: "/admin/c4c",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings size={18} />,
    link: "/admin/profile",
  },
];
