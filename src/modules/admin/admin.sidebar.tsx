import type { SidebarItem } from "../../layout/layout.types";
import {
  Home,
  Settings,
  Table,
  Database,
  MapPinHouse,
  Users,
  User,
} from "lucide-react";

export const adminSidebar: SidebarItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home />,
    link: "/admin/dashboard",
    roles: ["ADMIN", "DEALER", "EMPLOYEE"],
  },
  {
    id: "user_management",
    label: "User Management",
    icon: <Database />,
    link: "/admin/masters",
    roles: ["ADMIN"],
  },
  {
    id: "users",
    label: "Business Users",
    icon: <Users />,
    link: "/admin/users",
    roles: ["ADMIN"],
  },
  {
    id: "department",
    label: "Department",
    icon: <Table />,
    link: "/admin/department",
    roles: ["ADMIN", "DEALER"],
  },
  {
    id: "profiles",
    label: "User Profiles",
    icon: <User />,
    link: "/admin/user_profiles",
    roles: ["ADMIN"],
  },
  {
    id: "branche",
    label: "Branches",
    icon: <MapPinHouse />,
    link: "/admin/branches",
    roles: ["ADMIN", "DEALER"],
  },
  {
    id: "bydesign",
    label: "By Design Data",
    icon: <Table />,
    link: "/admin/bydesign",
    roles: ["ADMIN"],
  },
  {
    id: "c4c",
    label: "C4C Data",
    icon: <Table />,
    link: "/admin/c4c",
    roles: ["ADMIN"],
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings />,
    link: "/admin/profile",
    roles: ["ADMIN", "DEALER", "EMPLOYEE"],
  },
];
