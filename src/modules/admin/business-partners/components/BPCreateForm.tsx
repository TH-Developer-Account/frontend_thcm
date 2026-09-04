import { useState, type ReactNode } from "react";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import FormInput from "../../../../components/forms/FormInput";
import SelectInput from "../../../../components/forms/SelectInput";
import { FilterTabs } from "../../../../components/ui/FilterTabs";

import type {
	BusinessPartnerEntityType,
	BusinessPartnerFormState,
	BusinessPartnerOfficeType,
	BusinessPartnerType,
} from "../utils/bp.types";

const formTabs = [
	{
		value: "general",
		label: "General Information",
		shortLabel: "General",
		controlsId: "bp-form-tab-general-panel",
	},
	{
		value: "organization",
		label: "Organization Information",
		shortLabel: "Organization",
		controlsId: "bp-form-tab-organization-panel",
	},
	{
		value: "contact",
		label: "Contact & Main Contact",
		shortLabel: "Contact",
		controlsId: "bp-form-tab-contact-panel",
	},
	{
		value: "address",
		label: "Addresses",
		controlsId: "bp-form-tab-address-panel",
	},
	{
		value: "branches",
		label: "Branches",
		controlsId: "bp-form-tab-branches-panel",
	},
	{
		value: "people",
		label: "People",
		controlsId: "bp-form-tab-people-panel",
	},
] as const;

type BPFormTab = (typeof formTabs)[number]["value"];

type BPCreateFormProps = {
	form: BusinessPartnerFormState;
	isEditMode: boolean;
	isSaving: boolean;
	canSubmit: boolean;
	error?: string | null;

	onChange: <K extends keyof BusinessPartnerFormState>(
		key: K,
		value: BusinessPartnerFormState[K],
	) => void;

	onSubmit: () => void;
	onCancel: () => void;

	/*
	 * Pass the create/edit forms for related BP sections.
	 * These should be form components, not the read-only view components.
	 */
	contactForm?: ReactNode;
	addressForm?: ReactNode;
	branchesForm?: ReactNode;
	peopleForm?: ReactNode;
};

const OFFICE_TYPE_OPTIONS = [
	{ label: "Head Office", value: "HEAD_OFFICE" },
	{ label: "Branch Office", value: "BRANCH_OFFICE" },
];

const BUSINESS_PARTNER_TYPE_OPTIONS = [
	{ label: "Dealer", value: "DEALER" },
	{ label: "Customer", value: "CUSTOMER" },
	{ label: "Employee", value: "EMPLOYEE" },
];

const ENTITY_TYPE_OPTIONS = [
	{ label: "Company", value: "COMPANY" },
	{ label: "Partnership", value: "PARTNERSHIP" },
	{ label: "Proprietorship", value: "PROPRIETORSHIP" },
	{ label: "Individual", value: "INDIVIDUAL" },
	{ label: "Other", value: "OTHER" },
];

const BPCreateForm = ({
	form,
	isEditMode,
	isSaving,
	canSubmit,
	error,
	onChange,
	onSubmit,
	onCancel,
	contactForm,
	addressForm,
	branchesForm,
	peopleForm,
}: BPCreateFormProps) => {
	const [activeTab, setActiveTab] = useState<BPFormTab>("general");

	const availableTabs = isEditMode
		? formTabs
		: formTabs.filter(
				(tab) =>
					tab.value === "general" ||
					tab.value === "organization" ||
					tab.value === "contact" ||
					tab.value === "address" ||
					tab.value === "branches" ||
					tab.value === "people",
			);

	const activeTabId = `bp-form-tab-${activeTab}`;
	const activePanelId = `${activeTabId}-panel`;

	// const renderUnavailableSection = (section: string) => (
	// 	<Card>
	// 		<div className="bp-master-form-empty">
	// 			<p>Create the business partner first to add {section.toLowerCase()}.</p>
	// 		</div>
	// 	</Card>
	// );

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				onSubmit();
			}}
		>
			<Card padding="default">
				<div className="bp-create-form-card">
					<FilterTabs
						id="bp-form-tab"
						items={availableTabs}
						value={activeTab}
						onChange={setActiveTab}
						ariaLabel="Business partner form sections"
						variant="soft"
					/>

					<div
						id={activePanelId}
						aria-labelledby={activeTabId}
						className="bp-create-form-panel"
						role="tabpanel"
						tabIndex={0}
					>
						{activeTab === "general" && (
							<section
								className="bp-create-form-section"
								aria-labelledby="general-information-heading"
							>
								{/* <div className="bp-create-form-heading">
									<h3 id="general-information-heading">General Information</h3>
									<p>Enter the basic business partner information.</p>
								</div> */}

								<div className="bp-master-form-grid">
									<FormInput
										name="internalId"
										label="Internal ID"
										value={form.internalId}
										onChange={(event) =>
											onChange("internalId", event.target.value)
										}
										required
									/>

									<FormInput
										name="bpName"
										label="Business Partner Name"
										value={form.bpName}
										onChange={(event) => onChange("bpName", event.target.value)}
										required
									/>

									<FormInput
										name="bpShortName"
										label="Short Name"
										value={form.bpShortName}
										onChange={(event) =>
											onChange("bpShortName", event.target.value)
										}
									/>

									<FormInput
										name="legalTradeName"
										label="Legal Trade Name"
										value={form.legalTradeName}
										onChange={(event) =>
											onChange("legalTradeName", event.target.value)
										}
									/>

									<SelectInput
										name="bpType"
										label="Business Partner Type"
										value={
											BUSINESS_PARTNER_TYPE_OPTIONS.find(
												(option) => option.value === form.bpType,
											) ?? null
										}
										options={BUSINESS_PARTNER_TYPE_OPTIONS}
										onChange={(selectedOption) =>
											onChange(
												"bpType",
												selectedOption
													? (selectedOption.value as BusinessPartnerType)
													: "",
											)
										}
										required
									/>

									<SelectInput
										name="officeType"
										label="Office Type"
										value={
											OFFICE_TYPE_OPTIONS.find(
												(option) => option.value === form.officeType,
											) ?? null
										}
										options={OFFICE_TYPE_OPTIONS}
										onChange={(selectedOption) =>
											onChange(
												"officeType",
												selectedOption
													? (selectedOption.value as BusinessPartnerOfficeType)
													: "",
											)
										}
										required
									/>

									<SelectInput
										name="entityType"
										label="Entity Type"
										value={
											ENTITY_TYPE_OPTIONS.find(
												(option) => option.value === form.entityType,
											) ?? null
										}
										options={ENTITY_TYPE_OPTIONS}
										onChange={(selectedOption) =>
											onChange(
												"entityType",
												selectedOption
													? (selectedOption.value as BusinessPartnerEntityType)
													: "",
											)
										}
									/>

									<FormInput
										name="joinedOn"
										label="Joined On"
										type="date"
										value={form.joinedOn}
										onChange={(event) =>
											onChange("joinedOn", event.target.value)
										}
									/>
								</div>
							</section>
						)}

						{activeTab === "organization" && (
							<div className="bp-create-form-sections">
								<section
									className="bp-create-form-section"
									aria-labelledby="business-identifiers-heading"
								>
									<div className="bp-create-form-heading">
										<h3 id="business-identifiers-heading">
											Business Identifiers
										</h3>
										<p>Enter system and vendor identification numbers.</p>
									</div>

									<div className="bp-master-form-grid">
										<FormInput
											name="bpId"
											label="BP ID"
											value={form.bpId}
											onChange={(event) => onChange("bpId", event.target.value)}
										/>

										<FormInput
											name="vendorId"
											label="Vendor ID"
											value={form.vendorId}
											onChange={(event) =>
												onChange("vendorId", event.target.value)
											}
										/>

										<FormInput
											name="vendorCode"
											label="Vendor Code"
											value={form.vendorCode}
											onChange={(event) =>
												onChange("vendorCode", event.target.value)
											}
										/>

										<FormInput
											name="s4Id"
											label="S4 ID"
											value={form.s4Id}
											onChange={(event) => onChange("s4Id", event.target.value)}
										/>

										<FormInput
											name="bydId"
											label="BYD ID"
											value={form.bydId}
											onChange={(event) =>
												onChange("bydId", event.target.value)
											}
										/>

										<FormInput
											name="c4cId"
											label="C4C ID"
											value={form.c4cId}
											onChange={(event) =>
												onChange("c4cId", event.target.value)
											}
										/>

										<FormInput
											name="parentId"
											label="Parent Business Partner ID"
											value={form.parentId}
											onChange={(event) =>
												onChange("parentId", event.target.value)
											}
										/>
									</div>
								</section>

								<section
									className="bp-create-form-section"
									aria-labelledby="tax-information-heading"
								>
									<div className="bp-create-form-heading">
										<h3 id="tax-information-heading">Tax Information</h3>
									</div>

									<div className="bp-master-form-grid">
										<FormInput
											name="gst"
											label="GST Number"
											value={form.gst}
											onChange={(event) =>
												onChange("gst", event.target.value.toUpperCase())
											}
										/>

										<FormInput
											name="panNumber"
											label="PAN Number"
											value={form.panNumber}
											onChange={(event) =>
												onChange("panNumber", event.target.value.toUpperCase())
											}
										/>
									</div>
								</section>

								<section
									className="bp-create-form-section"
									aria-labelledby="settings-heading"
								>
									<div className="bp-create-form-heading">
										<h3 id="settings-heading">Settings</h3>
									</div>

									<div className="bp-master-form-checks">
										<label>
											<input
												type="checkbox"
												checked={form.isKeyAccount}
												onChange={(event) =>
													onChange("isKeyAccount", event.target.checked)
												}
											/>
											Key account
										</label>

										<label>
											<input
												type="checkbox"
												checked={form.isActive}
												onChange={(event) =>
													onChange("isActive", event.target.checked)
												}
											/>
											Active
										</label>
									</div>
								</section>
							</div>
						)}

						{activeTab === "contact" &&
							(contactForm ?? (
								<div className="bp-create-form-empty">
									Contact and main contact form will appear here.
								</div>
							))}

						{activeTab === "address" &&
							(addressForm ?? (
								<div className="bp-create-form-empty">
									Create the business partner first to add addresses.
								</div>
							))}

						{activeTab === "branches" &&
							(branchesForm ?? (
								<div className="bp-create-form-empty">
									Create the business partner first to add branches.
								</div>
							))}

						{activeTab === "people" &&
							(peopleForm ?? (
								<div className="bp-create-form-empty">
									Create the business partner first to add people.
								</div>
							))}
					</div>

					{error ? (
						<p className="bp-master-form-error" role="alert">
							{error}
						</p>
					) : null}

					<div className="bp-master-form-actions">
						<Button
							type="button"
							text="Cancel"
							variant="secondary"
							onClick={onCancel}
							disabled={isSaving}
						/>

						<Button
							type="submit"
							text={
								isSaving
									? "Saving..."
									: isEditMode
										? "Update Business Partner"
										: "Create Business Partner"
							}
							variant="brand"
							disabled={!canSubmit || isSaving}
						/>
					</div>
				</div>
			</Card>
		</form>
	);
};

export default BPCreateForm;
