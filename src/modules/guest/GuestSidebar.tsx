import { FileText } from "lucide-react";
import type { SidebarItem } from "../../layout/layout.types";

export const guestSidebar: SidebarItem[] = [
  {
    id: "guest-vendor-forms",
    label: "Vendor Forms",
    icon: <FileText size={18} />,
    link: "/guest/vendor-onboarding/guest",
  },
];
