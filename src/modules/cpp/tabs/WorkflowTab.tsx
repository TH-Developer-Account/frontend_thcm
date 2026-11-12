// tabs/WorkflowTab.tsx — master controller for routing.
// Approval flow = admin-assigned template for the chosen authority, shown with
// the existing ApprovalTable. Templates below are MOCK until the CPP workflow
// subject type exists on the backend (then use workflowApi.listForModule +
// mapWorkflowStagesToApprovalRows instead of MOCK_TEMPLATES).
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { Alert } from "../../../components/common/Alert";
import Card from "../../../components/common/Card";
import Checkbox from "../../../components/forms/Checkbox";
import Radio from "../../../components/forms/Radio";
import { ApprovalTable } from "../../workflows";
import type { ApprovalTableRow } from "../../workflows/types/types";
import {
	RhfChips,
	RhfSelect,
	toOptions,
	useFieldError,
} from "../components/CppFields";
import type { CppFormValues } from "../types/cpp.types";
import {
	CPP_AUTHORITIES,
	CPP_MODELS,
	CPP_PLANTS,
	CPP_PRICING_CONDITIONS,
} from "../utils/cpp.utils";

const stage = (
	id: string,
	name: string,
	designation: string,
	order: number,
) => ({
	id,
	stage: order,
	stageName: `Stage ${order}`,
	name,
	email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
	designation,
	strategy: "Sequential",
	minApprovals: 1,
	totalApprovers: 1,
	status: "PENDING",
	approvers: [
		{
			id: `${id}-a`,
			name,
			email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
			designation,
			isExternal: false,
			status: "PENDING",
		},
	],
});

// MOCK — shape follows ApprovalTableRow as used by ApprovalTable; cast because
// the real rows come from mapWorkflowStagesToApprovalRows.
const MOCK_TEMPLATES: Record<string, ApprovalTableRow[]> = {
	SCM: [
		stage("scm-1", "Category Owner", "Category Head", 1),
		stage("scm-2", "Head SCM", "Head, SCM", 2),
	],
	CPP: [
		stage("cpp-1", "Category Owner", "Category Head", 1),
		stage("cpp-2", "Head SCM", "Head, SCM", 2),
		stage("cpp-3", "CPP Chairman", "Chairman", 3),
	],
	MD: [
		stage("md-1", "Head SCM", "Head, SCM", 1),
		stage("md-2", "Managing Director", "MD", 2),
	],
	Spare: [
		stage("sp-1", "Spares Owner", "Head Parts", 1),
		stage("sp-2", "Head SCM", "Head, SCM", 2),
	],
} as unknown as Record<string, ApprovalTableRow[]>;

const WorkflowTab = () => {
	const { control } = useFormContext<CppFormValues>();
	const authority = useWatch({ control, name: "workflow.authority" });
	const pricingError = useFieldError("workflow.pricingCondition");

	return (
		<div className="flex flex-col gap-4">
			<Card
				title="Workflow – master controller"
				subtitle="Decides which approval workflow runs"
				size="small"
			>
				<div className="grid gap-5 lg:grid-cols-2">
					<RhfChips
						name="workflow.models"
						label="Models"
						required
						options={CPP_MODELS}
					/>
					<RhfChips
						name="workflow.plants"
						label="Applicable plants"
						options={CPP_PLANTS}
					/>

					<div className="lg:col-span-2">
						<Controller
							name="workflow.pricingCondition"
							control={control}
							render={({ field }) => (
								<Radio
									name="workflow.pricingCondition"
									groupLabel="Pricing condition"
									required
									options={CPP_PRICING_CONDITIONS}
									selectedValue={field.value}
									onChange={field.onChange}
									error={pricingError}
								/>
							)}
						/>
					</div>

					<Controller
						name="workflow.spares"
						control={control}
						render={({ field }) => (
							<Checkbox
								label="Applies to spares"
								checked={field.value}
								onChange={field.onChange}
							/>
						)}
					/>
					<RhfSelect
						name="workflow.authority"
						label="Approving authority"
						required
						options={toOptions(CPP_AUTHORITIES)}
					/>
				</div>
			</Card>

			<Alert
				variant="warning"
				type="banner"
				title="Approving authority is selected manually"
				description="Auto-routing from the CPP circular (value bands, purchase type, plant) is planned for a later phase."
			/>
			<Card
				title="Approval flow"
				subtitle={
					authority
						? `Template assigned for ${authority}`
						: "Select an approving authority to preview the flow"
				}
			>
				<ApprovalTable
					rows={authority ? (MOCK_TEMPLATES[authority] ?? []) : []}
					hiddenColumns={["status"]}
					defaultExpanded
				/>
			</Card>
		</div>
	);
};

export default WorkflowTab;
