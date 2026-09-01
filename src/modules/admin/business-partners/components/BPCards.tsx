import type { LucideIcon } from "lucide-react";

type BPCardIconTone = "brand" | "neutral" | "info" | "success" | "warning";

type BPCardItem = {
	label: string;
	value: string | number;
	icon: LucideIcon;
	iconTone?: BPCardIconTone;
};

type BPCardsProps = {
	items: BPCardItem[];
	className?: string;
	columnsClassName?: string;
};

const BPCards = ({
	items,
	className = "",
	columnsClassName = "sm:grid-cols-2 xl:grid-cols-4",
}: BPCardsProps) => {
	return (
		<div className={`bp-summary-grid ${columnsClassName} ${className}`}>
			{items.map((item) => {
				const Icon = item.icon;
				const iconTone = item.iconTone || "neutral";

				return (
					<div key={item.label} className="bp-stat-card">
						<div className="bp-stat-card-inner">
							<p className="bp-stat-label">{item.label}</p>
							<h3 className="bp-stat-value" title={String(item.value)}>
								{item.value}
							</h3>
						</div>

						<div className={`bp-stat-icon bp-stat-icon--${iconTone}`}>
							<Icon size={15} aria-hidden="true" />
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default BPCards;
