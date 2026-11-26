// Target (new file): modules/marketing/handouts/handouts.sidebar.tsx
//
// Handouts is a single-page app with its own internal tabs (My Requests /
// Pending to Approve / Pending to Deliver — see HandoutsPage.tsx), so unlike
// Vendor Onboarding's multi-page sidebar, one entry is enough here. This
// mirrors vendor.sidebar.tsx / medical-claim.sidebar.tsx's shape so
// MainContentWrapper.tsx can key off the path prefix the same way for every
// standalone app.
import type { SidebarItem } from "../../../layout/layout.types";
import { Gift } from "lucide-react";
import { HANDOUTS_BASE_PATH } from "./handouts.constants";

export const handoutsSidebar: SidebarItem[] = [
  {
    id: "handouts-home",
    label: "Handouts",
    icon: <Gift size={20} />,
    link: HANDOUTS_BASE_PATH,
  },
];
