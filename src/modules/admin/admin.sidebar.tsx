import type { SidebarItem } from "../../layout/layout.types";
import {
  Home,
  Settings,
  Database,
  // MapPinHouse,
  Users,
  User,
  BriefcaseBusinessIcon,
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
    link: "/admin/user_profiles",
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
    id: "business-partners-view",
    label: "Business Partner View",
    icon: <BriefcaseBusinessIcon size={18} />,
    link: "/admin/business-partners-view",
  },
  {
    id: "workflows",
    label: "Workflows",
    icon: <BriefcaseBusinessIcon size={18} />,
    link: "/admin/workflows",
  },
  {
    id: "organisation",
    label: "Organisation",
    icon: <BriefcaseBusinessIcon size={18} />,
    link: "/admin/organisation",
  },
  {
    id: "dealers",
    label: "Dealers",
    icon: <BriefcaseBusinessIcon size={18} />,
    link: "/admin/dealers",
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
