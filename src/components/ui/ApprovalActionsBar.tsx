import { useState } from "react";
import { CircleCheck, Save, Send } from "lucide-react";
import TextareaInput from "../forms/TextareaInput";
import Button from "../common/Button";

// "approver" → Back | reason (fills the row) | Clarify + Approve
// "proposer" → Back | Accept & Close / Send Back / Submit (no reason box)
export type ApprovalActionsBarVariant = "approver" | "proposer";

export type ApprovalActionsBarProps = {
	// When omitted, the bar picks "approver" if Approve or Clarify is
	// available and "proposer" otherwise — so existing callers that don't
	// pass a variant keep working.
	variant?: ApprovalActionsBarVariant;

	onBack?: () => void;
	showBack?: boolean;

	// Approver-only actions. Both require a written reason.
	canApprove?: boolean;
	canClarify?: boolean;
	onApprove?: (reason: string) => void | Promise<void>;
	onClarify?: (reason: string) => void | Promise<void>;

	// Proposer/creator-only actions. No reason.
	canSendBack?: boolean;
	onSendBack?: () => void | Promise<void>;

	canAcceptAndClose?: boolean;
	onAcceptAndClose?: () => void | Promise<void>;

	canSubmit?: boolean;
	onSubmit?: () => void | Promise<void>;

	loading?: boolean;
	// Approve/Clarify stay disabled until the trimmed reason reaches this
	// length. Defaults to 3 to match the workflow API's validation, so the
	// rule is visible up front instead of surfacing as an error toast.
	// Always treated as at least 1 — a reason is mandatory either way.
	minReasonLength?: number;
	maxReasonLength?: number;

	approveLabel?: string;
	clarifyLabel?: string;
	sendBackLabel?: string;
	acceptAndCloseLabel?: string;
	submitLabel?: string;
	backLabel?: string;

	reasonLabel?: string;
	reasonPlaceholder?: string;
};

const DEFAULT_MIN_REASON_LENGTH = 3;
const DEFAULT_MAX_REASON_LENGTH = 1000;

const pluralizeCharacters = (count: number) =>
	`${count} character${count === 1 ? "" : "s"}`;

// Always returns a hint (never undefined) so the helper-text line keeps
// the same height while typing and the row doesn't jump.
const getReasonHint = (
	length: number,
	minLength: number,
	maxLength: number,
): string => {
	if (length === 0) {
		return `Enter at least ${pluralizeCharacters(minLength)}.`;
	}

	if (length < minLength) {
		return `${pluralizeCharacters(minLength - length)} more needed.`;
	}

	return `${length}/${maxLength}`;
};

const ApprovalActionsBar = ({
	variant,
	onBack,
	showBack = true,
	canApprove = false,
	canClarify = false,
	onApprove,
	onClarify,
	canSendBack = false,
	onSendBack,
	canAcceptAndClose = false,
	onAcceptAndClose,
	canSubmit = false,
	onSubmit,
	loading = false,
	minReasonLength = DEFAULT_MIN_REASON_LENGTH,
	maxReasonLength = DEFAULT_MAX_REASON_LENGTH,
	approveLabel = "Approve",
	clarifyLabel = "Send for Clarification",
	sendBackLabel = "Send Back to Vendor",
	acceptAndCloseLabel = "Accept & Close",
	submitLabel = "Final Submit",
	backLabel = "Back",
	reasonLabel = "",
	reasonPlaceholder = "Add a reason more than 2 characters",
}: ApprovalActionsBarProps) => {
	const [reason, setReason] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const showApprove = canApprove && typeof onApprove === "function";
	const showClarify = canClarify && typeof onClarify === "function";
	const showSendBack = canSendBack && typeof onSendBack === "function";
	const showAcceptAndClose =
		canAcceptAndClose && typeof onAcceptAndClose === "function";
	const showSubmit = canSubmit && typeof onSubmit === "function";

	const resolvedVariant: ApprovalActionsBarVariant =
		variant ?? (showApprove || showClarify ? "approver" : "proposer");

	const isApproverView = resolvedVariant === "approver";

	const hasAnyAction = isApproverView
		? showApprove || showClarify
		: showSendBack || showAcceptAndClose || showSubmit;

	if (!hasAnyAction && !showBack) return null;

	const trimmedReason = reason.trim();
	const isBusy = loading || submitting;

	const requiredReasonLength = Math.min(
		Math.max(1, minReasonLength),
		maxReasonLength,
	);
	const reasonLength = trimmedReason.length;
	const isReasonValid = reasonLength >= requiredReasonLength;
	const reasonHint = getReasonHint(
		reasonLength,
		requiredReasonLength,
		maxReasonLength,
	);

	const submitReason = async (action: "approve" | "clarify") => {
		if (!isReasonValid || isBusy) return;

		setSubmitting(true);
		try {
			if (action === "approve") {
				await onApprove?.(trimmedReason);
			} else {
				await onClarify?.(trimmedReason);
			}
			setReason("");
		} finally {
			setSubmitting(false);
		}
	};

	const backButton = showBack ? (
		<Button
			type="button"
			text={backLabel}
			size="sm"
			appearance="standard"
			variant="outline"
			onClick={onBack}
			disabled={isBusy}
		/>
	) : (
		<span />
	);

	if (isApproverView) {
		return (
			<div className="approval-actions-bar approval-actions-bar--approver">
				{backButton}

				{hasAnyAction ? (
					<>
						<div className="approval-reason-inline">
							<TextareaInput
								name="approval-action-reason"
								label={reasonLabel}
								value={reason}
								placeholder={reasonPlaceholder}
								rows={1}
								disabled={isBusy}
								minLength={requiredReasonLength}
								maxLength={maxReasonLength}
								required
								helperText={reasonHint}
								success={isReasonValid}
								onChange={(event) => setReason(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter" && !event.shiftKey) {
										event.preventDefault();
									}
								}}
							/>
						</div>

						<div className="approval-actions-bar-end">
							{showClarify ? (
								<Button
									type="button"
									text={clarifyLabel}
									size="sm"
									appearance="standard"
									variant="outline"
									disabled={isBusy || !isReasonValid}
									onClick={() => void submitReason("clarify")}
								/>
							) : null}

							{showApprove ? (
								<Button
									type="button"
									text={approveLabel}
									size="sm"
									appearance="standard"
									variant="brand"
									disabled={isBusy || !isReasonValid}
									onClick={() => void submitReason("approve")}
								/>
							) : null}
						</div>
					</>
				) : null}
			</div>
		);
	}

	return (
		<div className="approval-actions-bar approval-actions-bar--proposer">
			{backButton}

			<div className="approval-actions-bar-end">
				{showAcceptAndClose ? (
					<Button
						type="button"
						text={acceptAndCloseLabel}
						size="sm"
						Icon={CircleCheck}
						appearance="standard"
						variant="brand"
						disabled={isBusy}
						onClick={() => void onAcceptAndClose?.()}
					/>
				) : null}

				{showSendBack ? (
					<Button
						type="button"
						text={sendBackLabel}
						size="sm"
						appearance="standard"
						variant="outline"
						Icon={Send}
						disabled={isBusy}
						onClick={() => void onSendBack?.()}
					/>
				) : null}

				{showSubmit ? (
					<Button
						type="button"
						text={submitLabel}
						size="sm"
						appearance="standard"
						variant="brand"
						Icon={Save}
						disabled={isBusy}
						onClick={() => void onSubmit?.()}
					/>
				) : null}
			</div>
		</div>
	);
};

export default ApprovalActionsBar;
