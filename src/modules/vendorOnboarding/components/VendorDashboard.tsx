import {
	BadgeCheck,
	CircleAlert,
	ClipboardList,
	Clock3,
	RefreshCw,
	UserRoundPlus,
} from "lucide-react";

import Card from "../../../components/common/Card";
import { useVendorDashboard } from "../hooks/useVendorDashboard";

// MetricCard now handles its own error/loading state
type MetricCardProps = {
	title: string;
	value: number;
	description: string;
	icon: typeof ClipboardList;
	iconClassName: string;
	isLoading?: boolean;
	isError?: boolean;
};

const MetricCard = ({
	title,
	value,
	description,
	icon: Icon,
	iconClassName,
	isLoading,
	isError,
}: MetricCardProps) => (
	<Card className="h-full">
		<div className="flex items-start justify-between gap-4">
			<div className="min-w-0">
				<p className="text-sm font-medium text-slate-500 dark:text-slate-400">
					{title}
				</p>

				{isError ? (
					<p className="mt-2 flex items-center gap-1.5 text-sm text-red-500">
						<CircleAlert size={14} aria-hidden="true" />
						Unable to load
					</p>
				) : (
					<p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
						{isLoading ? "—" : value.toLocaleString("en-IN")}
					</p>
				)}

				<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
					{description}
				</p>
			</div>

			<div className={`rounded-xl p-3 ${iconClassName}`}>
				<Icon size={20} aria-hidden="true" />
			</div>
		</div>
	</Card>
);

export default function VendorDashboard() {
	const { metrics, isTableError, isInitialLoading, isRefreshing, refresh } =
		useVendorDashboard();

	// Only block the whole page before ANY data has loaded
	if (isInitialLoading) {
		return (
			<div
				className="grid min-h-72 place-items-center text-sm text-slate-500"
				role="status"
			>
				Loading vendor dashboard...
			</div>
		);
	}

	// Full-page error removed — each card and the table now report their own errors.
	return (
		<div className="space-y-5">
			<div className="flex justify-end">
				<button
					type="button"
					onClick={() => void refresh()}
					disabled={isRefreshing}
					className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
				>
					<RefreshCw
						size={16}
						className={isRefreshing ? "animate-spin" : undefined}
						aria-hidden="true"
					/>
					{isRefreshing ? "Refreshing" : "Refresh"}
				</button>
			</div>

			<section
				className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
				aria-label="Vendor onboarding summary"
			>
				<MetricCard
					title="Total onboardings"
					value={metrics.total.value}
					isLoading={metrics.total.isLoading}
					isError={metrics.total.isError}
					description="All vendor onboarding records"
					icon={ClipboardList}
					iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
				/>
				<MetricCard
					title="Pending on me"
					value={metrics.pending.value}
					isLoading={metrics.pending.isLoading}
					isError={metrics.pending.isError}
					description="Requests waiting for your action"
					icon={Clock3}
					iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
				/>
				<MetricCard
					title="Approved by me"
					value={metrics.approved.value}
					isLoading={metrics.approved.isLoading}
					isError={metrics.approved.isError}
					description="Requests you have approved"
					icon={BadgeCheck}
					iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
				/>
				<MetricCard
					title="Created by me"
					value={metrics.created.value}
					isLoading={metrics.created.isLoading}
					isError={metrics.created.isError}
					description="Requests initiated by you"
					icon={UserRoundPlus}
					iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"
				/>
			</section>

			<section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
				<Card title="Recent vendor onboardings">
					{isTableError ? (
						<div className="flex flex-col items-center gap-3 py-10 text-center">
							<CircleAlert className="text-red-500" aria-hidden="true" />
							<p className="font-medium text-slate-900 dark:text-white">
								Unable to load recent onboardings
							</p>
							<button
								type="button"
								onClick={() => void refresh()}
								className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-700"
							>
								<RefreshCw size={16} aria-hidden="true" />
								Retry
							</button>
						</div>
					) : (
						<div className="overflow-x-auto">
							{/* table markup unchanged, isTableLoading can drive a skeleton if you have one */}
						</div>
					)}
				</Card>

				<Card title="Status overview">{/* unchanged */}</Card>
			</section>
		</div>
	);
}
