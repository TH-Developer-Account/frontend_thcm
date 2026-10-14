// modules/audit/dealerAudit/components/AuditWorkflowActions.tsx
//
// Every workflow action a user may take on one audit, with its confirmation
// dialog. Which buttons appear comes ONLY from the audit-scoped permissions;
// the backend re-checks each one.
//
// Validation always runs against server-confirmed data (the checklist
// query), never unsaved drafts.

import {
	BadgeCheck,
	ClipboardCheck,
	FileText,
	MessageSquareWarning,
	Play,
	RefreshCcw,
	Send,
	UserCog,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import Button from "../../../../components/common/Button";
import { dealerAuditContent as content } from "../dealer-audit.content";
import type { DealerAuditPermissions } from "../dealer-audit.permissions";
import {
	validateAuditForSubmission,
	validateReviewForSubmission,
} from "../dealer-audit.schemas";
import type {
	DealerAudit,
	DealerAuditChecklistItem,
} from "../dealer-audit.types";
import type { AuditValidationResult } from "../../shared/execution/audit-execution.validation";
import {
	useApproveAudit,
	useRaiseClarification,
	useReAudit,
	useReassignReviewer,
	useRejectAudit,
	useStartReview,
	useSubmitAudit,
	useSubmitReview,
} from "../hooks/useDealerAuditMutations";
import AuditSubmissionSummary from "../../shared/execution/components/AuditSubmissionSummary";
import {
	ApproveAuditDialog,
	ConfirmActionDialog,
	RaiseClarificationDialog,
	ReAuditDialog,
	ReassignReviewerDialog,
	RejectAuditDialog,
} from "./AuditWorkflowDialogs";

const text = content.ui.actions;

type OpenDialog =
	| "SUBMIT_SELF"
	| "START_REVIEW"
	| "SUBMIT_REVIEW"
	| "CLARIFICATION"
	| "APPROVE"
	| "REJECT"
	| "REASSIGN"
	| "RE_AUDIT"
	| null;

interface ValidationState {
	heading: string;
	result: AuditValidationResult;
}

interface AuditWorkflowActionsProps {
	audit: DealerAudit;
	/** Server-confirmed items; undefined while the checklist loads. */
	items: readonly DealerAuditChecklistItem[] | undefined;
	permissions: DealerAuditPermissions;
	onOpenChecklist: () => void;
	onOpenReport: () => void;
	onJumpToItem: (itemId: string) => void;
	onReAuditCreated: (auditId: string) => void;
}

export default function AuditWorkflowActions({
	audit,
	items,
	permissions,
	onOpenChecklist,
	onOpenReport,
	onJumpToItem,
	onReAuditCreated,
}: AuditWorkflowActionsProps) {
	const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
	const [validation, setValidation] = useState<ValidationState | null>(null);
	const close = (): void => setOpenDialog(null);

	const { mutateAsync: submitAudit } = useSubmitAudit();
	const { mutateAsync: startReview } = useStartReview();
	const { mutateAsync: submitReview } = useSubmitReview();
	const { mutateAsync: raiseClarification } = useRaiseClarification();
	const { mutateAsync: approveAudit } = useApproveAudit();
	const { mutateAsync: rejectAudit } = useRejectAudit();
	const { mutateAsync: reassignReviewer } = useReassignReviewer();
	const { mutateAsync: reAudit } = useReAudit();

	const checklistItems = useMemo(() => items ?? [], [items]);
	const hasChecklist = items !== undefined;

	const canStartReview =
		permissions.canReview &&
		(audit.status === "SUBMITTED" || audit.status === "RESUBMITTED");
	const canContinueChecklist =
		permissions.canEditSelfAssessment ||
		(permissions.canReview && audit.status === "UNDER_REVIEW");

	const handleSubmitSelfAssessment = (): void => {
		const result = validateAuditForSubmission(checklistItems, audit.status);
		if (!result.valid) {
			setValidation({ heading: text.submitSelfBlocked, result });
			return;
		}
		setValidation(null);
		setOpenDialog("SUBMIT_SELF");
	};

	const handleSubmitReview = (): void => {
		const result = validateReviewForSubmission(checklistItems);
		if (!result.valid) {
			setValidation({ heading: text.submitReviewBlocked, result });
			return;
		}
		setValidation(null);
		setOpenDialog("SUBMIT_REVIEW");
	};

	return (
		<div className="space-y-3">
			{validation ? (
				<AuditSubmissionSummary
					result={validation.result}
					heading={validation.heading}
					onJumpToItem={onJumpToItem}
				/>
			) : null}

			<div className="flex flex-wrap items-center gap-2">
				{canContinueChecklist ? (
					<Button
						type="button"
						text={
							permissions.canReview ? text.continueReview : text.openChecklist
						}
						Icon={ClipboardCheck}
						appearance="standard"
						variant="outline"
						onClick={onOpenChecklist}
					/>
				) : null}

				{permissions.canSubmitSelfAssessment ? (
					<Button
						type="button"
						text={text.submitSelf}
						Icon={Send}
						appearance="standard"
						variant="brand"
						disabled={!hasChecklist}
						onClick={handleSubmitSelfAssessment}
					/>
				) : null}

				{canStartReview ? (
					<Button
						type="button"
						text={text.startReview}
						Icon={Play}
						appearance="standard"
						variant="brand"
						onClick={() => setOpenDialog("START_REVIEW")}
					/>
				) : null}

				{permissions.canSubmitReview ? (
					<Button
						type="button"
						text={text.submitReview}
						Icon={Send}
						appearance="standard"
						variant="brand"
						disabled={!hasChecklist}
						onClick={handleSubmitReview}
					/>
				) : null}

				{permissions.canRaiseClarification ? (
					<Button
						type="button"
						text={text.requestClarification}
						Icon={MessageSquareWarning}
						appearance="standard"
						variant="warning-soft"
						disabled={!hasChecklist}
						onClick={() => setOpenDialog("CLARIFICATION")}
					/>
				) : null}

				{permissions.canApprove ? (
					<Button
						type="button"
						text={text.approve}
						Icon={BadgeCheck}
						appearance="standard"
						variant="success"
						onClick={() => setOpenDialog("APPROVE")}
					/>
				) : null}

				{permissions.canReassignReviewer ? (
					<Button
						type="button"
						text={text.reassign}
						Icon={UserCog}
						appearance="standard"
						variant="outline"
						onClick={() => setOpenDialog("REASSIGN")}
					/>
				) : null}

				{permissions.canReAudit ? (
					<Button
						type="button"
						text={text.reAudit}
						Icon={RefreshCcw}
						appearance="standard"
						variant="outline"
						onClick={() => setOpenDialog("RE_AUDIT")}
					/>
				) : null}

				{permissions.canDownloadReport ? (
					<Button
						type="button"
						text={text.viewReport}
						Icon={FileText}
						appearance="standard"
						variant="outline"
						onClick={onOpenReport}
					/>
				) : null}

				{/* Irreversible actions sit apart from the routine ones. */}
				{permissions.canReject ? (
					<span className="ml-auto">
						<Button
							type="button"
							text={text.reject}
							Icon={XCircle}
							appearance="standard"
							variant="danger-soft"
							onClick={() => setOpenDialog("REJECT")}
						/>
					</span>
				) : null}
			</div>

			<ConfirmActionDialog
				open={openDialog === "SUBMIT_SELF"}
				title={text.confirm.submitSelfTitle}
				description={text.confirm.submitSelfDescription}
				confirmText={text.submitSelf}
				onClose={close}
				onConfirm={async () => {
					await submitAudit({ auditId: audit.id, version: audit.version });
				}}
			/>
			<ConfirmActionDialog
				open={openDialog === "START_REVIEW"}
				title={text.confirm.startReviewTitle}
				description={text.confirm.startReviewDescription}
				confirmText={text.startReview}
				onClose={close}
				onConfirm={async () => {
					await startReview(audit.id);
				}}
			/>
			<ConfirmActionDialog
				open={openDialog === "SUBMIT_REVIEW"}
				title={text.confirm.submitReviewTitle}
				description={text.confirm.submitReviewDescription}
				confirmText={text.submitReview}
				onClose={close}
				onConfirm={async () => {
					await submitReview({ auditId: audit.id, version: audit.version });
				}}
			/>

			<RaiseClarificationDialog
				open={openDialog === "CLARIFICATION"}
				items={checklistItems}
				onClose={close}
				onSubmit={async (values) => {
					await raiseClarification({
						auditId: audit.id,
						version: audit.version,
						itemIds: values.itemIds,
						remarks: values.remarks,
					});
				}}
			/>
			<ApproveAuditDialog
				open={openDialog === "APPROVE"}
				onClose={close}
				onSubmit={async (values) => {
					await approveAudit({
						auditId: audit.id,
						version: audit.version,
						remarks: values.remarks,
					});
				}}
			/>
			<RejectAuditDialog
				open={openDialog === "REJECT"}
				onClose={close}
				onSubmit={async (values) => {
					await rejectAudit({
						auditId: audit.id,
						version: audit.version,
						reason: values.reason,
					});
				}}
			/>
			<ReassignReviewerDialog
				open={openDialog === "REASSIGN"}
				currentReviewerId={audit.assignedReviewer?.id ?? null}
				onClose={close}
				onSubmit={async (values) => {
					await reassignReviewer({
						auditId: audit.id,
						reviewerId: values.reviewerId,
						reason: values.reason,
					});
				}}
			/>
			<ReAuditDialog
				open={openDialog === "RE_AUDIT"}
				onClose={close}
				onSubmit={async (values) => {
					const created = await reAudit({
						auditId: audit.id,
						reason: values.reason,
						dueDate: values.dueDate,
					});
					onReAuditCreated(created.id);
				}}
			/>
		</div>
	);
}
