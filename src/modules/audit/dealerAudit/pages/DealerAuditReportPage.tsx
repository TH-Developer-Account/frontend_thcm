// modules/audit/dealerAudit/pages/DealerAuditReportPage.tsx
//
// Final scorecard. Available once a final score exists (approved, improvement
// required or closed).
//
// Everyone with report access sees: final score, section scores, items that
// need improvement and the photo evidence (each photo opens Google Maps and
// copies its coordinates).
// Reviewers / approvers / admins also see: reviewer scores and notes, the
// audit trail, and can email the report again.
// Dealers never see reviewer notes, the audit trail or comments.

import { Download, Mail, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { Alert } from "../../../../components/common/Alert";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import PageNavigation from "../../../../components/ui/PageNavigation/PageNavigation";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import {
	dealerAuditContent as content,
	formatDealerAuditMessage as format,
} from "../dealer-audit.content";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import {
	formatAuditDateTime,
	formatPercent,
} from "../../shared/execution/audit-execution.format";
import { flattenChecklistItems } from "../../shared/execution/audit-execution.utils";
import AuditStatusBadge from "../components/AuditStatusBadge";
import { DeficiencyList } from "../cycle/components/AuditReviewSections";
import ResendReportDialog from "../cycle/components/ResendReportDialog";
import { dealerCycleContent as cycleContent } from "../cycle/dealer-cycle.content";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { formatPeriodLabel } from "../dealer-audit.sla";
import { useAuditPermissions } from "../hooks/useDealerAuditAccess";
import {
	useDealerAudit,
	useDealerAuditChecklist,
	useDealerAuditHistory,
	useDealerAuditReport,
} from "../hooks/useDealerAudits";

const text = content.ui.report;

const toPercent = (score: number, max: number): number =>
	max > 0 ? Math.round((score / max) * 1000) / 10 : 0;

export default function DealerAuditReportPage() {
	const { auditId } = useParams();
	const auditQuery = useDealerAudit(auditId);
	const permissions = useAuditPermissions(auditQuery.data);
	const reportQuery = useDealerAuditReport(
		auditId,
		permissions.canDownloadReport,
	);
	const checklistQuery = useDealerAuditChecklist(auditId);
	const historyQuery = useDealerAuditHistory(
		auditId,
		permissions.canViewHistory,
	);
	const [isResendOpen, setIsResendOpen] = useState(false);
	const report = reportQuery.data;

	const items = useMemo(
		() =>
			checklistQuery.data
				? flattenChecklistItems(checklistQuery.data.sections)
				: [],
		[checklistQuery.data],
	);

	const back = (
		<PageNavigation
			variant="button"
			direction="back"
			ariaLabel={text.back}
			to={
				auditId
					? DEALER_AUDIT_ROUTES.audits.detail(auditId)
					: DEALER_AUDIT_ROUTES.audits.list
			}
		/>
	);

	if (
		auditQuery.isLoading ||
		(permissions.canDownloadReport && reportQuery.isLoading)
	) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				<p className="text-sm text-fg-secondary" role="status">
					{text.loading}
				</p>
			</PageSectionLayout>
		);
	}

	if (auditQuery.isError || reportQuery.isError) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				{back}
				<Alert
					variant="error"
					title={text.errorTitle}
					type="banner"
					description={getAuditActionErrorMessage(
						auditQuery.error ?? reportQuery.error,
						"report",
					)}
					primaryAction={{
						label: text.retry,
						onClick: () => {
							void auditQuery.refetch();
							void reportQuery.refetch();
						},
					}}
				/>
			</PageSectionLayout>
		);
	}

	if (!permissions.canDownloadReport || !report) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				{back}
				<Alert
					variant="info"
					title={text.unavailableTitle}
					description={text.unavailableDescription}
				/>
			</PageSectionLayout>
		);
	}

	const finalScore = report.finalScore ?? report.selfScore ?? 0;
	const finalPercent = toPercent(finalScore, report.maxScore);
	const canSeeReviewerDetail = permissions.canViewReviewerAssessment;

	return (
		<PageSectionLayout className="audit-page audit-page-narrow">
			<header className="flex flex-wrap items-start gap-3">
				{back}
				<div className="min-w-0 flex-1">
					<h1 className="break-words text-xl font-semibold text-fg">
						{text.title}
					</h1>
					<p className="text-sm text-fg-secondary">
						{report.dealerName}
						{report.dealerCode ? ` (${report.dealerCode})` : ""} ·{" "}
						{formatPeriodLabel(report.period)}
					</p>
				</div>
				<AuditStatusBadge status={report.status} />
			</header>

			<div className="audit-stack">
				{report.finalScoreSource === "SELF_AUTO" ? (
					<Alert
						variant="info"
						title={content.ui.detail.autoFinalizedTitle}
						description={content.ui.detail.autoFinalizedDescription}
					/>
				) : null}

				<Card variant="outlined" padding="default">
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div>
							<p className="text-xs font-medium text-fg-secondary">
								{text.finalScore}
							</p>
							<p className="text-3xl font-bold tabular-nums text-fg">
								{finalScore}
								<span className="text-lg font-medium text-fg-secondary">
									/{report.maxScore}
								</span>
							</p>
							<p className="text-sm font-medium tabular-nums text-fg-secondary">
								{formatPercent(finalPercent)}
							</p>
						</div>
						{report.selfScore !== null ? (
							<div className="text-right">
								<p className="text-xs font-medium text-fg-secondary">
									{text.selfScore}
								</p>
								<p className="text-lg font-semibold tabular-nums text-fg">
									{report.selfScore}/{report.maxScore}
								</p>
							</div>
						) : null}
					</div>
				</Card>

				<Card variant="outlined" title={text.sections} padding="compact">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-surface-muted text-left text-xs text-fg-label">
									<th scope="col" className="px-3 py-2 font-semibold">
										{text.section}
									</th>
									<th scope="col" className="px-3 py-2 text-right font-semibold">
										{text.score}
									</th>
									<th scope="col" className="px-3 py-2 text-right font-semibold">
										{text.percent}
									</th>
								</tr>
							</thead>
							<tbody>
								{report.sections.map((section) => (
									<tr key={section.sectionId} className="border-t border-line">
										<td className="px-3 py-2 break-words text-fg">
											{section.name}
										</td>
										<td className="px-3 py-2 text-right tabular-nums text-fg">
											{section.score}/{section.maxScore}
										</td>
										<td className="px-3 py-2 text-right font-medium tabular-nums text-fg">
											{formatPercent(
												toPercent(section.score, section.maxScore),
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card>

				{checklistQuery.isError ? (
					<Alert
						variant="warning"
						type="banner"
						title={cycleContent.common.loadError}
						primaryAction={{
							label: cycleContent.common.retry,
							onClick: () => void checklistQuery.refetch(),
						}}
					/>
				) : (
					<DeficiencyList
						items={items}
						title={cycleContent.reports.deficiencies}
						showReviewerNote={canSeeReviewerDetail}
						showEvidence
					/>
				)}

				{permissions.canViewHistory &&
				historyQuery.data &&
				historyQuery.data.length > 0 ? (
					<Card
						variant="outlined"
						title={cycleContent.reports.auditTrail}
						padding="compact"
					>
						<ol className="space-y-3">
							{historyQuery.data.map((entry) => (
								<li key={entry.id} className="border-l-2 border-line-strong pl-3">
									<p className="text-sm font-medium text-fg">
										{entry.actorName}
										{entry.actorRole ? ` · ${entry.actorRole}` : ""}
									</p>
									<p className="text-xs text-fg-secondary">
										{formatAuditDateTime(entry.occurredAt)}
									</p>
									{entry.comment ? (
										<p className="mt-1 break-words text-sm text-fg">
											{entry.comment}
										</p>
									) : null}
								</li>
							))}
						</ol>
					</Card>
				) : null}

				<p className="text-xs text-fg-secondary">
					{format(text.generated, {
						date: formatAuditDateTime(report.generatedAt),
					})}
				</p>

				<div className="flex flex-wrap gap-2 print:hidden">
					<Button
						type="button"
						text={text.print}
						Icon={Printer}
						appearance="standard"
						variant="outline"
						onClick={() => window.print()}
					/>
					{canSeeReviewerDetail ? (
						<Button
							type="button"
							text={cycleContent.reports.resend}
							Icon={Mail}
							appearance="standard"
							variant="outline"
							onClick={() => setIsResendOpen(true)}
						/>
					) : null}
					{report.downloadUrl ? (
						<Button
							type="button"
							text={text.download}
							Icon={Download}
							appearance="standard"
							variant="brand"
							onClick={() =>
								window.open(
									report.downloadUrl ?? "",
									"_blank",
									"noopener,noreferrer",
								)
							}
						/>
					) : null}
				</div>
			</div>

			<ResendReportDialog
				open={isResendOpen}
				auditId={report.auditId}
				onClose={() => setIsResendOpen(false)}
			/>
		</PageSectionLayout>
	);
}
