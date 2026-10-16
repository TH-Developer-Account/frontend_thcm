import NextStepsPanel, {
	type NextStep,
} from "../../../components/ui/NextStepsPanel";

const STEPS: readonly NextStep[] = [
	{
		title: "Vendor gets a secure link",
		description: "It arrives by email and opens the onboarding form.",
	},
	{
		title: "Vendor verifies and fills details",
		description: "Verification uses the mobile number you enter here.",
	},
	{
		title: "You track it in Vendors Listing",
		description: "The new vendor appears there with its onboarding status.",
	},
];

type VendorInitiationSidePanelProps = {
	className?: string;
};

const VendorInitiationSidePanel = ({
	className,
}: VendorInitiationSidePanelProps) => (
	<NextStepsPanel steps={STEPS} className={className} />
);

export default VendorInitiationSidePanel;
