// modules/audit/dealerAudit/pages/DealerAuditReportPage.tsx
//
// Final scorecard. Available once a final score exists (approved, improvement
// required or closed). The dealer sees the report only — no workflow
// details, reviewer messages or comments.

import { Download, Printer } from "lucide-react";
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
import { formatAuditDateTime, formatPercent } from "../../shared/execution/audit-execution.format";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { formatPeriodLabel } from "../dealer-audit.sla";
import AuditStatusBadge from "../components/AuditStatusBadge";
import { useAuditPermissions } from "../hooks/useDealerAuditAccess";
import { useDealerAudit, useDealerAuditReport } from "../hooks/useDealerAudits";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";

const text = content.ui.report;

const toPercent = (score: number, max: number): number =>
	max > 0 ? Math.round((score / max) * 1000) / 10 : 0;

export default function DealerAuditReportPage() {
	const { auditId } = useParams();
	const auditQuery = useDealerAudit(auditId);
	const permissions = useAuditPermissions(auditQuery.data);
	const reportQuery = useDealerAuditReport(auditId, permissions.canDownloadReport);
	const report = reportQuery.data;

	const back = (
		<PageNavigation
			variant="button"
			direction="back"
			ariaLabel={text.back}
			to={auditId ? DEALER_AUDIT_ROUTES.audits.detail(auditId) : DEALER_AUDIT_ROUTES.audits.list}
		/>
	);

	if (auditQuery.isLoading || (permissions.canDownloadReport && reportQuery.isLoading)) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				<p className="text-sm text-slate-600" role="status">
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

	return (
		<PageSectionLayout className="audit-page audit-page-narrow">
			<header className="flex flex-wrap items-start gap-3">
				{back}
				<div className="min-w-0 flex-1">
					<h1 className="break-words text-lg font-semibold text-(--color-text-primary)">
						{text.title}
					</h1>
					<p className="text-sm text-(--color-text-secondary)">
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
							<p className="text-xs text-(--color-text-secondary)">
								{text.finalScore}
							</p>
							<p className="text-3xl font-bold tabular-nums text-(--color-text-primary)">
								{finalScore}
								<span className="text-lg font-medium text-(--color-text-secondary)">
									/{report.maxScore}
								</span>
							</p>
							<p className="text-sm text-(--color-text-secondary)">
								{formatPercent(finalPercent)}
							</p>
						</div>
						{report.selfScore !== null ? (
							<div className="text-right">
								<p className="text-xs text-(--color-text-secondary)">
									{text.selfScore}
								</p>
								<p className="text-lg font-semibold tabular-nums">
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
								<tr className="text-left text-xs text-(--color-text-secondary)">
									<th scope="col" className="py-1 pr-3 font-medium">
										{text.section}
									</th>
									<th scope="col" className="py-1 pr-3 text-right font-medium">
										{text.score}
									</th>
									<th scope="col" className="py-1 text-right font-medium">
										{text.percent}
									</th>
								</tr>
							</thead>
							<tbody>
								{report.sections.map((section) => (
									<tr
										key={section.sectionId}
										className="border-t border-(--color-border-default)"
									>
										<td className="py-2 pr-3 break-words">{section.name}</td>
										<td className="py-2 pr-3 text-right tabular-nums">
											{section.score}/{section.maxScore}
										</td>
										<td className="py-2 text-right tabular-nums">
											{formatPercent(toPercent(section.score, section.maxScore))}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card>

				<p className="text-xs text-(--color-text-secondary)">
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
					{report.downloadUrl ? (
						<Button
							type="button"
							text={text.download}
							Icon={Download}
							appearance="standard"
							variant="brand"
							onClick={() =>
								window.open(report.downloadUrl ?? "", "_blank", "noopener,noreferrer")
							}
						/>
					) : null}
				</div>
			</div>
		</PageSectionLayout>
	);
}
