import { Building2, CalendarDays, Hash, Landmark, Layers } from "lucide-react";

import { Badge } from "../../../../components/common/Badge";
import Card from "../../../../components/common/Card";
import {
	BUSINESS_PARTNER_TYPE_OPTIONS,
	ENTITY_TYPE_OPTIONS,
	type BusinessPartnerEntityType,
	type BusinessPartnerOfficeType,
	type BusinessPartnerType,
} from "../utils/bp.types";

type BPGeneralInfoViewProps = {
	title?: string;
	bpName?: string;
	code?: string;
	bpType?: BusinessPartnerType;
	officeType?: BusinessPartnerOfficeType;
	joinedOn?: string | null;
	entityType?: BusinessPartnerEntityType | null;
	status?: string;
};

const FALLBACK_VALUE = "--";

const optionLabel = <T extends string>(
	options: ReadonlyArray<{ label: string; value: T }>,
	value: T | null | undefined,
): string =>
	options.find((option) => option.value === value)?.label ?? FALLBACK_VALUE;

const formatJoinedOn = (value?: string | null): string => {
	if (!value) return FALLBACK_VALUE;

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return FALLBACK_VALUE;

	return parsed.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

export const BPGeneralInfoView = ({
	title,
	bpName,
	code,
	bpType,
	officeType,
	joinedOn,
	entityType,
	status = "Active",
}: BPGeneralInfoViewProps) => {
	const cards = [
		{ label: "Code", value: code || FALLBACK_VALUE, icon: Hash, tone: "brand" },
		{
			label: "BP Type",
			value: bpType
				? optionLabel(BUSINESS_PARTNER_TYPE_OPTIONS, bpType)
				: FALLBACK_VALUE,
			icon: Building2,
			tone: "neutral",
		},
		{
			label: "Office Type",
			value: officeType ? officeType.replaceAll("_", " ") : FALLBACK_VALUE,
			icon: Landmark,
			tone: "neutral",
		},
		{
			label: "Joined On",
			value: formatJoinedOn(joinedOn),
			icon: CalendarDays,
			tone: "neutral",
		},
		{
			label: "Entity Type",
			value: entityType
				? optionLabel(ENTITY_TYPE_OPTIONS, entityType)
				: FALLBACK_VALUE,
			icon: Layers,
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
								{title || bpName || "Business Partner"}
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

			<div className="bp-summary-grid sm:grid-cols-2 xl:grid-cols-5">
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

export default BPGeneralInfoView;
