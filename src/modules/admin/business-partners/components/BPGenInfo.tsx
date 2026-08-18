import { Building2, Hash, MapPinned, Phone, UserRound } from "lucide-react";

import { Badge } from "../../../../components/common/Badge";
import Card from "../../../../components/common/Card";

import BPCards from "./BPCards";

type BPGeneralInfoProps = {
	name?: string;
	number?: string;
	mainContactPerson?: string;
	mainContactNumber?: string;
	code?: string;
	zone?: string;
	status?: string;
	title?: string;
};

const fallbackValue = "--";

const BPGeneralInfo = ({
	name,
	number,
	mainContactPerson,
	mainContactNumber,
	code,
	zone,
	status = "Active",
	title,
}: BPGeneralInfoProps) => {
	const displayTitle = title || name || "Business Partner";

	const generalInfoCards = [
		{
			label: "Code",
			value: code || "JDE-204",
			icon: Hash,
			iconTone: "brand" as const,
		},
		{
			label: "Zone",
			value: zone || fallbackValue,
			icon: MapPinned,
			iconTone: "neutral" as const,
		},
		{
			label: "BP Number",
			value: number || "BP-10248",
			icon: Phone,
			iconTone: "neutral" as const,
		},
		{
			label: "Main Contact",
			value: mainContactPerson || mainContactNumber || fallbackValue,
			icon: UserRound,
			iconTone: "neutral" as const,
		},
	];

	return (
		<Card padding="none" variant="default">
			<div className="bp-gen-header-clean">
				<div className="bp-gen-header-left">
					<div className="bp-gen-title-row">
						<div className="bp-gen-title-icon" aria-hidden="true">
							<Building2 size={18} />
						</div>

						<div className="bp-gen-title-wrap">
							<h3 className="bp-gen-title brand-text">{displayTitle}</h3>
							<p className="bp-gen-subtext">Business Partner Details</p>
						</div>
					</div>
				</div>

				<div className="bp-header-status">
					<span className="bp-status-label">Status:</span>
					<Badge status="Approved">{status}</Badge>
				</div>
			</div>

			<BPCards items={generalInfoCards} />
		</Card>
	);
};

export default BPGeneralInfo;
