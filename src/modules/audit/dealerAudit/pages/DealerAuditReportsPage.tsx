// modules/audit/dealerAudit/pages/DealerAuditReportsPage.tsx
//
// Every finished audit and its final score in one place. Open a report, or
// email it again to chosen people.

import { FileText, Mail } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../../components/common/Button";
import { PageHeader } from "../../../../components/ui/PageHeader";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import AuditSummaryCard from "../cycle/components/AuditSummaryCard";
import {
	PageEmpty,
	PageError,
	PageLoading,
} from "../cycle/components/AuditPageStates";
import ResendReportDialog from "../cycle/components/ResendReportDialog";
import { dealerCycleContent as content } from "../cycle/dealer-cycle.content";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import type { DealerAuditStatus } from "../dealer-audit.types";
import { useDealerAuditSession } from "../hooks/useDealerAuditAccess";
import { useDealerAuditList } from "../hooks/useDealerAudits";

const text = content.reports;
const REPORT_STATUSES: readonly DealerAuditStatus[] = [
	"APPROVED",
	"IMPROVEMENT_REQUIRED",
	"CLOSED",
];

export default function DealerAuditReportsPage() {
	const navigate = useNavigate();
	const { permissions } = useDealerAuditSession();
	const params = useMemo(
		() => ({ page: 1, pageSize: 50, statuses: [...REPORT_STATUSES] }),
		[],
	);
	const audits = useDealerAuditList(params);
	const [resendAuditId, setResendAuditId] = useState<string | null>(null);

	return (
		<PageSectionLayout className="audit-page">
			<PageHeader headerText={text.title} subtitleText={text.subtitle} />

			<div className="audit-stack">
				{audits.isLoading ? <PageLoading /> : null}
				{audits.isError ? (
					<PageError message={audits.errorMessage} onRetry={() => void audits.refetch()} />
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
										onClick: () => navigate(DEALER_AUDIT_ROUTES.audits.report(audit.id)),
									}}
									secondary={
										permissions.canDownloadReport ? (
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
			</div>

			<ResendReportDialog
				open={resendAuditId !== null}
				auditId={resendAuditId}
				onClose={() => setResendAuditId(null)}
			/>
		</PageSectionLayout>
	);
}
