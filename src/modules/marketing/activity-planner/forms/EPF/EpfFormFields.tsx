// forms/EPF/EpfFormFields.tsx
// Participants · Dealer Info · Budget as Card `sections` (collapsible).
//
// The sections are returned by a hook instead of being rendered here, so the
// host (EpfForm) can put them in the SAME Card as Budget Summary and Event Cost
// Overheads — one Card, five collapsible sections, one "Collapse all" toggle.
import { useState } from "react";

import FormInput from "../../../../../components/forms/FormInput";
import type { CardSection } from "../../../../../components/common/Card";
import type { EpfFormValues } from "../../types/epf.types";
import BusinessPartnerAsyncSelect, {
	type BusinessPartnerOption,
} from "../../../../admin/users/BusinessPartnerAsyncSelect";
import { Banknote, HandCoins, Users } from "lucide-react";

type EpfFormInfoProps = {
	values: EpfFormValues;
	errors?: Partial<Record<keyof EpfFormValues, string>>;
	handleChange: (name: keyof EpfFormValues, value: string) => void;
	eventCost: number;
};

export function useEpfFormSections({
	values,
	errors = {},
	handleChange,
	eventCost,
}: EpfFormInfoProps): CardSection[] {
	// Keeps the picked BP (id + type) so the select can show it; the form itself
	// only stores the name in `dealerName`, which is what the API takes today.
	const [dealerOption, setDealerOption] =
		useState<BusinessPartnerOption | null>(null);

	const dealerValue: BusinessPartnerOption | null = values.dealerName
		? dealerOption?.label === values.dealerName
			? dealerOption
			: { value: values.dealerName, label: values.dealerName } // saved EPF / after Reset
		: null;

	return [
		/* ------------------------------ Participants ------------------------------ */
		{
			id: "participants",
			title: "Participants",
			Icon: Users,
			children: (
				<div className="epf-card-fields">
					<FormInput
						name="externalParticipants"
						label="External Participants"
						type="number"
						min={0}
						placeholder="0"
						required
						value={values.externalParticipants}
						error={errors.externalParticipants}
						onChange={(e) =>
							handleChange("externalParticipants", e.target.value)
						}
					/>
					<FormInput
						name="internalParticipants"
						label="Internal Participants"
						type="number"
						min={0}
						placeholder="0"
						required
						value={values.internalParticipants}
						error={errors.internalParticipants}
						onChange={(e) =>
							handleChange("internalParticipants", e.target.value)
						}
					/>
					<FormInput
						name="totalParticipants"
						label="Total Participants"
						readOnly
						disabled
						value={values.totalParticipants}
						error={errors.totalParticipants}
						onChange={(e) => handleChange("totalParticipants", e.target.value)}
					/>
				</div>
			),
		},

		/* ------------------------------ Dealer info ------------------------------ */
		{
			id: "dealer",
			title: "Dealer Info",
			Icon: HandCoins,
			children: (
				<div className="epf-card-fields epf-card-fields--2">
					<div className="epf-card-field-wide">
						<BusinessPartnerAsyncSelect
							name="dealerName"
							label="Dealer Name"
							placeholder="Search dealer..."
							value={dealerValue}
							error={errors.dealerName}
							onChange={(option) => {
								setDealerOption(option);
								handleChange("dealerName", option?.label ?? "");
							}}
						/>
					</div>
					<FormInput
						name="dealerPercent"
						label="Dealer (%)"
						type="number"
						min={0}
						max={100}
						value={values.dealerPercent}
						error={errors.dealerPercent}
						onChange={(e) => handleChange("dealerPercent", e.target.value)}
					/>
					<FormInput
						name="tataHitachiPercent"
						label="Tata Hitachi (%)"
						readOnly
						disabled
						value={values.tataHitachiPercent}
						error={errors.tataHitachiPercent}
						onChange={(e) => handleChange("tataHitachiPercent", e.target.value)}
					/>
					<FormInput
						name="dealerShare"
						label="Dealer Share"
						readOnly
						disabled
						value={values.dealerShare}
						error={errors.dealerShare}
						onChange={(e) => handleChange("dealerShare", e.target.value)}
					/>
					<FormInput
						name="tataHitachiShare"
						label="Tata Hitachi Share"
						readOnly
						disabled
						value={values.tataHitachiShare}
						error={errors.tataHitachiShare}
						onChange={(e) => handleChange("tataHitachiShare", e.target.value)}
					/>
				</div>
			),
		},

		/* -------------------------------- Budget -------------------------------- */
		{
			id: "budget",
			title: "Budget",
			Icon: Banknote,
			children: (
				<div className="epf-card-fields epf-card-fields--2">
					<FormInput
						name="crfTotal"
						label="CRF Total (₹)"
						readOnly
						disabled
						value={values.crfTotal}
						error={errors.crfTotal}
						onChange={(e) => handleChange("crfTotal", e.target.value)}
					/>
					<FormInput
						name="eventBudget"
						label="Event Budget (₹)"
						required
						type="number"
						readOnly
						disabled
						value={eventCost}
						error={errors.eventBudget}
					/>
					<FormInput
						name="annualBudget"
						label="Annual Budget (₹)"
						required
						type="number"
						min={0}
						readOnly
						disabled
						value={values.annualBudget}
						error={errors.annualBudget}
						onChange={(e) => handleChange("annualBudget", e.target.value)}
					/>
					<FormInput
						name="availableBudget"
						label="Available Budget (₹)"
						readOnly
						disabled
						value={values.availableBudget}
						error={errors.availableBudget}
						onChange={(e) => handleChange("availableBudget", e.target.value)}
					/>
					<FormInput
						name="allotedBudget"
						label="Allotted Budget (₹)"
						readOnly
						disabled
						value={values.allotedBudget}
						error={errors.allotedBudget}
						onChange={(e) => handleChange("allotedBudget", e.target.value)}
					/>
					<FormInput
						name="tataHitachiPoAmount"
						label="Tata Hitachi PO Amount"
						readOnly
						disabled
						value={values.tataHitachiPoAmount}
						error={errors.tataHitachiPoAmount}
						onChange={(e) =>
							handleChange("tataHitachiPoAmount", e.target.value)
						}
					/>
				</div>
			),
		},
	];
}
