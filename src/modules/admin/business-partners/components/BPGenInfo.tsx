import { Building2, Hash, MapPinned, Phone, UserRound } from "lucide-react";

import { Badge } from "../../../../components/common/Badge";
import Card from "../../../../components/common/Card";

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

const FALLBACK_VALUE = "--";

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

export default BPGeneralInfoView;
