import NextStepsPanel, {
	type NextStep,
} from "../../../components/ui/NextStepsPanel";
import { vendorContent } from "../utils/vendor.content";

// Step copy lives in content/vendor.content.en.json -> initiation.nextSteps
const STEPS: readonly NextStep[] = vendorContent.initiation.nextSteps;

type VendorInitiationSidePanelProps = {
	className?: string;
};

const VendorInitiationSidePanel = ({
	className,
}: VendorInitiationSidePanelProps) => (
	<NextStepsPanel steps={STEPS} className={className} />
);

export default VendorInitiationSidePanel;
