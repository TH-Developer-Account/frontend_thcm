// tabs/MaterialCostTrackerTab.tsx — stub. Built disabled behind
// MATERIAL_COST_TRACKER_ENABLED (utils/cpp.utils.ts); the table input comes later.
// Plain content inside a titled section: the parent card provides the surface.
// Shown in the view page too, so the tab is in place when the feature is switched on.
import { Wrench } from "lucide-react";

import { CardEmpty } from "../../../components/ui/CardSkeleton";
import CppSection from "../components/CppSection";
import { MATERIAL_COST_TRACKER_ENABLED } from "../utils/cpp.utils";

const MaterialCostTrackerTab = () => (
	<CppSection title="Material cost tracker">
		<CardEmpty
			Icon={Wrench}
			title={
				MATERIAL_COST_TRACKER_ENABLED ? "Coming soon" : "Not in use right now"
			}
			description="The table input is built but disabled. It will appear here when the feature flag is turned on."
		/>
	</CppSection>
);

export default MaterialCostTrackerTab;
