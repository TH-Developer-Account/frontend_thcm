// tabs/WorkflowTab.tsx — wizard last step: review of what decides the approval flow.
// The approval chain itself is resolved by the backend on submit (category +
// plant + condition + value band), so there is no manual authority picker here.
// Once the CPP workflow subject type exists, render the resolved chain below
// with the existing ApprovalTable (workflowApi preview).
import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import Card from "../../../components/common/Card";
import type { CppFormValues } from "../types/cpp.types";
import {
	CPP_AMOUNT_BASIS_LABELS,
	CPP_CATEGORY_LABELS,
	CPP_PART_BASIS_LABELS,
	CPP_PRICE_TYPE_OPTIONS,
} from "../utils/cpp.constants";
import {
	CPP_PRICING_CONDITIONS,
	formatLacs,
	getCondition,
	isSpareRequest,
	toNum,
} from "../utils/cpp.utils";

const Row = ({ label, value }: { label: string; value: ReactNode }) => (
	<div className="flex flex-col gap-0.5">
		<dt className="text-xs text-slate-500">{label}</dt>
		<dd className="text-sm font-medium text-slate-900">{value || "—"}</dd>
	</div>
);

const WorkflowTab = () => {
	const { control } = useFormContext<CppFormValues>();
	const values = useWatch({ control }) as CppFormValues;

	const condition = getCondition(values.condition);
	const pricing = CPP_PRICING_CONDITIONS.find(
		(item) => item.value === values.workflow?.pricingCondition,
	);
	const priceType = CPP_PRICE_TYPE_OPTIONS.find(
		(item) => item.value === values.priceType,
	);
	const spare = isSpareRequest(values.category, values.plant);
	const partBasis = condition?.partBasis;
	const partValue =
		partBasis === "VARIATION_PCT"
			? values.approvalValues?.variationPct
				? `${values.approvalValues.variationPct}%`
				: ""
			: formatLacs(toNum(values.approvalValues?.partValue));

	return (
		<Card size="small">
			<div className="flex flex-col gap-5">
				<dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Row
						label="Category"
						value={CPP_CATEGORY_LABELS[values.category] ?? values.category}
					/>
					<Row label="Plant" value={values.plant} />
					<Row label="Condition" value={condition?.label} />
					<Row label="Spares flow" value={spare ? "Yes" : "No"} />
					{partBasis ? (
						<Row label={CPP_PART_BASIS_LABELS[partBasis]} value={partValue} />
					) : null}
					{condition ? (
						<Row
							label={CPP_AMOUNT_BASIS_LABELS[condition.amountBasis]}
							value={formatLacs(toNum(values.approvalValues?.amount))}
						/>
					) : null}
					<Row label="Material type" value={values.materialType} />
					<Row label="Reason" value={values.reason} />
					<Row label="Models" value={values.workflow?.models?.join(", ")} />
					<Row
						label="Applicable plants"
						value={values.workflow?.plants?.join(", ")}
					/>
					<Row label="Price type" value={priceType?.label} />
					<Row label="Pricing condition" value={pricing?.label} />
					<Row
						label="Recommended supplier"
						value={values.suppliers?.recommended?.name}
					/>
					<Row label="Purchasing Excel" value={values.purchasingFile?.name} />
					<Row
						label="Attachments"
						value={`${
							Object.values(values.attachments ?? {}).filter(Boolean).length
						} file(s)`}
					/>
				</dl>

				<p className="text-sm text-slate-600">
					The approval flow (stages and approvers) is assigned automatically on
					submit from the admin-maintained workflow settings. Approved requests
					are sent to TCS with the attached files.
				</p>
			</div>
		</Card>
	);
};

export default WorkflowTab;
