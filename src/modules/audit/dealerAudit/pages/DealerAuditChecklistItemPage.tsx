// modules/audit/dealerAudit/pages/DealerAuditChecklistItemPage.tsx
//
// One parameter at a time, full screen on mobile. Three modes, decided by
// the audit-scoped permissions:
//   SELF       dealer answers (or fixes a flagged parameter)
//   REVIEW     reviewer scores the dealer's answer
//   READ_ONLY  everyone else, and every closed audit
//
// Leaving a parameter (Previous / Next / swipe / back) always goes through
// the draft's confirmLeave, so unsaved work is saved or knowingly discarded.

import { Check, ChevronRight } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "../../../../components/common/Alert";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { dealerAuditContent as content } from "../dealer-audit.content";
import {
	getAssessmentMode,
	type DealerAuditPermissions,
} from "../dealer-audit.permissions";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { isClarificationStatus } from "../dealer-audit.status";
import type { DealerAudit, DealerAuditChecklistItem } from "../dealer-audit.types";
import {
	flattenChecklistItems,
	getChecklistProgress,
	getEvidenceLimits,
	getItemNeighbours,
	getReviewProgress,
	isItemClarificationOpen,
	type ChecklistProgress,
} from "../../shared/execution/audit-execution.utils";
import ChecklistItemShell, {
	type ItemNavigationTarget,
} from "../../shared/execution/components/ChecklistItemShell";
import DealerClarificationPanel from "../components/DealerClarificationPanel";
import SelfAssessmentAnswerPanel from "../../shared/execution/components/SelfAssessmentAnswerPanel";
import ReviewItemForm from "../../shared/execution/components/ReviewItemForm";
import ReviewResultPanel from "../../shared/execution/components/ReviewResultPanel";
import SaveStatusIndicator from "../../shared/execution/components/SaveStatusIndicator";
import SelfAssessmentForm from "../../shared/execution/components/SelfAssessmentForm";
import {
	useAuditPermissions,
} from "../hooks/useDealerAuditAccess";
import { useDealerAudit, useDealerAuditChecklist } from "../hooks/useDealerAudits";
import { useChecklistItemDraft } from "../hooks/useChecklistItemDraft";
import { useEvidenceUploader } from "../hooks/useEvidenceUploader";
import { useReviewItemDraft } from "../hooks/useReviewItemDraft";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";

const text = content.ui.itemPage;

// ── Shared workspace plumbing ─────────────────────────────────────────

interface WorkspaceProps {
	audit: DealerAudit;
	item: DealerAuditChecklistItem;
	index: number;
	total: number;
	previousId: string | null;
	nextId: string | null;
	progress: ChecklistProgress;
	permissions: DealerAuditPermissions;
}

function useItemNavigation(
	auditId: string,
	previousId: string | null,
	nextId: string | null,
) {
	const navigate = useNavigate();

	/** Where a target leads; null = nowhere (no neighbour). */
	const getPath = useCallback(
		(target: ItemNavigationTarget): string | null => {
			if (target === "list") return DEALER_AUDIT_ROUTES.execution.checklist(auditId);
			const id = target === "next" ? nextId : previousId;
			return id ? DEALER_AUDIT_ROUTES.execution.item(auditId, id) : null;
		},
		[auditId, nextId, previousId],
	);

	const goTo = useCallback(
		(target: ItemNavigationTarget) => {
			const path = getPath(target);
			if (path) navigate(path);
		},
		[getPath, navigate],
	);

	return { goTo };
}

// ── Dealer self-assessment ────────────────────────────────────────────

interface SelfWorkspaceProps extends WorkspaceProps {
	editable: boolean;
}

function SelfWorkspace({
	audit,
	item,
	index,
	total,
	previousId,
	nextId,
	progress,
	permissions,
	editable,
}: SelfWorkspaceProps) {
	const { goTo } = useItemNavigation(audit.id, previousId, nextId);
	const draft = useChecklistItemDraft({ auditId: audit.id, item, editable });
	const uploader = useEvidenceUploader({
		auditId: audit.id,
		itemId: item.id,
		evidence: draft.values.evidence,
		updateEvidence: draft.updateEvidence,
		maxCount: getEvidenceLimits(item).max,
	});

	const handleNavigate = useCallback(
		(target: ItemNavigationTarget) => {
			void draft.confirmLeave().then((canLeave) => {
				if (canLeave) goTo(target);
			});
		},
		[draft, goTo],
	);

	const handleSaveAndContinue = async (): Promise<void> => {
		const saved = await draft.saveAndComplete();
		if (saved) goTo(nextId ? "next" : "list");
	};

	const showClarification =
		item.clarification !== null &&
		(permissions.canRespondToClarification || permissions.canViewComments);

	return (
		<ChecklistItemShell
			heading={audit.dealerName}
			subheading={[audit.auditNumber, audit.location].filter(Boolean).join(" · ")}
			item={item}
			index={index}
			total={total}
			hasPrevious={previousId !== null}
			hasNext={nextId !== null}
			progress={progress}
			progressLabel={text.selfProgress}
			isBusy={draft.isSaving || draft.isUploading}
			onNavigate={handleNavigate}
			statusSlot={
				editable ? (
					<div className="space-y-1">
						{draft.isUploading ? (
							<p className="text-xs text-slate-600" role="status">
								{text.uploadingHint}
							</p>
						) : null}
						<SaveStatusIndicator
							status={draft.saveStatus}
							error={draft.saveError}
							isDirty={draft.isDirty}
							onRetry={() => void draft.saveDraft()}
						/>
					</div>
				) : null
			}
			footerActions={
				editable ? (
					<Button
						type="button"
						text={nextId ? text.saveAndNext : text.saveAndFinish}
						Icon={nextId ? ChevronRight : Check}
						iconPosition="right"
						appearance="standard"
						variant="brand"
						loading={draft.isSaving}
						disabled={draft.isSaving || draft.isUploading}
						onClick={() => void handleSaveAndContinue()}
					/>
				) : null
			}
		>
			{showClarification ? (
				<DealerClarificationPanel
					auditId={audit.id}
					item={item}
					canRespond={permissions.canRespondToClarification}
				/>
			) : null}

			{editable ? (
				<Card variant="outlined" title={text.yourAnswer} padding="default">
					<SelfAssessmentForm
						item={item}
						draft={draft}
						uploader={uploader}
						editable={editable}
					/>
				</Card>
			) : (
				<Card variant="outlined" title={text.dealerAnswer} padding="default">
					<SelfAssessmentAnswerPanel item={item} />
				</Card>
			)}
		</ChecklistItemShell>
	);
}

// ── Reviewer ──────────────────────────────────────────────────────────

function ReviewWorkspace({
	audit,
	item,
	index,
	total,
	previousId,
	nextId,
	progress,
	permissions,
}: WorkspaceProps) {
	const { goTo } = useItemNavigation(audit.id, previousId, nextId);
	const draft = useReviewItemDraft({ auditId: audit.id, item });

	const handleNavigate = useCallback(
		(target: ItemNavigationTarget) => {
			void draft.confirmLeave().then((canLeave) => {
				if (canLeave) goTo(target);
			});
		},
		[draft, goTo],
	);

	const handleSaveAndContinue = async (): Promise<void> => {
		const saved = await draft.save();
		if (saved) goTo(nextId ? "next" : "list");
	};

	return (
		<ChecklistItemShell
			heading={audit.dealerName}
			subheading={[audit.auditNumber, audit.location].filter(Boolean).join(" · ")}
			item={item}
			index={index}
			total={total}
			hasPrevious={previousId !== null}
			hasNext={nextId !== null}
			progress={progress}
			progressLabel={text.reviewProgress}
			isBusy={draft.isSaving}
			onNavigate={handleNavigate}
			statusSlot={
				<SaveStatusIndicator
					status={draft.saveStatus}
					error={draft.saveError}
					isDirty={draft.isDirty}
					onRetry={() => void draft.save()}
				/>
			}
			footerActions={
				<Button
					type="button"
					text={nextId ? text.saveReviewAndNext : text.saveReviewAndFinish}
					Icon={nextId ? ChevronRight : Check}
					iconPosition="right"
					appearance="standard"
					variant="brand"
					loading={draft.isSaving}
					disabled={draft.isSaving}
					onClick={() => void handleSaveAndContinue()}
				/>
			}
		>
			{item.clarification && permissions.canViewComments ? (
				<DealerClarificationPanel
					auditId={audit.id}
					item={item}
					canRespond={false}
				/>
			) : null}

			<Card variant="outlined" title={text.dealerAnswer} padding="default">
				<SelfAssessmentAnswerPanel item={item} />
			</Card>

			<Card variant="outlined" title={text.yourReview} padding="default">
				<ReviewItemForm item={item} draft={draft} editable />
			</Card>
		</ChecklistItemShell>
	);
}

// ── Read-only ─────────────────────────────────────────────────────────

function ReadOnlyWorkspace({
	audit,
	item,
	index,
	total,
	previousId,
	nextId,
	progress,
	permissions,
}: WorkspaceProps) {
	const { goTo } = useItemNavigation(audit.id, previousId, nextId);

	return (
		<ChecklistItemShell
			heading={audit.dealerName}
			subheading={[audit.auditNumber, audit.location].filter(Boolean).join(" · ")}
			item={item}
			index={index}
			total={total}
			hasPrevious={previousId !== null}
			hasNext={nextId !== null}
			progress={progress}
			progressLabel={text.selfProgress}
			isBusy={false}
			onNavigate={goTo}
			footerActions={
				<Button
					type="button"
					text={text.next}
					Icon={ChevronRight}
					iconPosition="right"
					appearance="standard"
					variant="brand"
					disabled={nextId === null}
					onClick={() => goTo("next")}
				/>
			}
		>
			{item.clarification && permissions.canViewComments ? (
				<DealerClarificationPanel
					auditId={audit.id}
					item={item}
					canRespond={false}
				/>
			) : null}

			<Card variant="outlined" title={text.dealerAnswer} padding="default">
				<SelfAssessmentAnswerPanel item={item} />
			</Card>

			{permissions.canViewReviewerAssessment ? (
				<Card variant="outlined" title={text.reviewerResult} padding="default">
					<ReviewResultPanel item={item} />
				</Card>
			) : null}
		</ChecklistItemShell>
	);
}

// ── Page ──────────────────────────────────────────────────────────────

export default function DealerAuditChecklistItemPage() {
	const { auditId, itemId } = useParams();
	const navigate = useNavigate();

	const auditQuery = useDealerAudit(auditId);
	const checklistQuery = useDealerAuditChecklist(auditId);
	const audit = auditQuery.data;
	const permissions = useAuditPermissions(audit);
	const mode = getAssessmentMode(permissions);

	const items = useMemo(
		() =>
			checklistQuery.data
				? flattenChecklistItems(checklistQuery.data.sections)
				: [],
		[checklistQuery.data],
	);
	const neighbours = useMemo(
		() => getItemNeighbours(items, itemId ?? ""),
		[items, itemId],
	);
	const item = neighbours.index >= 0 ? items[neighbours.index] : undefined;

	const progress = useMemo(
		() =>
			mode === "REVIEW" ? getReviewProgress(items) : getChecklistProgress(items),
		[items, mode],
	);

	const listPath = auditId ? DEALER_AUDIT_ROUTES.execution.checklist(auditId) : "";

	if (auditQuery.isLoading || checklistQuery.isLoading) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				<p className="text-sm text-slate-600" role="status">
					{text.loading}
				</p>
			</PageSectionLayout>
		);
	}

	if (auditQuery.isError || checklistQuery.isError || !audit) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				<Alert
					variant="error"
					title={text.errorTitle}
					description={getAuditActionErrorMessage(
						auditQuery.error ?? checklistQuery.error,
						"parameter",
					)}
					primaryAction={{
						label: text.retry,
						onClick: () => {
							void auditQuery.refetch();
							void checklistQuery.refetch();
						},
					}}
				/>
			</PageSectionLayout>
		);
	}

	if (!permissions.canView) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				<Alert
					variant="warning"
					title={text.deniedTitle}
					description={text.deniedDescription}
				/>
			</PageSectionLayout>
		);
	}

	if (!item) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				<Card title={text.notFoundTitle}>
					<p className="mb-3 text-sm text-slate-600">{text.notFoundDescription}</p>
					<Button
						type="button"
						text={text.backToList}
						variant="brand"
						onClick={() => navigate(listPath)}
					/>
				</Card>
			</PageSectionLayout>
		);
	}

	const common: WorkspaceProps = {
		audit,
		item,
		index: neighbours.index,
		total: neighbours.total,
		previousId: neighbours.previous?.id ?? null,
		nextId: neighbours.next?.id ?? null,
		progress,
		permissions,
	};

	// During a clarification the dealer may only change the flagged items.
	const canEditThisItem =
		permissions.canEditSelfAssessment &&
		(!isClarificationStatus(audit.status) || isItemClarificationOpen(item));

	// `key` gives every parameter its own draft state.
	if (mode === "SELF") {
		return <SelfWorkspace key={item.id} {...common} editable={canEditThisItem} />;
	}
	if (mode === "REVIEW") {
		return <ReviewWorkspace key={item.id} {...common} />;
	}
	return <ReadOnlyWorkspace key={item.id} {...common} />;
}
