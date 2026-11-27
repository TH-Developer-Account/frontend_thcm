// modules/audit/dealerAudit/pages/DealerAuditReportsPage.tsx
//
// Every finished audit and its final score in one place, with search and
// sorting. Open a report, or email it again to chosen people.
// AuditReportList is also used by the dashboard.

import { FileText, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../../components/common/Button";
import { SearchInput } from "../../../../components/forms/SearchInput";
import SelectInput from "../../../../components/forms/SelectInput";
import { PageHeader } from "../../../../components/ui/PageHeader";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import AuditSummaryCard from "../cycle/components/AuditSummaryCard";
import {
	PageEmpty,
	PageError,
	PageLoading,
} from "../cycle/components/AuditPageStates";
import { ResendReportDialog } from "../components/AuditWorkflowDialogs";
import { dealerCycleContent as content } from "../cycle/dealer-cycle.content";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import type {
	DealerAuditListParams,
	DealerAuditStatus,
} from "../dealer-audit.types";
import { useDealerAuditSession } from "../hooks/useDealerAuditAccess";
import { useDealerAuditList } from "../hooks/useDealerAudits";

const text = content.reports;
const REPORT_STATUSES: readonly DealerAuditStatus[] = [
	"APPROVED",
	"IMPROVEMENT_REQUIRED",
	"CLOSED",
];
const PAGE_SIZE = 24;
const SEARCH_DELAY_MS = 300;

type SortOption = {
	value: string;
	label: string;
	sortBy: DealerAuditListParams["sortBy"];
	sortOrder: DealerAuditListParams["sortOrder"];
};

const SORT_OPTIONS: SortOption[] = [
	{ value: "newest", label: "Newest first", sortBy: "updatedAt", sortOrder: "desc" },
	{ value: "oldest", label: "Oldest first", sortBy: "updatedAt", sortOrder: "asc" },
	{ value: "az", label: "Dealer A to Z", sortBy: "dealerName", sortOrder: "asc" },
	{ value: "za", label: "Dealer Z to A", sortBy: "dealerName", sortOrder: "desc" },
];

export function AuditReportList() {
	const navigate = useNavigate();
	const { permissions } = useDealerAuditSession();
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortOption>(SORT_OPTIONS[0]);
	const [page, setPage] = useState(1);
	const [resendAuditId, setResendAuditId] = useState<string | null>(null);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setSearch(searchInput);
			setPage(1);
		}, SEARCH_DELAY_MS);
		return () => window.clearTimeout(timer);
	}, [searchInput]);

	const audits = useDealerAuditList({
		page,
		pageSize: PAGE_SIZE,
		search,
		statuses: [...REPORT_STATUSES],
		sortBy: sort.sortBy,
		sortOrder: sort.sortOrder,
	});
	// Emailing a report is for admins and reviewers, never dealers.
	const canResend =
		permissions.canReassignReviewer || permissions.canSubmitReview;

	return (
		<>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<SearchInput
					value={searchInput}
					onChange={setSearchInput}
					placeholder="Search dealer, code or period"
					containerClassName="sm:col-span-2"
				/>
				<SelectInput
					name="reportSort"
					aria-label="Sort reports"
					options={SORT_OPTIONS}
					value={sort}
					onChange={(option) => {
						setSort(
							SORT_OPTIONS.find((o) => o.value === option?.value) ??
								SORT_OPTIONS[0],
						);
						setPage(1);
					}}
				/>
			</div>

			{audits.isLoading ? <PageLoading /> : null}
			{audits.isError ? (
				<PageError
					message={audits.errorMessage}
					onRetry={() => void audits.refetch()}
				/>
			) : null}
			{!audits.isLoading && !audits.isError && audits.items.length === 0 ? (
				<PageEmpty title={text.empty} help={text.emptyHelp} />
			) : null}

			{audits.items.length > 0 ? (
				<ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{audits.items.map((audit) => (
						<li key={audit.id}>
							<AuditSummaryCard
								audit={audit}
								showScore
								primaryAction={{
									label: content.myAudits.primary.viewReport,
									Icon: FileText,
									onClick: () =>
										navigate(DEALER_AUDIT_ROUTES.audits.report(audit.id)),
								}}
								secondary={
									canResend ? (
										<Button
											type="button"
											text={text.resend}
											Icon={Mail}
											appearance="standard"
											variant="outline"
											size="sm"
											onClick={() => setResendAuditId(audit.id)}
										/>
									) : null
								}
							/>
						</li>
					))}
				</ul>
			) : null}

			{audits.totalPages > 1 ? (
				<div className="flex items-center justify-center gap-3 text-sm">
					<Button
						type="button"
						text="Previous"
						appearance="standard"
						variant="outline"
						size="sm"
						disabled={page <= 1}
						onClick={() => setPage(page - 1)}
					/>
					<span>
						{page} / {audits.totalPages}
					</span>
					<Button
						type="button"
						text="Next"
						appearance="standard"
						variant="outline"
						size="sm"
						disabled={page >= audits.totalPages}
						onClick={() => setPage(page + 1)}
					/>
				</div>
			) : null}

			<ResendReportDialog
				open={resendAuditId !== null}
				auditId={resendAuditId}
				onClose={() => setResendAuditId(null)}
			/>
		</>
	);
}

export default function DealerAuditReportsPage() {
	return (
		<PageSectionLayout className="audit-page">
			<PageHeader headerText={text.title} subtitleText={text.subtitle} />
			<div className="audit-stack">
				<AuditReportList />
			</div>
		</PageSectionLayout>
	);
}
