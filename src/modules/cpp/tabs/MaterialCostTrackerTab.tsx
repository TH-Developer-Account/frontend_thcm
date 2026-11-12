// tabs/MaterialCostTrackerTab.tsx — stub. Built disabled behind
// MATERIAL_COST_TRACKER_ENABLED (utils/cpp.utils.ts); the table input comes later.
import { Wrench } from "lucide-react";

import Card from "../../../components/common/Card";
import { CardEmpty } from "../../../components/ui/CardSkeleton";
import { MATERIAL_COST_TRACKER_ENABLED } from "../utils/cpp.utils";

const MaterialCostTrackerTab = () => (
	<Card title="Material cost tracker" size="small">
		<CardEmpty
			Icon={Wrench}
			title={
				MATERIAL_COST_TRACKER_ENABLED ? "Coming soon" : "Not in use right now"
			}
			description="The table input is built but disabled. It will appear here when the feature flag is turned on."
		/>
	</Card>
);

export default MaterialCostTrackerTab;
