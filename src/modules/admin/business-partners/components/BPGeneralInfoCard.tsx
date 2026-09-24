import { Controller, useWatch } from "react-hook-form";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import DatePickerInput from "../../../../components/common/DatePickerInput";
import FormInput from "../../../../components/forms/FormInput";
import SelectInput from "../../../../components/forms/SelectInput";
import { businessPartnerContent } from "../../../../content/businessPartner.content";
import { formatDateOnlyAPI } from "../../../../utils/format";
import { useBPGeneralInfoCardForm } from "../hooks/useBPGeneralInfoCardForm";
import {
	BUSINESS_PARTNER_TYPE_OPTIONS,
	ENTITY_TYPE_OPTIONS,
	OFFICE_TYPE_OPTIONS,
	type BusinessPartnerDetail,
} from "../utils/bp.types";

const copy = businessPartnerContent.general;

type BPTypeOption = (typeof BUSINESS_PARTNER_TYPE_OPTIONS)[number];
type OfficeTypeOption = (typeof OFFICE_TYPE_OPTIONS)[number];
type EntityTypeOption = (typeof ENTITY_TYPE_OPTIONS)[number];

const parseDateOnly = (value: string): Date | undefined => {
	if (!value) return undefined;

	const parsed = new Date(`${value}T00:00:00`);

	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};
// Latest selectable joining date = today (future dates are disabled).
const getToday = () => {
	const date = new Date();
	date.setHours(0, 0, 0, 0);
	return date;
};
type BPGeneralInfoCardProps = {
	partner: BusinessPartnerDetail | null;
	parentIdFromQuery: string;
	parentPartner: BusinessPartnerDetail | null;
	canSubmit: boolean;
};

const BPGeneralInfoCard = (props: BPGeneralInfoCardProps) => {
	const {
		form,
		formRef,
		isCreateMode,
		isBranchFromParent,
		isSaving,
		canSubmit,
		onSubmit,
		handleCancel,
	} = useBPGeneralInfoCardForm(props);

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

	const submitText = isSaving
		? isCreateMode
			? copy.actions.creating
			: copy.actions.saving
		: isCreateMode
			? copy.actions.create
			: copy.actions.save;

	return (
		<form
			ref={formRef}
			noValidate
			aria-label={copy.title}
			onSubmit={(event) => {
				void onSubmit(event);
			}}
		>
			<Card
				padding="default"
				title={copy.title}
				footer={
					<div className="bp-master-form-actions">
						<Button
							type="button"
							text={copy.actions.cancel}
							variant="outline"
							onClick={handleCancel}
							disabled={isSaving || (!isCreateMode && !isDirty)}
						/>

						<Button
							type="submit"
							text={submitText}
							variant="brand"
							disabled={!canSubmit || isSaving || (!isCreateMode && !isDirty)}
						/>
					</div>
				}
			>
				<div className="bp-master-form-grid bp-create-card-grid">
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
								required
							/>
						)}
					/>

					<Controller
						control={control}
						name="bpType"
						render={({ field, fieldState }) => (
							<SelectInput<BPTypeOption>
								inputId="bp-general-bpType"
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
								inputId="bp-general-officeType"
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

									// The parent field is hidden for a head office —
									// drop any stale value/error rather than sending it.
									if (nextValue !== "BRANCH_OFFICE") {
										setValue("parentId", "");
										clearErrors("parentId");
									}
								}}
								error={fieldState.error?.message}
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
									required
								/>
							)}
						/>
					)}

					<Controller
						control={control}
						name="entityType"
						render={({ field, fieldState }) => (
							<SelectInput<EntityTypeOption>
								inputId="bp-general-entityType"
								name={field.name}
								label={copy.fields.entityType}
								placeholder={copy.placeholders.entityType}
								options={ENTITY_TYPE_OPTIONS}
								value={
									ENTITY_TYPE_OPTIONS.find(
										(option) => option.value === field.value,
									) ?? null
								}
								onChange={(option) => field.onChange(option?.value ?? "")}
								error={fieldState.error?.message}
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
								label={copy.fields.joinedOn}
								mode="single"
								value={parseDateOnly(field.value)}
								onChange={(nextValue) =>
									field.onChange(
										formatDateOnlyAPI(
											nextValue instanceof Date ? nextValue : undefined,
										),
									)
								}
								placeholder={copy.placeholders.joinedOn}
								error={fieldState.error?.message}
								disabled={isSaving}
								// Create only: a new BP can't have joined in the future.
								toDate={isCreateMode ? getToday() : undefined}
							/>
						)}
					/>

					<Controller
						control={control}
						name="legalTradeName"
						render={({ field, fieldState }) => (
							<FormInput
								name={field.name}
								label={copy.fields.legalTradeName}
								value={field.value}
								onChange={(event) => field.onChange(event.target.value)}
								onBlur={field.onBlur}
								error={fieldState.error?.message}
								disabled={isSaving}
							/>
						)}
					/>
				</div>
			</Card>
		</form>
	);
};

export default BPGeneralInfoCard;
