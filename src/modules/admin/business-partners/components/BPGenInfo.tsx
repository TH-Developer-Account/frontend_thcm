import { Badge } from "../../../../components/common/Badge";
import { Building2, Hash, MapPinned, Phone, UserRound } from "lucide-react";
import BPCards from "./BPCards";
import Card from "../../../../components/common/Card";

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

const BPGeneralInfo = ({
	name,
	// number,
	// mainContactPerson,
	// mainContactNumber,
	// code,
	// zone,
	status = "Active",
	title,
}: BPGeneralInfoProps) => {
	const displayTitle = title || name || "Business Partner";

	const generalInfoCards = [
		{
			label: "Code",
			value: "JDE-204",
			icon: Hash,
			iconClassName: "bg-amber-50 text-amber-600",
		},
		{
			label: "Zone",
			value: "South",
			icon: MapPinned,
			iconClassName: "bg-rose-50 text-rose-600",
		},
		{
			label: "BP Number",
			value: "BP-10248",
			icon: Phone,
			iconClassName: "bg-emerald-50 text-emerald-600",
		},
		{
			label: "Main Contact",
			value: "John Doe",
			icon: UserRound,
			iconClassName: "bg-violet-50 text-violet-600",
		},
	];

	return (
		<Card padding="none" variant="default">
			<div className="bp-gen-header bp-gen-header-clean">
				<div className="bp-gen-header-left">
					<div className="bp-gen-title-row">
						<div className="bp-gen-title-icon">
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
			<BPCards
				items={generalInfoCards}
				columnsClassName="sm:grid-cols-2 xl:grid-cols-4"
			/>
		</Card>
	);
};

export default BPGeneralInfo;
