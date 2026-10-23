import { useState } from "react";
import { ArrowLeft, FilePenLine, Lock, RefreshCcw, Save } from "lucide-react";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
// Shared approve / clarify footer. Adjust this path if the component lives
// elsewhere in your repo.
import ApprovalActionsBar from "../../../components/ui/ApprovalActionsBar";
import { useReimbursementClaimFormContext } from "../hooks/useReimbursementClaimForm";
import { MEDICLAIM_BACKEND } from "../utils/mediclaimBackend.config";
import { MAX_REASON_LENGTH } from "../utils/reimbursementClaim.schemas";
import ClaimOverLimitDialog from "./ClaimOverLimitDialog";

/**
 * - "claimant": Back / Reset / Save as Draft / Submit (public, guest).
 * - "reviewer": Approve / Send for Clarification / Close Claim (internal).
 * - "none": render nothing.
 */
export type ClaimActionsVariant = "claimant" | "reviewer" | "none";

/** True when ClaimActions would render something, so a Card can skip an empty footer. */
export const useHasClaimActions = (variant: ClaimActionsVariant): boolean => {
	const {
		canEditClaimForm,
		canApprove,
		canClarify,
		canClose,
		hasCloseAction,
		hasApproveStageAction,
		hasClarifyStageAction,
	} = useReimbursementClaimFormContext();

	if (variant === "claimant") return canEditClaimForm;
	if (variant === "reviewer") {
		return (
			(canApprove && hasApproveStageAction) ||
			(canClarify && hasClarifyStageAction) ||
			(canClose && hasCloseAction)
		);
	}
	return false;
};

type ClaimActionsProps = {
	variant: Exclude<ClaimActionsVariant, "none">;
	/** Reviewer only: side-column card layout (no Back button). */
	card?: boolean;
	/** Claimant only: full-width buttons stacked for a sidebar. */
	stacked?: boolean;
};

type PendingFooterAction = "close" | null;

export const ClaimActions = ({
	variant,
	card = false,
	stacked = false,
}: ClaimActionsProps) => {
	const {
		isLoading,
		isSubmitting,
		isSavingDraft,
		canEditClaimForm,
		savedClaims,
		canApprove,
		canClarify,
		canClose,
		isClosing,
		isExternalApprover,
		approvalActionLoading,
		onBack,
		actionText,
		hasSubmitAction,
		hasSaveDraftAction,
		hasApproveStageAction,
		hasClarifyStageAction,
		hasCloseAction,
		canCompleteStage,
		eligibility,
		hospitalisation,
		clarifyLoading,
		handleSubmit,
		handleSaveDraft,
		handleReset,
		buildClarifyReasonPrefix,
		handleClarifyConfirm,
		handleApproveStage,
		handleCloseClaim,
	} = useReimbursementClaimFormContext();

	const [pendingAction, setPendingAction] = useState<PendingFooterAction>(null);
	const [isConfirming, setIsConfirming] = useState(false);
	const [overLimitOpen, setOverLimitOpen] = useState(false);

	const isReasonBusy =
		clarifyLoading || approvalActionLoading || isConfirming || isClosing;

	/* --------------------------- claimant: submit --------------------------- */

	// How far the bills are above the available limit (both limits combined).
	const overBy =
		Math.round(
			((eligibility.isOverLimit ? Math.max(-eligibility.balanceAfter, 0) : 0) +
				(hospitalisation?.isOverLimit
					? Math.max(-hospitalisation.balanceAfter, 0)
					: 0)) *
				100,
		) / 100;

	const requestSubmit = () => {
		if (overBy > 0) {
			setOverLimitOpen(true);
			return;
		}
		void handleSubmit();
	};

	const confirmOverLimitSubmit = async () => {
		setOverLimitOpen(false);
		await handleSubmit();
	};

	const stackedButtons = (
		<div className="flex w-full flex-col gap-2 [&>*]:w-full [&_button]:w-full">
			{canEditClaimForm && hasSubmitAction ? (
				<Button
					type="button"
					text={
						isSubmitting
							? "Submitting..."
							: overBy > 0
								? "Review and submit"
								: actionText
					}
					Icon={Save}
					size="sm"
					appearance="standard"
					variant="brand"
					disabled={isLoading}
					onClick={requestSubmit}
				/>
			) : null}
			{canEditClaimForm && hasSaveDraftAction ? (
				<Button
					type="button"
					text={isSavingDraft ? "Saving..." : "Save as Draft"}
					Icon={FilePenLine}
					size="sm"
					appearance="standard"
					variant="outline"
					disabled={isLoading}
					onClick={() => void handleSaveDraft()}
				/>
			) : null}
			<div className="flex gap-2 [&>*]:flex-1">
				{onBack ? (
					<Button
						type="button"
						text="Back"
						Icon={ArrowLeft}
						size="sm"
						appearance="standard"
						variant="outline"
						disabled={isLoading}
						onClick={onBack}
					/>
				) : null}
				{canEditClaimForm ? (
					<Button
						type="button"
						text="Reset"
						Icon={RefreshCcw}
						size="sm"
						appearance="standard"
						variant="outline"
						disabled={isLoading}
						onClick={handleReset}
					/>
				) : null}
			</div>
		</div>
	);

	const editButtons = (
		<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div>
				{onBack ? (
					<Button
						type="button"
						text="Back"
						Icon={ArrowLeft}
						size="sm"
						appearance="standard"
						variant="outline"
						disabled={isLoading}
						onClick={onBack}
					/>
				) : null}
			</div>

			{canEditClaimForm ? (
				<div className="flex flex-col gap-2 sm:flex-row">
					<Button
						type="button"
						text="Reset"
						Icon={RefreshCcw}
						size="sm"
						appearance="standard"
						variant="outline"
						disabled={isLoading}
						onClick={handleReset}
					/>
					{hasSaveDraftAction ? (
						<Button
							type="button"
							text={isSavingDraft ? "Saving..." : "Save as Draft"}
							Icon={FilePenLine}
							size="sm"
							appearance="standard"
							variant="outline"
							disabled={isLoading}
							onClick={() => void handleSaveDraft()}
						/>
					) : null}
					{hasSubmitAction ? (
						<Button
							type="button"
							text={isSubmitting ? "Submitting..." : actionText}
							Icon={Save}
							size="sm"
							appearance="standard"
							variant="brand"
							disabled={isLoading}
							onClick={requestSubmit}
						/>
					) : null}
				</div>
			) : null}
		</div>
	);

	if (variant === "claimant") {
		return (
			<>
				<div className="flex w-full flex-col gap-3">
					{stacked ? stackedButtons : editButtons}
				</div>
				<ClaimOverLimitDialog
					open={overLimitOpen}
					overBy={overBy}
					busy={isSubmitting}
					onCancel={() => setOverLimitOpen(false)}
					onConfirm={() => void confirmOverLimitSubmit()}
				/>
			</>
		);
	}

	/* ------------------------------- reviewer ------------------------------- */

	const canShowClose = canClose && hasCloseAction;
	const isApproverFooter =
		(canApprove && hasApproveStageAction) ||
		(canClarify && hasClarifyStageAction);

	const handleFooterConfirm = async () => {
		if (pendingAction !== "close") return;
		setIsConfirming(true);
		try {
			await handleCloseClaim?.();
			setPendingAction(null);
		} catch {
			// The page-level handler already showed an error toast.
		} finally {
			setIsConfirming(false);
		}
	};

	// ApprovalActionsBar validates the reason length and clears it on success.
	// The page handlers toast their own errors, so failures are swallowed here.
	const approveFromBar = async (reason: string) => {
		try {
			await handleApproveStage(reason);
		} catch {
			/* toasted by the page */
		}
	};

	// The claimant should see exactly which bills to fix, so the flagged bills
	// (with the approver's remarks) are appended to the typed reason.
	const clarifyFromBar = async (reason: string) => {
		const flagged = buildClarifyReasonPrefix();
		try {
			await handleClarifyConfirm(flagged ? `${reason}\n\n${flagged}` : reason);
		} catch {
			/* toasted by the page */
		}
	};

	const approveLabel = isExternalApprover
		? MEDICLAIM_BACKEND.externalApproverClose
			? "OK and Close"
			: "OK"
		: "Approve";
	// Approve stays visible but disabled until every line item is approved.
	const approveBlocked =
		canApprove && hasApproveStageAction && !canCompleteStage;
	const approveBlockedMessage = `Approve every line item to enable ${approveLabel}.`;
	const approvedLineItemCount = savedClaims.filter(
		(item) => item.approvalStatus === "APPROVED",
	).length;

	if (pendingAction === "close") {
		return (
			<div
				className={`flex w-full flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 ${
					card ? "" : "sm:flex-row sm:items-center"
				}`}
			>
				<p className="flex-1 text-sm text-iron">
					Close this approved claim? Closed claims are final and can no longer
					be changed.
				</p>
				<div className="flex shrink-0 gap-2">
					<Button
						type="button"
						text="Cancel"
						size="sm"
						appearance="standard"
						variant="outline"
						disabled={isReasonBusy}
						onClick={() => {
							if (!isReasonBusy) setPendingAction(null);
						}}
					/>
					<Button
						type="button"
						text={isReasonBusy ? "Closing…" : "Close Claim"}
						Icon={Lock}
						size="sm"
						appearance="standard"
						variant="brand"
						disabled={isReasonBusy}
						onClick={() => void handleFooterConfirm()}
					/>
				</div>
			</div>
		);
	}

	if (isApproverFooter) {
		return (
			<div className="flex w-full flex-col gap-3">
				{approveBlocked ? (
					<Alert
						type="banner"
						variant="warning"
						title={approveBlockedMessage}
						description={`${approvedLineItemCount} of ${savedClaims.length} line items approved. Approve or adjust the rest to finish this stage.`}
					/>
				) : null}
				<ApprovalActionsBar
					variant="approver"
					{...(card ? { layout: "card" as const } : {})}
					showBack={card ? false : Boolean(onBack)}
					onBack={onBack}
					canApprove={canApprove && hasApproveStageAction}
					approveDisabled={approveBlocked}
					approveDisabledReason={approveBlockedMessage}
					canClarify={canClarify && hasClarifyStageAction}
					onApprove={approveFromBar}
					onClarify={clarifyFromBar}
					approveLabel={approveLabel}
					clarifyLabel="Send for Clarification"
					loading={isReasonBusy}
					maxReasonLength={MAX_REASON_LENGTH}
					reasonPlaceholder={
						canClarify
							? "Reason for approval, or what the claimant should correct"
							: "Add a reason (at least 3 characters)"
					}
				/>
			</div>
		);
	}

	if (canShowClose) {
		const closeBar = (
			<ApprovalActionsBar
				variant="proposer"
				showBack={card ? false : Boolean(onBack)}
				onBack={onBack}
				canAcceptAndClose
				onAcceptAndClose={() => setPendingAction("close")}
				acceptAndCloseLabel="Close Claim"
				loading={isReasonBusy}
			/>
		);

		return card ? (
			<section className="approval-decision-card" aria-label="Your actions">
				<div className="approval-decision-card-head">
					<span className="approval-decision-card-eyebrow">Your actions</span>
				</div>
				{closeBar}
			</section>
		) : (
			<div className="flex w-full flex-col gap-3">{closeBar}</div>
		);
	}

	return null;
};

/** Sidebar card with the stacked claimant buttons; renders nothing when there are none. */
export const ClaimActionsCard = () => {
	const hasActions = useHasClaimActions("claimant");
	if (!hasActions) return null;
	return (
		<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<ClaimActions variant="claimant" stacked />
		</div>
	);
};

export default ClaimActions;
