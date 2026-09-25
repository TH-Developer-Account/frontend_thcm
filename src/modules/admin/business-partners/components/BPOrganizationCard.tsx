import { Pencil } from "lucide-react";
import { Controller } from "react-hook-form";

import Button from "../../../../components/common/Button";
// import Card from "../../../../components/common/Card";
import DatePickerInput from "../../../../components/common/DatePickerInput";
import Checkbox from "../../../../components/forms/Checkbox";
import FormInput from "../../../../components/forms/FormInput";
import SelectInput from "../../../../components/forms/SelectInput";
import { extractPanFromGstin } from "../../../../utils/form.validation";
import { formatDateOnlyAPI } from "../../../../utils/format";
import { useBPOrganizationInfoCardForm } from "../hooks/useBPOrganizationInfoCardForm";
import {
	ENTITY_TYPE_OPTIONS,
	type BusinessPartnerDetail,
} from "../utils/bp.types";

// TODO: inline labels below (no businessPartnerContent.organization yet) —
// see the matching TODO in BPGeneralInfoCard.tsx / useBPOrganizationInfoCardForm.ts.

type EntityTypeOption = (typeof ENTITY_TYPE_OPTIONS)[number];

const parseDateOnly = (value: string): Date | undefined => {
	if (!value) return undefined;

	const parsed = new Date(`${value}T00:00:00`);

	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

type BPOrganizationCardProps = {
	partner: BusinessPartnerDetail;
	canSubmit: boolean;
	startInEditMode?: boolean;
};

const BPOrganizationCard = (props: BPOrganizationCardProps) => {
	const {
		form,
		formRef,
		isEditing,
		startEditing,
		handleCancel,
		isSaving,
		canSubmit,
		onSubmit,
	} = useBPOrganizationInfoCardForm(props);

	const {
		control,
		setValue,
		formState: { isDirty },
	} = form;

	const isViewMode = !isEditing;
	const fieldMode = isViewMode ? "view" : "edit";

	return (
		<form
			ref={formRef}
			noValidate
			aria-label="Organization Information"
			onSubmit={(event) => {
				void onSubmit(event);
			}}
		>
			<div className="bp-create-form-sections">
				<section
					className="bp-create-form-section"
					aria-labelledby="org-basic-information-heading"
				>
					<div className="bp-create-form-heading">
						<h3 id="org-basic-information-heading">Basic Information</h3>
					</div>

					<div className="bp-master-form-grid">
						<Controller
							control={control}
							name="legalTradeName"
							render={({ field, fieldState }) => (
								<FormInput
									name={field.name}
									label="Legal Trade Name"
									value={field.value}
									onChange={(event) => field.onChange(event.target.value)}
									onBlur={field.onBlur}
									error={fieldState.error?.message}
									disabled={isSaving}
									mode={fieldMode}
								/>
							)}
						/>

						<Controller
							control={control}
							name="entityType"
							render={({ field, fieldState }) => (
								<SelectInput<EntityTypeOption>
									inputId="bp-org-entityType"
									name={field.name}
									label="Entity Type"
									placeholder="Select entity type"
									options={ENTITY_TYPE_OPTIONS}
									value={
										ENTITY_TYPE_OPTIONS.find(
											(option) => option.value === field.value,
										) ?? null
									}
									onChange={(option) => field.onChange(option?.value ?? "")}
									error={fieldState.error?.message}
									mode={fieldMode}
									isDisabled={isSaving}
									isClearable
								/>
							)}
						/>

						<Controller
							control={control}
							name="joinedOn"
							render={({ field, fieldState }) => (
								<DatePickerInput
									label="Joined On"
									mode="single"
									value={parseDateOnly(field.value)}
									onChange={(nextValue) =>
										field.onChange(
											formatDateOnlyAPI(
												nextValue instanceof Date ? nextValue : undefined,
											),
										)
									}
									placeholder="Select joining date"
									error={fieldState.error?.message}
									// DatePickerInput has no `mode` prop (see BPGeneralInfoCard
									// for the same gap) — disabled is the closest read-only
									// equivalent until it gets one.
									disabled={isSaving || isViewMode}
								/>
							)}
						/>
					</div>
				</section>

				<section
					className="bp-create-form-section"
					aria-labelledby="org-identifiers-heading"
				>
					<div className="bp-create-form-heading">
						<h3 id="org-identifiers-heading">Business Identifiers</h3>
					</div>

					<div className="bp-master-form-grid">
						<Controller
							control={control}
							name="bpId"
							render={({ field, fieldState }) => (
								<FormInput
									name={field.name}
									label="BP ID"
									value={field.value}
									onChange={(event) => field.onChange(event.target.value)}
									onBlur={field.onBlur}
									error={fieldState.error?.message}
									disabled={isSaving}
									mode={fieldMode}
								/>
							)}
						/>

						<Controller
							control={control}
							name="vendorId"
							render={({ field, fieldState }) => (
								<FormInput
									name={field.name}
									label="Vendor ID"
									value={field.value}
									onChange={(event) => field.onChange(event.target.value)}
									onBlur={field.onBlur}
									error={fieldState.error?.message}
									disabled={isSaving}
									mode={fieldMode}
								/>
							)}
						/>

						<Controller
							control={control}
							name="vendorCode"
							render={({ field, fieldState }) => (
								<FormInput
									name={field.name}
									label="Vendor Code"
									value={field.value}
									onChange={(event) => field.onChange(event.target.value)}
									onBlur={field.onBlur}
									error={fieldState.error?.message}
									disabled={isSaving}
									mode={fieldMode}
								/>
							)}
						/>

						<Controller
							control={control}
							name="s4Id"
							render={({ field, fieldState }) => (
								<FormInput
									name={field.name}
									label="S4 ID"
									value={field.value}
									onChange={(event) => field.onChange(event.target.value)}
									onBlur={field.onBlur}
									error={fieldState.error?.message}
									disabled={isSaving}
									mode={fieldMode}
								/>
							)}
						/>

						<Controller
							control={control}
							name="bydId"
							render={({ field, fieldState }) => (
								<FormInput
									name={field.name}
									label="BYD ID"
									value={field.value}
									onChange={(event) => field.onChange(event.target.value)}
									onBlur={field.onBlur}
									error={fieldState.error?.message}
									disabled={isSaving}
									mode={fieldMode}
								/>
							)}
						/>

						<Controller
							control={control}
							name="c4cId"
							render={({ field, fieldState }) => (
								<FormInput
									name={field.name}
									label="C4C ID"
									value={field.value}
									onChange={(event) => field.onChange(event.target.value)}
									onBlur={field.onBlur}
									error={fieldState.error?.message}
									disabled={isSaving}
									mode={fieldMode}
								/>
							)}
						/>
					</div>
				</section>

				<section
					className="bp-create-form-section"
					aria-labelledby="org-tax-information-heading"
				>
					<div className="bp-create-form-heading">
						<h3 id="org-tax-information-heading">Tax Information</h3>
					</div>

					<div className="bp-master-form-grid">
						<Controller
							control={control}
							name="gst"
							render={({ field, fieldState }) => (
								<FormInput
									name={field.name}
									label="GST Number"
									value={field.value}
									maxLength={15}
									autoComplete="off"
									onChange={(event) => {
										const gst = event.target.value.toUpperCase();
										field.onChange(gst);

										const derivedPan = extractPanFromGstin(gst);
										if (derivedPan) setValue("panNumber", derivedPan);
									}}
									onBlur={field.onBlur}
									error={fieldState.error?.message}
									disabled={isSaving}
									mode={fieldMode}
								/>
							)}
						/>

						<Controller
							control={control}
							name="panNumber"
							render={({ field, fieldState }) => (
								<FormInput
									name={field.name}
									label="PAN Number"
									value={field.value}
									maxLength={10}
									autoComplete="off"
									onChange={(event) =>
										field.onChange(event.target.value.toUpperCase())
									}
									onBlur={field.onBlur}
									error={fieldState.error?.message}
									disabled={isSaving}
									mode={fieldMode}
								/>
							)}
						/>
					</div>
				</section>

				<section
					className="bp-create-form-section"
					aria-labelledby="org-settings-heading"
				>
					<div className="bp-create-form-heading">
						<h3 id="org-settings-heading">Settings</h3>
					</div>

					<div className="bp-master-form-checks">
						<Controller
							control={control}
							name="isKeyAccount"
							render={({ field }) => (
								<Checkbox
									name={field.name}
									label="Key Account"
									checked={field.value}
									// Checkbox has no `mode` prop (same gap as DatePickerInput
									// above) — disabled is the closest read-only equivalent.
									disabled={isSaving || isViewMode}
									onChange={(checked) => field.onChange(checked)}
								/>
							)}
						/>

						<Controller
							control={control}
							name="isActive"
							render={({ field }) => (
								<Checkbox
									name={field.name}
									label="Active"
									checked={field.value}
									disabled={isSaving || isViewMode}
									onChange={(checked) => field.onChange(checked)}
								/>
							)}
						/>
					</div>
				</section>
			</div>
			<div className="bp-master-form-actions">
				{isViewMode ? (
					canSubmit && (
						<Button
							type="button"
							text="Edit Organization Information"
							Icon={Pencil}
							iconPosition="left"
							variant="outline"
							size="sm"
							onClick={startEditing}
						/>
					)
				) : (
					<>
						<Button
							type="button"
							text="Cancel"
							variant="outline"
							onClick={handleCancel}
							disabled={isSaving}
						/>

						<Button
							type="submit"
							text={isSaving ? "Saving..." : "Save"}
							variant="brand"
							disabled={!canSubmit || isSaving || !isDirty}
						/>
					</>
				)}
			</div>
		</form>
	);
};

export default BPOrganizationCard;
