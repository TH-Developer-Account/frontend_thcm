import { useMemo } from "react";
import {
	BadgeCheck,
	CircleAlert,
	ClipboardList,
	Clock3,
	RefreshCw,
	UserRoundPlus,
} from "lucide-react";

import Card from "../../../components/common/Card";
import type { VendorListingRow } from "../api/vendorOnboarding.api";
import { useVendorDashboard } from "../hooks/useVendorDashboard";

const ACTIVE_STATUSES = new Set([
	"VENDOR_SUBMITTED",
	"IN_REVIEW",
	"IN_PROGRESS",
	"THCM_SUBMITTED",
	"EXTERNAL_REVIEW_PENDING",
]);

const APPROVED_STATUSES = new Set([
	"APPROVED",
	"THCM_APPROVED",
	"EXTERNAL_ACCEPTED",
	"CLOSED",
]);

const CLARIFICATION_STATUSES = new Set([
	"THCM_CLARIFICATION_REQUESTED",
	"CLARIFIED",
]);

const formatStatus = (status: string): string =>
	status
		.toLowerCase()
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

const formatDate = (value?: string): string => {
	if (!value) return "—";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "—";

	return new Intl.DateTimeFormat("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
};

const getStatusTone = (status: string): string => {
	const normalizedStatus = status.toUpperCase();

	if (APPROVED_STATUSES.has(normalizedStatus)) {
		return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300";
	}

	if (CLARIFICATION_STATUSES.has(normalizedStatus)) {
		return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300";
	}

	if (normalizedStatus === "DRAFT" || normalizedStatus === "AWAITING_VENDOR") {
		return "bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-300";
	}

	return "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300";
};

type MetricCardProps = {
	title: string;
	value: number;
	description: string;
	icon: typeof ClipboardList;
	iconClassName: string;
};

const MetricCard = ({
	title,
	value,
	description,
	icon: Icon,
	iconClassName,
}: MetricCardProps) => (
	<Card className="h-full">
		<div className="flex items-start justify-between gap-4">
			<div className="min-w-0">
				<p className="text-sm font-medium text-slate-500 dark:text-slate-400">
					{title}
				</p>
				<p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
					{value.toLocaleString("en-IN")}
				</p>
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

const getInitiatedBy = (row: VendorListingRow): string => {
	const fullName = [row.initiatedBy?.first_name, row.initiatedBy?.last_name]
		.filter(Boolean)
		.join(" ");

	return fullName || "—";
};

export default function VendorDashboard() {
	const {
		recentOnboardings,
		totalOnboardings,
		pendingOnMe,
		approvedByMe,
		createdByMe,
		isLoading,
		isRefreshing,
		error,
		refresh,
	} = useVendorDashboard();

	const analytics = useMemo(() => {
		return recentOnboardings.reduce(
			(summary, row) => {
				const status = row.status.toUpperCase();

				if (ACTIVE_STATUSES.has(status)) summary.active += 1;
				if (APPROVED_STATUSES.has(status)) summary.completed += 1;
				if (CLARIFICATION_STATUSES.has(status)) summary.clarification += 1;
				if (status === "AWAITING_VENDOR") summary.awaitingVendor += 1;

				return summary;
			},
			{ active: 0, completed: 0, clarification: 0, awaitingVendor: 0 },
		);
	}, [recentOnboardings]);

	if (isLoading) {
		return (
			<div
				className="grid min-h-72 place-items-center text-sm text-slate-500"
				role="status"
			>
				Loading vendor dashboard...
			</div>
		);
	}

	if (error) {
		return (
			<Card>
				<div className="flex flex-col items-center gap-3 py-10 text-center">
					<CircleAlert className="text-red-500" aria-hidden="true" />
					<div>
						<p className="font-medium text-slate-900 dark:text-white">
							Unable to load vendor analytics
						</p>
						<p className="mt-1 text-sm text-slate-500">
							Please retry the dashboard request.
						</p>
					</div>
					<button
						type="button"
						onClick={() => void refresh()}
						className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-700"
					>
						<RefreshCw size={16} aria-hidden="true" />
						Retry
					</button>
				</div>
			</Card>
		);
	}

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
					value={totalOnboardings}
					description="All vendor onboarding records"
					icon={ClipboardList}
					iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
				/>
				<MetricCard
					title="Pending on me"
					value={pendingOnMe}
					description="Requests waiting for your action"
					icon={Clock3}
					iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
				/>
				<MetricCard
					title="Approved by me"
					value={approvedByMe}
					description="Requests you have approved"
					icon={BadgeCheck}
					iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
				/>
				<MetricCard
					title="Created by me"
					value={createdByMe}
					description="Requests initiated by you"
					icon={UserRoundPlus}
					iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"
				/>
			</section>

			<section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
				<Card title="Recent vendor onboardings">
					<div className="overflow-x-auto">
						<table className="w-full min-w-[720px] text-left text-sm">
							<thead>
								<tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
									<th className="px-3 py-3 font-medium">Vendor</th>
									<th className="px-3 py-3 font-medium">Reference</th>
									<th className="px-3 py-3 font-medium">Initiated by</th>
									<th className="px-3 py-3 font-medium">Status</th>
									<th className="px-3 py-3 font-medium">Updated</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
								{recentOnboardings.slice(0, 8).map((row) => (
									<tr
										key={row.id}
										className="text-slate-700 dark:text-slate-200"
									>
										<td className="px-3 py-3">
											<p className="font-medium text-slate-900 dark:text-white">
												{row.vendorName || "Unnamed vendor"}
											</p>
											<p className="mt-0.5 text-xs text-slate-500">
												{row.email || row.mobile || "No contact details"}
											</p>
										</td>
										<td className="px-3 py-3">{row.referenceNumber || "—"}</td>
										<td className="px-3 py-3">{getInitiatedBy(row)}</td>
										<td className="px-3 py-3">
											<span
												className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusTone(row.status)}`}
											>
												{formatStatus(row.status)}
											</span>
										</td>
										<td className="px-3 py-3">{formatDate(row.updated_at)}</td>
									</tr>
								))}
							</tbody>
						</table>

						{recentOnboardings.length === 0 ? (
							<div className="py-12 text-center text-sm text-slate-500">
								No vendor onboarding records found.
							</div>
						) : null}
					</div>
				</Card>

				<Card title="Status overview">
					<p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
						Based on the latest {recentOnboardings.length} onboarding records.
					</p>
					<div className="space-y-3">
						{[
							["Active workflows", analytics.active, "bg-blue-500"],
							["Completed", analytics.completed, "bg-emerald-500"],
							["Awaiting vendor", analytics.awaitingVendor, "bg-slate-400"],
							["Clarification", analytics.clarification, "bg-amber-500"],
						].map(([label, value, color]) => (
							<div
								key={String(label)}
								className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3 dark:border-slate-800"
							>
								<div className="flex items-center gap-2.5">
									<span className={`h-2.5 w-2.5 rounded-full ${color}`} />
									<span className="text-sm text-slate-600 dark:text-slate-300">
										{label}
									</span>
								</div>
								<strong className="text-sm text-slate-900 dark:text-white">
									{value}
								</strong>
							</div>
						))}
					</div>
				</Card>
			</section>
		</div>
	);
}
