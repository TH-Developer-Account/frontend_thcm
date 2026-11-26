import type { ReactNode } from "react";
import { BadgeIndianRupee, CheckCircle2 } from "lucide-react";

import Card from "../../../components/common/Card";
import DatePickerInput from "../../../components/common/DatePickerInput";
import Checkbox from "../../../components/forms/Checkbox";
import { formatDate } from "../../../utils/format";
import {
	currencyFormatter,
	toDatePickerValue,
	toDateString,
	useReimbursementClaimFormContext,
} from "../hooks/useReimbursementClaimForm";
import ClaimActions, {
	useHasClaimActions,
	type ClaimActionsVariant,
} from "./ClaimActions";
import ClaimHeadEntryTable from "./ClaimHeadEntryTable";

type ClaimHeadsCardProps = {
	/** Footer buttons. "claimant" = Back / Reset / Save draft / Submit. */
	actionsVariant?: Extract<ClaimActionsVariant, "claimant" | "none">;
};

/** Claim heads (bill entry + table) and the declaration, with the claimant footer. */
export const ClaimHeadsCard = ({
	actionsVariant = "claimant",
}: ClaimHeadsCardProps) => {
	const {
		values,
		errors,
		isLoading,
		isReadOnly,
		canEditClaimForm,
		mode,
		lineItemsTotal,
		handleChange,
	} = useReimbursementClaimFormContext();

	const hasActions = useHasClaimActions(actionsVariant);

	// Declaration: editable checkbox while drafting, one-line summary afterwards.
	const declarationBody: ReactNode =
		mode === "edit" && canEditClaimForm ? (
			<section
				aria-label="Declaration and signature"
				className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4"
			>
				<h3 className="flex items-center gap-2 text-sm font-semibold text-brand">
					<BadgeIndianRupee size={16} aria-hidden="true" />
					Declaration and Signature
				</h3>
				<p className="text-sm leading-6 text-iron">
					I confirm that I have kept the Company informed in writing of all
					changes in the status of my dependants covered under the Health
					Scheme. I declare that the information provided in this claim is true
					and complete in every respect.
				</p>
				<Checkbox
					name="declarationAccepted"
					className="shrink-0"
					checked={values.declarationAccepted}
					disabled={isReadOnly || isLoading}
					onChange={(checked) => handleChange("declarationAccepted", checked)}
					label="I confirm and accept the declaration above."
					error={errors.declarationAccepted}
				/>
				<div className="relative grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
					<DatePickerInput
						label="Date"
						mode="single"
						value={toDatePickerValue(values.claimDate)}
						onChange={(nextValue) => {
							if (nextValue instanceof Date) {
								handleChange("claimDate", toDateString(nextValue));
							}
						}}
						error={errors.claimDate}
						placeholder="Date"
						disabled={isReadOnly}
						toDate={new Date()}
					/>
				</div>
			</section>
		) : values.declarationAccepted ? (
			<p className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-iron">
				<CheckCircle2 aria-hidden="true" size={16} className="shrink-0" />
				Declaration accepted
				{values.employeeSignature ? ` by ${values.employeeSignature}` : ""}
				{values.claimDate ? ` on ${formatDate(values.claimDate)}` : ""}.
			</p>
		) : null;

	return (
		<Card
			title="Claim Heads"
			padding="none"
			actions={
				<span className="text-sm font-semibold text-iron-dark">
					Claimed total: {currencyFormatter.format(lineItemsTotal)}
				</span>
			}
			footer={hasActions ? <ClaimActions variant="claimant" /> : undefined}
		>
			<div className="flex flex-col gap-4 p-4">
				<ClaimHeadEntryTable />
				{declarationBody}
			</div>
		</Card>
	);
};

export default ClaimHeadsCard;
