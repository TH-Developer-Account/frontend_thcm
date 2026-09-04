import { useState, type ReactNode } from "react";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import { FilterTabs } from "../../../../components/ui/FilterTabs";

import type { BPFormTab, BusinessPartnerFormState } from "../utils/bp.types";
import { BPGeneralInfoForm } from "./BPGenInfo";
import { BPOrganizationForm } from "./BPOrganization";

type FormTabDef = {
	value: BPFormTab;
	label: string;
	shortLabel?: string;
	controlsId: string;
};

const formTabs: FormTabDef[] = [
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
];

// Tabs whose save button goes through the single /bp create-or-patch flow.
const BP_RESOURCE_TABS: BPFormTab[] = ["general", "organization"];

const SAVE_LABELS: Partial<Record<BPFormTab, string>> = {
	general: "General Information",
	organization: "Organization Information",
};

type BPCreateFormProps = {
	form: BusinessPartnerFormState;
	isEditMode: boolean;
	isSaving: boolean;
	canSubmit: boolean;
	error?: string | null;
	/** When set (pre-creation), only these tabs are shown. */
	availableTabs?: BPFormTab[];
	onChange: <K extends keyof BusinessPartnerFormState>(
		key: K,
		value: BusinessPartnerFormState[K],
	) => void;
	onSubmit: (section: BPFormTab) => void;
	onCancel: () => void;
	contactForm?: ReactNode;
	addressForm?: ReactNode;
	branchesForm?: ReactNode;
	peopleForm?: ReactNode;
};

const BPCreateForm = ({
	form,
	isEditMode,
	isSaving,
	canSubmit,
	error,
	availableTabs,
	onChange,
	onSubmit,
	onCancel,
	contactForm,
	addressForm,
	branchesForm,
	peopleForm,
}: BPCreateFormProps) => {
	const [activeTab, setActiveTab] = useState<BPFormTab>("general");
	const activeTabId = `bp-form-tab-${activeTab}`;
	const activePanelId = `${activeTabId}-panel`;

	const visibleTabs = availableTabs
		? formTabs.filter((tab) => availableTabs.includes(tab.value))
		: formTabs;

	const sectionForms: Partial<Record<BPFormTab, ReactNode>> = {
		contact: contactForm ?? (
			<div className="bp-create-form-empty">
				Contact and main contact form will appear here.
			</div>
		),
		address: addressForm ?? (
			<div className="bp-create-form-empty">
				Create the business partner first to add addresses.
			</div>
		),
		branches: branchesForm ?? (
			<div className="bp-create-form-empty">
				Create the business partner first to add branches.
			</div>
		),
		people: peopleForm ?? (
			<div className="bp-create-form-empty">
				Create the business partner first to add people.
			</div>
		),
	};

	const isBpResourceTab = BP_RESOURCE_TABS.includes(activeTab);

	const submitButtonText = isSaving
		? activeTab === "general" && !isEditMode
			? "Creating..."
			: "Saving..."
		: activeTab === "general" && !isEditMode
			? "Create Business Partner"
			: `Save ${SAVE_LABELS[activeTab] ?? ""}`;

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				if (isBpResourceTab) onSubmit(activeTab);
			}}
		>
			<Card
				padding="default"
				footer={
					isBpResourceTab ? (
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
								text={submitButtonText}
								variant="brand"
								disabled={!canSubmit || isSaving}
							/>
						</div>
					) : undefined
				}
			>
				<div className="bp-create-form-card">
					<FilterTabs
						id="bp-form-tab"
						items={visibleTabs}
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
							<BPGeneralInfoForm form={form} onChange={onChange} />
						)}

						{activeTab === "organization" && (
							<BPOrganizationForm form={form} onChange={onChange} />
						)}

						{sectionForms[activeTab]}
					</div>

					{error ? (
						<p className="bp-master-form-error" role="alert">
							{error}
						</p>
					) : null}
				</div>
			</Card>
		</form>
	);
};

export default BPCreateForm;
