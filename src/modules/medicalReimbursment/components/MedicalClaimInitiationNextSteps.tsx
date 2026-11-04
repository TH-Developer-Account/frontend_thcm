import NextStepsPanel, {
	type NextStep,
} from "../../../components/ui/NextStepsPanel";

const STEPS: readonly NextStep[] = [
	{
		title: "Employee gets a secure link",
		description: "It arrives by email and opens the claim form.",
	},
	{
		title: "Employee fills in and submits",
		description: "They enter claim details, add bills and submit.",
	},
	{
		title: "You track and review it",
		description:
			"The claim appears in Medical Reimbursement Claims with its status.",
	},
];

type MedicalClaimInitiationNextStepsProps = {
	className?: string;
};

export const MedicalClaimInitiationNextSteps = ({
	className,
}: MedicalClaimInitiationNextStepsProps) => (
	<NextStepsPanel steps={STEPS} className={className} />
);

export default MedicalClaimInitiationNextSteps;
