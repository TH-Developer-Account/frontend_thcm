// modules/audit/dealerAudit/pages/MyAuditsPage.tsx
//
// The dealer's home screen: big, plain cards — one per audit — each with ONE
// obvious button for the next step (Start / Continue / Review & submit /
// Fix flagged items / See status / View report).

import {
	CheckCircle2,
	ClipboardList,
	FileText,
	Hourglass,
	Play,
	Send,
	Wrench,
	type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../../../components/ui/PageHeader";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import AuditSummaryCard, {
	type AuditCardAction,
} from "../cycle/components/AuditSummaryCard";
import {
	PageEmpty,
	PageError,
	PageLoading,
} from "../cycle/components/AuditPageStates";
import { dealerCycleContent as content } from "../cycle/dealer-cycle.content";
import {
	getDealerPrimaryAction,
	sortAuditsForDealer,
	type DealerPrimaryActionKey,
} from "../cycle/dealer-cycle.logic";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import type { DealerAuditListItem } from "../dealer-audit.types";
import { useDealerAuditList } from "../hooks/useDealerAudits";

const text = content.myAudits;

/** Large enough for one dealer's open audits across quarters. */
const MY_AUDITS_PARAMS = { page: 1, pageSize: 50 } as const;

const PRIMARY_ICONS: Record<DealerPrimaryActionKey, LucideIcon> = {
	start: Play,
	continue: ClipboardList,
	submit: Send,
	fix: Wrench,
	viewStatus: Hourglass,
	viewReport: FileText,
};

const getRoute = (key: DealerPrimaryActionKey, auditId: string): string => {
	switch (key) {
		case "start":
		case "continue":
		case "fix":
			return DEALER_AUDIT_ROUTES.execution.checklist(auditId);
		case "submit":
			return DEALER_AUDIT_ROUTES.audits.submit(auditId);
		case "viewStatus":
			return DEALER_AUDIT_ROUTES.audits.status(auditId);
		case "viewReport":
			return DEALER_AUDIT_ROUTES.audits.report(auditId);
	}
};

export default function MyAuditsPage() {
	const navigate = useNavigate();
	const audits = useDealerAuditList(MY_AUDITS_PARAMS);
	const sorted = useMemo(() => sortAuditsForDealer(audits.items), [audits.items]);

	const buildAction = (audit: DealerAuditListItem): AuditCardAction => {
		const key = getDealerPrimaryAction(audit);
		return {
			label: text.primary[key],
			Icon: PRIMARY_ICONS[key],
			onClick: () => navigate(getRoute(key, audit.id)),
		};
	};

	return (
		<PageSectionLayout className="audit-page">
			<PageHeader headerText={text.title} subtitleText={text.subtitle} />

			<div className="audit-stack">
				{audits.isLoading ? <PageLoading /> : null}

				{audits.isError ? (
					<PageError message={audits.errorMessage} onRetry={() => void audits.refetch()} />
				) : null}

				{!audits.isLoading && !audits.isError && sorted.length === 0 ? (
					<PageEmpty title={text.empty} help={text.emptyHelp} />
				) : null}

				{sorted.length > 0 ? (
					<ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{sorted.map((audit) => (
							<li key={audit.id}>
								<AuditSummaryCard
									audit={audit}
									primaryAction={buildAction(audit)}
									showScore={audit.finalScore !== null}
									note={
										audit.openClarificationCount > 0 ? (
											<span className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
												<Wrench className="size-4" aria-hidden="true" />
												{text.reviewerRemarks} ({audit.openClarificationCount})
											</span>
										) : getDealerPrimaryAction(audit) === "viewReport" ? (
											<span className="flex items-center gap-1.5 text-sm text-emerald-800">
												<CheckCircle2 className="size-4" aria-hidden="true" />
												{content.status.next[audit.status]}
											</span>
										) : null
									}
								/>
							</li>
						))}
					</ul>
				) : null}
			</div>
		</PageSectionLayout>
	);
}
