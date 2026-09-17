import { Building2, Hash, MapPinned, Phone, UserRound } from "lucide-react";

import { Badge } from "../../../../components/common/Badge";
import Card from "../../../../components/common/Card";
import FormInput from "../../../../components/forms/FormInput";
import SelectInput from "../../../../components/forms/SelectInput";

import type {
	BusinessPartnerEntityType,
	BusinessPartnerFormState,
	BusinessPartnerOfficeType,
	BusinessPartnerType,
} from "../utils/bp.types";

type FormChangeHandler = <K extends keyof BusinessPartnerFormState>(
	key: K,
	value: BusinessPartnerFormState[K],
) => void;

type BPGeneralInfoViewProps = {
	name?: string;
	number?: string;
	mainContactPerson?: string;
	mainContactNumber?: string;
	code?: string;
	zone?: string;
	status?: string;
	title?: string;
};

type BPGeneralInfoFormProps = {
	form: BusinessPartnerFormState;
	onChange: FormChangeHandler;
};

const FALLBACK_VALUE = "--";

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

export const BPGeneralInfoView = ({
	name,
	number,
	mainContactPerson,
	mainContactNumber,
	code,
	zone,
	status = "Active",
	title,
}: BPGeneralInfoViewProps) => {
	const cards = [
		{ label: "Code", value: code || FALLBACK_VALUE, icon: Hash, tone: "brand" },
		{
			label: "Zone",
			value: zone || FALLBACK_VALUE,
			icon: MapPinned,
			tone: "neutral",
		},
		{
			label: "BP Number",
			value: number || FALLBACK_VALUE,
			icon: Phone,
			tone: "neutral",
		},
		{
			label: "Main Contact",
			value: mainContactPerson || mainContactNumber || FALLBACK_VALUE,
			icon: UserRound,
			tone: "neutral",
		},
	] as const;

	return (
		<Card padding="none" variant="default">
			<div className="bp-gen-header-clean">
				<div className="bp-gen-header-left">
					<div className="bp-gen-title-row">
						<div className="bp-gen-title-icon" aria-hidden="true">
							<Building2 size={18} />
						</div>
						<div className="bp-gen-title-wrap">
							<h3 className="bp-gen-title brand-text">
								{title || name || "Business Partner"}
							</h3>
							<p className="bp-gen-subtext">Business Partner Details</p>
						</div>
					</div>
				</div>
				<div className="bp-header-status">
					<span className="bp-status-label">Status:</span>
					<Badge status="Approved">{status}</Badge>
				</div>
			</div>

			<div className="bp-summary-grid sm:grid-cols-2 xl:grid-cols-4">
				{cards.map(({ label, value, icon: Icon, tone }) => (
					<div key={label} className="bp-stat-card">
						<div className="bp-stat-card-inner">
							<p className="bp-stat-label">{label}</p>
							<h3 className="bp-stat-value" title={String(value)}>
								{value}
							</h3>
						</div>
						<div className={`bp-stat-icon bp-stat-icon--${tone}`}>
							<Icon size={15} aria-hidden="true" />
						</div>
					</div>
				))}
			</div>
		</Card>
	);
};

export const BPGeneralInfoForm = ({
	form,
	onChange,
}: BPGeneralInfoFormProps) => {
	const isBranchOffice = form.officeType === "BRANCH_OFFICE";

	return (
		<section
			className="bp-create-form-section"
			aria-labelledby="general-information-heading"
		>
			<h3 id="general-information-heading" className="sr-only">
				General Information
			</h3>
			<div className="bp-master-form-grid">
				<FormInput
					name="internalId"
					label="Internal ID"
					value={form.internalId}
					onChange={(event) => onChange("internalId", event.target.value)}
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
					onChange={(event) => onChange("bpShortName", event.target.value)}
				/>
				<FormInput
					name="legalTradeName"
					label="Legal Trade Name"
					value={form.legalTradeName}
					onChange={(event) => onChange("legalTradeName", event.target.value)}
				/>
				<SelectInput
					name="bpType"
					label="Business Partner Type"
					value={
						BUSINESS_PARTNER_TYPE_OPTIONS.find(
							({ value }) => value === form.bpType,
						) ?? null
					}
					options={BUSINESS_PARTNER_TYPE_OPTIONS}
					onChange={(option) =>
						onChange(
							"bpType",
							option ? (option.value as BusinessPartnerType) : "",
						)
					}
					required
				/>
				<SelectInput
					name="officeType"
					label="Office Type"
					value={
						OFFICE_TYPE_OPTIONS.find(
							({ value }) => value === form.officeType,
						) ?? null
					}
					options={OFFICE_TYPE_OPTIONS}
					onChange={(option) =>
						onChange(
							"officeType",
							option ? (option.value as BusinessPartnerOfficeType) : "",
						)
					}
					required
				/>
				<FormInput
					name="parentId"
					label="Parent Business Partner ID"
					value={form.parentId}
					placeholder={
						isBranchOffice
							? "Required for a branch office"
							: "Only needed for a branch office"
					}
					onChange={(event) => onChange("parentId", event.target.value)}
					required={isBranchOffice}
				/>
				<SelectInput
					name="entityType"
					label="Entity Type"
					value={
						ENTITY_TYPE_OPTIONS.find(
							({ value }) => value === form.entityType,
						) ?? null
					}
					options={ENTITY_TYPE_OPTIONS}
					onChange={(option) =>
						onChange(
							"entityType",
							option ? (option.value as BusinessPartnerEntityType) : "",
						)
					}
				/>
				<FormInput
					name="joinedOn"
					label="Joined On"
					type="date"
					value={form.joinedOn}
					onChange={(event) => onChange("joinedOn", event.target.value)}
				/>
			</div>
		</section>
	);
};

export default BPGeneralInfoView;
