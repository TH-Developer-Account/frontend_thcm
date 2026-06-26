import type { LucideIcon } from "lucide-react";

type BPCardItem = {
	label: string;
	value: string | number;
	icon: LucideIcon;
	iconClassName?: string; // optional styling control
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
		<div
			className={`grid gap-3 border-b border-zinc-200 bg-zinc-50/70 px-4 py-4 ${columnsClassName} ${className}`}
		>
			{items.map((item) => {
				const Icon = item.icon;

				return (
					<div
						key={item.label}
						className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5"
					>
						<div className="flex items-center justify-between gap-3">
							<div className="min-w-0">
								<p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
									{item.label}
								</p>

								<h3 className="mt-0.5 truncate text-sm font-medium text-zinc-800">
									{item.value}
								</h3>
							</div>

							<div
								className={`rounded-md p-1.5 ${
									item.iconClassName || "bg-zinc-100 text-zinc-500"
								}`}
							>
								<Icon size={15} />
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default BPCards;
