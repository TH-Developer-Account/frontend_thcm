import Card from "../../../../components/common/Card";

type Props = {
	completed: number;
	total: number;
	percentage: number;
	compact?: boolean;
};

export default function AuditProgress({
	completed,
	total,
	percentage,
	compact = false,
}: Props) {
	return (
		<Card
			variant="subtle"
			padding="compact"
			className={compact ? "rounded-lg!" : ""}
		>
			<div className="space-y-2">
				<div className="flex items-center justify-between gap-3 text-xs">
					<span className="font-semibold text-slate-900">
						{compact ? `${completed} of ${total}` : "Overall Progress"}
					</span>
					<span className="text-slate-600">
						{compact
							? `${percentage}%`
							: `${completed} of ${total} completed · ${percentage}%`}
					</span>
				</div>
				<div
					className="h-2 overflow-hidden rounded-full bg-slate-200"
					role="progressbar"
					aria-label="Audit completion"
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={percentage}
				>
					<div
						className="h-full rounded-full bg-brand transition-[width]"
						style={{ width: `${percentage}%` }}
					/>
				</div>
			</div>
		</Card>
	);
}
