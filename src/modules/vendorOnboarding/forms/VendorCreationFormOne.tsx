import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";
import FormHeader from "../../marketing/activity-planner/components/common/FormHeader";
import {
	ArrowRight,
	Building2,
	LucideBriefcaseBusiness,
	RefreshCcw,
	Save,
} from "lucide-react";
import type { VendorFormErrors } from "../types/vendorOnboarding.types";

type VendorFormMode = "edit" | "view";

type VendorCreationFormOneValues = {
	vendorCode?: string;
	vendorType?: string;
	companyCode?: string;
	purchaseOrg?: string;
	vendorName?: string;
	completeAddress?: string;
	msmeVendor?: string;
	msmeCertificateAttached?: string;
	city?: string;
	pinCode?: string;
	region?: string;
};

type VendorCreationFormOneProps = {
	mode?: VendorFormMode;
	values?: VendorCreationFormOneValues;
	onChange?: <K extends keyof VendorCreationFormOneValues>(
		key: K,
		value: VendorCreationFormOneValues[K],
	) => void;
	onNext?: () => void;
	onSubmit?: () => void;
	errors?: VendorFormErrors<VendorCreationFormOneValues>;
	loading?: boolean;
};

type SelectOption = {
	label: string;
	value: string;
};

const toSelectOptions = (values: string[]): SelectOption[] =>
	values.map((value) => ({
		label: value,
		value,
	}));

const getSelectedOption = (
	options: SelectOption[],
	value?: string,
): SelectOption | null =>
	options.find((option) => option.value === value) ?? null;

const getDisplayValue = (value?: string): string =>
	value && value.trim().length > 0 ? value : "--";

const vendorTypeOptions = toSelectOptions([
	"PO Based",
	"Non PO Based",
	"Not Applicable",
]);

const companyCodeOptions = toSelectOptions([
	"0050 - JSR",
	"0070 - KGP",
	"0080 - BLR",
	"0091 - DWD",
	"Extension",
]);

const purchaseOrgOptions = toSelectOptions([
	"P501 - Direct Purchase",
	"P502 - Indirect Purchase",
	"P503 - Capital Purchase",
	"P504 - External Purchase",
	"P505 - Stock Transport",
	"P506 - Spare Part Purchase",
	"Not Applicable",
]);

const yesNoOptions = toSelectOptions(["Yes", "No"]);

const regionOptions = toSelectOptions([
	"South 1",
	"South 2",
	"North",
	"Central",
	"East",
	"West",
	"Corporate",
	"Kharagpur",
	"Dharwad",
	"Jamshedpur",
	"Not Applicable",
]);

type VendorDetailValueProps = {
	label: string;
	value?: string;
	required?: boolean;
};

const VendorDetailValue = ({
	label,
	value,
	required = false,
}: VendorDetailValueProps) => {
	return (
		<div className="vendor-detail-field">
			<div className="vendor-detail-label">
				{label}
				{required ? (
					<span className="vendor-detail-required" aria-hidden="true">
						*
					</span>
				) : null}
				:
			</div>
			<div className="vendor-detail-value">{getDisplayValue(value)}</div>
		</div>
	);
};

const VendorCreationFormOne = ({
	mode = "edit",
	values = {},
	onChange,
	onNext,
	onSubmit,
	errors = {},
	loading = false,
}: VendorCreationFormOneProps) => {
	const isViewMode = mode === "view";

	return (
		<form className="vendor-onboarding-form">
			<FormHeader
				title="Vendor Master Information"
				Icon={LucideBriefcaseBusiness}
			/>

			<div className="vendor-onboarding-form-grid">
				{isViewMode ? (
					<>
						<VendorDetailValue label="Vendor Code" value={values.vendorCode} />

						<VendorDetailValue
							label="Vendor Type"
							value={values.vendorType}
							required
						/>

						<VendorDetailValue
							label="Company Code"
							value={values.companyCode}
							required
						/>

						<VendorDetailValue
							label="Purchase Org"
							value={values.purchaseOrg}
							required
						/>

						<VendorDetailValue
							label="Name Of Vendor"
							value={values.vendorName}
							required
						/>

						<VendorDetailValue
							label="Complete Address"
							value={values.completeAddress}
							required
						/>
					</>
				) : (
					<>
						<FormInput
							name="vendorCode"
							label="Vendor Code"
							value={values.vendorCode ?? ""}
							error={errors.vendorCode}
							helperText="Enter only if this is an existing vendor."
							onChange={(event) => onChange?.("vendorCode", event.target.value)}
						/>

						<SelectInput
							name="vendorType"
							label="Vendor Type"
							placeholder="Select vendor type"
							options={vendorTypeOptions}
							value={getSelectedOption(vendorTypeOptions, values.vendorType)}
							required
							error={errors.vendorType}
							helperText="Choose whether the vendor is PO based, non-PO based, or not applicable."
							onChange={(option) =>
								onChange?.("vendorType", option?.value ?? "")
							}
						/>

						<SelectInput
							name="companyCode"
							label="Company Code"
							placeholder="Select company code"
							options={companyCodeOptions}
							value={getSelectedOption(companyCodeOptions, values.companyCode)}
							required
							error={errors.companyCode}
							helperText="Select the applicable THCM company code."
							onChange={(option) =>
								onChange?.("companyCode", option?.value ?? "")
							}
						/>

						<SelectInput
							name="purchaseOrg"
							label="Purchase Org"
							placeholder="Select purchase organization"
							options={purchaseOrgOptions}
							value={getSelectedOption(purchaseOrgOptions, values.purchaseOrg)}
							required
							error={errors.purchaseOrg}
							helperText="Select the purchase organization applicable to this vendor."
							onChange={(option) =>
								onChange?.("purchaseOrg", option?.value ?? "")
							}
						/>

						<FormInput
							name="vendorName"
							label="Name Of Vendor"
							value={values.vendorName ?? ""}
							required
							error={errors.vendorName}
							helperText="Enter vendor name in capital letters."
							onChange={(event) => onChange?.("vendorName", event.target.value)}
						/>

						<FormInput
							name="completeAddress"
							label="Complete Address"
							value={values.completeAddress ?? ""}
							required
							error={errors.completeAddress}
							helperText="Registered or communication address."
							onChange={(event) =>
								onChange?.("completeAddress", event.target.value)
							}
						/>
					</>
				)}
			</div>

			<FormHeader title="MSME & Location Details" Icon={Building2} />

			<div className="vendor-onboarding-form-grid">
				{isViewMode ? (
					<>
						<VendorDetailValue
							label="MSME Vendor"
							value={values.msmeVendor}
							required
						/>

						<VendorDetailValue
							label='If "Yes", Certificate Attached?'
							value={values.msmeCertificateAttached}
						/>

						<VendorDetailValue label="City" value={values.city} required />

						<VendorDetailValue
							label="Pin Code"
							value={values.pinCode}
							required
						/>

						<VendorDetailValue label="Region" value={values.region} required />
					</>
				) : (
					<>
						<SelectInput
							name="msmeVendor"
							label="MSME Vendor"
							placeholder="Select option"
							options={yesNoOptions}
							value={getSelectedOption(yesNoOptions, values.msmeVendor)}
							required
							error={errors.msmeVendor}
							helperText="Select whether this vendor is registered under MSME."
							onChange={(option) =>
								onChange?.("msmeVendor", option?.value ?? "")
							}
						/>

						<SelectInput
							name="msmeCertificateAttached"
							label='If "Yes", Certificate Attached?'
							placeholder="Select option"
							options={yesNoOptions}
							value={getSelectedOption(
								yesNoOptions,
								values.msmeCertificateAttached,
							)}
							error={errors.msmeCertificateAttached}
							helperText="Confirm whether MSME certificate is attached."
							onChange={(option) =>
								onChange?.("msmeCertificateAttached", option?.value ?? "")
							}
						/>

						<FormInput
							name="city"
							label="City"
							value={values.city ?? ""}
							required
							error={errors.city}
							helperText="Vendor city."
							onChange={(event) => onChange?.("city", event.target.value)}
						/>

						<FormInput
							name="pinCode"
							label="Pin Code"
							value={values.pinCode ?? ""}
							required
							error={errors.pinCode}
							helperText="Vendor location pin code."
							onChange={(event) => onChange?.("pinCode", event.target.value)}
						/>

						<SelectInput
							name="region"
							label="Region"
							placeholder="Select region"
							options={regionOptions}
							value={getSelectedOption(regionOptions, values.region)}
							required
							error={errors.region}
							helperText="Select the applicable vendor region."
							onChange={(option) => onChange?.("region", option?.value ?? "")}
						/>
					</>
				)}
			</div>

			<div className="vendor-onboarding-form-actions">
				<div />

				<div className="vendor-onboarding-form-actions-end">
					{!isViewMode ? (
						<Button
							type="button"
							text="Reset"
							Icon={RefreshCcw}
							size="sm"
							appearance="standard"
							variant="outline"
							disabled={loading}
						/>
					) : null}

					{isViewMode && onNext ? (
						<Button
							type="button"
							text="Next"
							size="sm"
							appearance="standard"
							variant="brand"
							Icon={ArrowRight}
							iconPosition="right"
							onClick={onNext}
							disabled={loading}
						/>
					) : onNext ? (
						<Button
							type="button"
							text={loading ? "Saving..." : "Save & Proceed"}
							size="sm"
							appearance="standard"
							variant="brand"
							Icon={Save}
							onClick={onNext}
							disabled={loading}
						/>
					) : (
						<Button
							type="button"
							text={loading ? "Submitting..." : "Submit"}
							size="sm"
							appearance="standard"
							variant="brand"
							Icon={Save}
							onClick={onSubmit}
							disabled={loading}
						/>
					)}
				</div>
			</div>
		</form>
	);
};

export default VendorCreationFormOne;
export type { VendorCreationFormOneValues };
