import {
	ArrowLeft,
	LucideBriefcaseBusiness,
	RefreshCcw,
	Save,
	Send,
	X,
} from "lucide-react";
import { useWatch } from "react-hook-form";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormInput from "../../../components/forms/FormInput";
import PhoneInput from "../../../components/forms/PhoneInput";
import FormHeader from "../../../components/ui/FormHeader";

import { useVendorOnboardingInitiation } from "../hooks/useVendorOnboardingInitiation";
import type { VendorOnboardingInitiationPayload } from "../types/vendorListing.types";
import { Badge } from "../../../components/common/Badge";
import { vendorContent } from "../../../content/vendor.content";
import { COUNTRY_CODES, joinMobile } from "../../../utils/phone";

export type VendorInitiationFormMode = "create" | "edit" | "view";

type VendorOnboardingInitiationFormProps = {
	initiationId?: string;
	mode?: VendorInitiationFormMode;
	initialValues?: Partial<VendorOnboardingInitiationPayload>;
	onCancel?: () => void;
	onBack?: () => void;
	onSuccess?: () => void | Promise<void>;
	isTriggerEmail?: boolean;
};

const VendorOnboardingInitiationForm = ({
	initiationId,
	mode,
	initialValues,
	onCancel,
	onBack,
	onSuccess,
}: VendorOnboardingInitiationFormProps) => {
	const resolvedMode: VendorInitiationFormMode =
		mode ?? (initiationId ? "edit" : "create");

	const isViewMode = resolvedMode === "view";
	const isEditMode = resolvedMode === "edit";
	const fieldMode: VendorInitiationFormMode = isViewMode ? "view" : "edit";

	const {
		register,
		control,
		errors,
		isDirty,
		isSubmitting,
		isDetailLoading,
		handleReset,
		handleSubmit,
		onValid,
	} = useVendorOnboardingInitiation({
		initiationId,
		initialValues,
		shouldFetchDetails: isViewMode || isEditMode,
		onSubmitSuccess: onSuccess,
		onUpdateSuccess: onSuccess,
	});

	// View mode never renders a real <input> (FormInput short-circuits to
	// ReadOnlyField before touching name/onChange/ref), so those fields need
	// their current value read explicitly rather than via register().
	const values = useWatch({ control });

	const canRetriggerEmail = isViewMode && values.status === "AWAITING_VENDOR";

	// View mode shows the full number ("+91 9845012345"); edit mode shows
	// only the national digits next to the attached country code.
	const mobileDisplayValue = isViewMode
		? values.mobile
			? joinMobile(values.countryCode ?? "", values.mobile)
			: ""
		: values.mobile;

	const handleCancel = () => {
		if (onCancel) {
			onCancel();
			return;
		}

		onBack?.();
	};
	return (
		<Card>
			<form
				className="vendor-onboarding-form vendor-initiation-form"
				noValidate
				onSubmit={
					isViewMode && !canRetriggerEmail
						? (event) => event.preventDefault()
						: handleSubmit(onValid)
				}
			>
				<div className="flex justify-between items-center">
					<FormHeader
						title={
							isViewMode
								? vendorContent.initiation.titles.view
								: isEditMode
									? vendorContent.initiation.titles.edit
									: vendorContent.initiation.titles.create
						}
						Icon={LucideBriefcaseBusiness}
					/>
					{values.status ? <Badge status={values.status} /> : null}
				</div>

				{/* Container wrapper: the grid below reacts to the card's width */}
				<div className="vendor-initiation-fields">
					<div className="vendor-initiation-grid">
						<FormInput
							label={vendorContent.initiation.fields.vendorReferenceName.label}
							mode={fieldMode}
							value={values.vendorReferenceName}
							required={!isViewMode}
							readOnly={isViewMode}
							disabled={isDetailLoading}
							success={
								!isViewMode &&
								!errors.vendorReferenceName &&
								Boolean(values.vendorReferenceName)
							}
							error={
								isViewMode ? undefined : errors.vendorReferenceName?.message
							}
							helperText={
								isViewMode
									? undefined
									: vendorContent.initiation.fields.vendorReferenceName
											.helperText
							}
							autoComplete="organization"
							{...register("vendorReferenceName")}
						/>
						<FormInput
							label={vendorContent.initiation.fields.email.label}
							type="email"
							mode={fieldMode}
							value={values.email}
							required={!isViewMode}
							readOnly={isViewMode}
							disabled={isDetailLoading}
							success={!isViewMode && !errors.email && Boolean(values.email)}
							error={isViewMode ? undefined : errors.email?.message}
							helperText={
								isViewMode
									? undefined
									: vendorContent.initiation.fields.email.helperText
							}
							autoComplete="email"
							{...register("email")}
						/>

						<PhoneInput
							label={vendorContent.initiation.fields.mobile.label}
							mode={fieldMode}
							value={values.mobile}
							readOnlyValue={mobileDisplayValue}
							countryCodes={COUNTRY_CODES}
							countryCodeValue={values.countryCode}
							countryCodeProps={register("countryCode")}
							countryCodeDisabled={isSubmitting}
							required={!isViewMode}
							disabled={isDetailLoading}
							readOnly={isViewMode}
							success={!isViewMode && !errors.mobile && Boolean(values.mobile)}
							error={isViewMode ? undefined : errors.mobile?.message}
							helperText={
								isViewMode
									? undefined
									: vendorContent.initiation.fields.mobile.helperText
							}
							autoComplete="tel-national"
							{...register("mobile")}
						/>
					</div>
				</div>

				<div className="vendor-onboarding-form-actions">
					{isViewMode ? (
						<Button
							type="button"
							text={vendorContent.buttons.backToListing}
							Icon={ArrowLeft}
							iconPosition="left"
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={onBack}
						/>
					) : (
						<Button
							type="button"
							text={vendorContent.buttons.cancel}
							Icon={X}
							iconPosition="left"
							size="sm"
							appearance="standard"
							variant="outline"
							disabled={isSubmitting}
							onClick={handleCancel}
						/>
					)}

					{!isViewMode && (
						<div className="vendor-onboarding-form-actions-end">
							<Button
								type="button"
								text={vendorContent.buttons.reset}
								Icon={RefreshCcw}
								iconPosition="left"
								size="sm"
								appearance="standard"
								variant="outline"
								disabled={!isDirty || isSubmitting}
								onClick={handleReset}
							/>

							<Button
								type="submit"
								text={
									isSubmitting
										? isEditMode
											? vendorContent.buttons.updating
											: vendorContent.buttons.submitting
										: isEditMode
											? vendorContent.buttons.update
											: vendorContent.buttons.submit
								}
								Icon={isEditMode ? Save : Send}
								iconPosition="left"
								size="sm"
								appearance="standard"
								variant="brand"
								disabled={isSubmitting}
							/>
						</div>
					)}
					{canRetriggerEmail && (
						<Button
							type="submit"
							text={
								isSubmitting
									? vendorContent.buttons.sending
									: vendorContent.buttons.retriggerEmail
							}
							Icon={Send}
							iconPosition="left"
							size="sm"
							appearance="standard"
							variant="brand"
							disabled={isSubmitting || isDetailLoading}
						/>
					)}
				</div>
			</form>
		</Card>
	);
};

export default VendorOnboardingInitiationForm;
