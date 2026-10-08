// forms/EPF/EpfFormFields.tsx
// EPF fields: participants, dealer share, CRF total and budget.
//
// CHANGED: the "Approval Workflow" block ("Display Approval Flow" button +
// preview table) moved to the Review & Submit step, where the preview loads
// automatically. The preview props are gone from this component.
import { Banknote, HandCoins, Users, Wallet } from "lucide-react";
import FormInput from "../../../../../components/forms/FormInput";
import type { EpfFormValues } from "../../types/epf.types";
import FormHeader from "../../../../../components/ui/FormHeader";

type EpfFormInfoProps = {
	values: EpfFormValues;
	errors?: Partial<Record<keyof EpfFormValues, string>>;
	handleChange: (name: keyof EpfFormValues, value: string) => void;
	eventCost: number;
};

export default function EpfFormFields({
	values,
	errors = {},
	handleChange,
	eventCost,
}: EpfFormInfoProps) {
	return (
		<div className="mt-4 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,9fr)_minmax(260px,3fr)]">
			<div className="min-w-0 space-y-4 text-left text-xs lg:text-sm">
				<div className=" bg-white pb-3">
					<FormHeader title="Participants" Icon={Users} />

					<div className="grid grid-cols-1 gap-4 px-3 md:grid-cols-3">
						<FormInput
							name="externalParticipants"
							type="number"
							min={0}
							placeholder="0"
							required
							label="External Participants"
							value={values.externalParticipants}
							error={errors.externalParticipants}
							onChange={(e) =>
								handleChange("externalParticipants", e.target.value)
							}
						/>

						<FormInput
							name="internalParticipants"
							type="number"
							min={0}
							placeholder="0"
							required
							label="Internal Participants"
							value={values.internalParticipants}
							error={errors.internalParticipants}
							onChange={(e) =>
								handleChange("internalParticipants", e.target.value)
							}
						/>

						<FormInput
							name="totalParticipants"
							readOnly
							disabled
							label="Total Participants"
							value={values.totalParticipants}
							error={errors.totalParticipants}
							onChange={(e) =>
								handleChange("totalParticipants", e.target.value)
							}
						/>
					</div>
				</div>

				<div className=" bg-white pb-3">
					<FormHeader title="Dealer Info" Icon={HandCoins} />

					<div className="grid grid-cols-1 gap-4 px-3 md:grid-cols-2">
						<FormInput
							name="dealerName"
							label="Dealer Name"
							value={values.dealerName}
							error={errors.dealerName}
							onChange={(e) => handleChange("dealerName", e.target.value)}
						/>
					</div>

					<div className="mt-4 grid grid-cols-1 gap-4 px-3 md:grid-cols-4">
						<FormInput
							name="dealerPercent"
							type="number"
							min={0}
							max={100}
							label="Dealer (%)"
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
							onChange={(e) =>
								handleChange("tataHitachiPercent", e.target.value)
							}
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
				</div>
			</div>

			<div className="space-y-4">
				<div className="rounded-xl border border-[var(--color-border)] bg-white pb-3">
					<FormHeader title="CRF Total" Icon={Wallet} />

					<div className="px-3">
						<FormInput
							name="crfTotal"
							readOnly
							disabled
							label="CRF Total (₹)"
							value={values.crfTotal}
							error={errors.crfTotal}
							onChange={(e) => handleChange("crfTotal", e.target.value)}
						/>
					</div>
				</div>

				<div className="rounded-xl border border-[var(--color-border)] bg-white pb-3">
					<FormHeader title="Budget Section" Icon={Banknote} />

					<div className="space-y-3 px-3">
						<FormInput
							name="eventBudget"
							label="Event Budget (₹)"
							required
							type="number"
							disabled
							readOnly
							value={eventCost}
							error={errors.eventBudget}
						/>

						<FormInput
							name="annualBudget"
							label="Annual Budget (₹)"
							required
							type="number"
							min={0}
							disabled
							readOnly
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
				</div>
			</div>
		</div>
	);
}
