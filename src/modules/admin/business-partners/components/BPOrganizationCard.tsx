import { Pencil } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";

import Button from "../../../../components/common/Button";
import DatePickerInput from "../../../../components/common/DatePickerInput";
import Checkbox from "../../../../components/forms/Checkbox";
import FormInput from "../../../../components/forms/FormInput";
import SelectInput from "../../../../components/forms/SelectInput";
import { businessPartnerContent } from "../../../../content/businessPartner.content";
import { extractPanFromGstin } from "../../../../utils/form.validation";
import { formatDateOnlyAPI } from "../../../../utils/format";
import { useBPOrganizationInfoCardForm } from "../hooks/useBPOrganizationInfoCardForm";
import {
	BUSINESS_PARTNER_TYPE_OPTIONS,
	ENTITY_TYPE_OPTIONS,
	OFFICE_TYPE_OPTIONS,
	type BusinessPartnerDetail,
} from "../utils/bp.types";

// Reusing the retired General card's copy block for the fields that moved
// here (bpName/bpType/officeType/parentId/joinedOn labels + placeholders +
// actions) — no new content added. Everything below that already lived on
// this card (legalTradeName, entityType, identifiers, tax, settings) keeps
// its existing inline literal labels, per the "don't touch content" scope
// for this change.
const copy = businessPartnerContent.general;

type BPTypeOption = (typeof BUSINESS_PARTNER_TYPE_OPTIONS)[number];
type OfficeTypeOption = (typeof OFFICE_TYPE_OPTIONS)[number];
type EntityTypeOption = (typeof ENTITY_TYPE_OPTIONS)[number];

const parseDateOnly = (value: string): Date | undefined => {
	if (!value) return undefined;

	const parsed = new Date(`${value}T00:00:00`);

	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

// Latest selectable joining date = today (future dates are disabled) — only
// meaningful while creating; carried over from the retired General card.
const getToday = () => {
	const date = new Date();
	date.setHours(0, 0, 0, 0);
	return date;
};

type BPOrganizationCardProps = {
	/** null => create mode (the Create/Edit page before a BP exists). */
	partner: BusinessPartnerDetail | null;
	/** Create-only: `?parentId=` from the "Add Branch" action. */
	parentIdFromQuery?: string;
	/** Create-only: the loaded parent BP, used to prefill name fields once. */
	parentPartner?: BusinessPartnerDetail | null;
	canSubmit: boolean;
	/**
	 * BPTabs' Organization tab: read-only until Edit is clicked. Omitted (or
	 * false) on the Create/Edit page, which stays always-editable.
	 */
	allowViewToggle?: boolean;
	/** Organization tab only: opens straight into edit mode when empty. */
	startInEditMode?: boolean;
};

const BPOrganizationCard = (props: BPOrganizationCardProps) => {
	const {
		form,
		formRef,
		isCreateMode,
		isBranchFromParent,
		isEditing,
		startEditing,
		handleCancel,
		isSaving,
		canSubmit,
		onSubmit,
		allowViewToggle,
	} = useBPOrganizationInfoCardForm(props);

	const {
		control,
		setValue,
		clearErrors,
		formState: { isDirty },
	} = form;

	const officeType = useWatch({ control, name: "officeType" });
	const isBranchOffice = officeType === "BRANCH_OFFICE";

	// Office type / parent are not updatable after creation (the update
	// payload never included them), and are fixed when arriving via
	// "Add Branch" on a parent BP.
	const isOfficeStructureLocked = !isCreateMode || isBranchFromParent;

	const isViewMode = allowViewToggle && !isEditing;
	const fieldMode = isViewMode ? "view" : "edit";

	const submitText = isSaving
		? isCreateMode
			? copy.actions.creating
			: copy.actions.saving
		: isCreateMode
			? copy.actions.create
			: copy.actions.save;

	// Create mode never checks isDirty (there's nothing to compare against
	// yet). Both update contexts (the standalone edit page and BPTabs'
	// Organization tab) require a change before Save is enabled, matching
	// each source card's original behavior.
	const submitDisabled = !canSubmit || isSaving || (!isCreateMode && !isDirty);
	const cancelDisabled =
		isSaving || (!isCreateMode && !allowViewToggle && !isDirty);

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
					aria-labelledby="org-general-information-heading"
				>
					<div className="bp-master-form-grid">
						<Controller
							control={control}
							name="internalId"
							render={({ field, fieldState }) => (
								<FormInput
									name={field.name}
									label="Internal ID"
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
							name="bpShortName"
							render={({ field, fieldState }) => (
								<FormInput
									name={field.name}
									label="Short Name"
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
							name="bpName"
							render={({ field, fieldState }) => (
								<FormInput
									name={field.name}
									label={copy.fields.bpName}
									value={field.value}
									onChange={(event) => field.onChange(event.target.value)}
									onBlur={field.onBlur}
									error={fieldState.error?.message}
									disabled={isSaving}
									mode={fieldMode}
									required
								/>
							)}
						/>

						<Controller
							control={control}
							name="bpType"
							render={({ field, fieldState }) => (
								<SelectInput<BPTypeOption>
									inputId="bp-org-bpType"
									name={field.name}
									label={copy.fields.bpType}
									placeholder={copy.placeholders.bpType}
									options={BUSINESS_PARTNER_TYPE_OPTIONS}
									value={
										BUSINESS_PARTNER_TYPE_OPTIONS.find(
											(option) => option.value === field.value,
										) ?? null
									}
									onChange={(option) => field.onChange(option?.value ?? "")}
									error={fieldState.error?.message}
									mode={fieldMode}
									isDisabled={isSaving}
									required
								/>
							)}
						/>

						<Controller
							control={control}
							name="officeType"
							render={({ field, fieldState }) => (
								<SelectInput<OfficeTypeOption>
									inputId="bp-org-officeType"
									name={field.name}
									label={copy.fields.officeType}
									placeholder={copy.placeholders.officeType}
									options={OFFICE_TYPE_OPTIONS}
									value={
										OFFICE_TYPE_OPTIONS.find(
											(option) => option.value === field.value,
										) ?? null
									}
									onChange={(option) => {
										const nextValue = option?.value ?? "";
										field.onChange(nextValue);

										if (nextValue !== "BRANCH_OFFICE") {
											setValue("parentId", "");
											clearErrors("parentId");
										}
									}}
									error={fieldState.error?.message}
									mode={fieldMode}
									isDisabled={isSaving || isOfficeStructureLocked}
									required
								/>
							)}
						/>

						{isBranchOffice && (
							<Controller
								control={control}
								name="parentId"
								render={({ field, fieldState }) => (
									<FormInput
										name={field.name}
										label={copy.fields.parentId}
										placeholder={copy.placeholders.parentId}
										value={field.value}
										onChange={(event) => field.onChange(event.target.value)}
										onBlur={field.onBlur}
										error={fieldState.error?.message}
										disabled={isSaving || isOfficeStructureLocked}
										mode={fieldMode}
										required
									/>
								)}
							/>
						)}

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
									// DatePickerInput has no `mode` prop — disabled is the
									// closest read-only equivalent until it gets one.
									disabled={isSaving || isViewMode}
									toDate={isCreateMode ? getToday() : undefined}
								/>
							)}
						/>

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
						<div className="bp-master-form-checks">
							<Controller
								control={control}
								name="isKeyAccount"
								render={({ field }) => (
									<Checkbox
										name={field.name}
										label="Key Account"
										checked={field.value}
										// Checkbox has no `mode` prop — disabled is the closest
										// read-only equivalent.
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
							text={copy.actions.cancel}
							variant="outline"
							onClick={handleCancel}
							disabled={cancelDisabled}
						/>

						<Button
							type="submit"
							text={submitText}
							variant="brand"
							disabled={submitDisabled}
						/>
					</>
				)}
			</div>
		</form>
	);
};

export default BPOrganizationCard;
