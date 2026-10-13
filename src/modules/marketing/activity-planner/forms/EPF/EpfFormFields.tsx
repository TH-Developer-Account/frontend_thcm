import { Banknote, HandCoins, Users } from "lucide-react";
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
		<div className="epf-form-grid text-left text-xs lg:text-sm">
			<div className="epf-form-grid epf-form-grid--top">
				<section className="epf-form-block">
					<FormHeader title="Participants" Icon={Users} />
					<div className="epf-form-fields epf-form-fields--3">
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
							onChange={(e) =>
								handleChange("totalParticipants", e.target.value)
							}
						/>
					</div>
				</section>

				<section className="epf-form-block">
					<FormHeader title="Dealer Info" Icon={HandCoins} />
					<div className="epf-form-fields epf-form-fields--dealer">
						<FormInput
							name="dealerName"
							label="Dealer Name"
							value={values.dealerName}
							error={errors.dealerName}
							onChange={(e) => handleChange("dealerName", e.target.value)}
						/>
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
				</section>
			</div>

			<section className="epf-form-block">
				<FormHeader title="Budget" Icon={Banknote} />
				<div className="epf-form-fields epf-form-fields--budget">
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
			</section>
		</div>
	);
}
