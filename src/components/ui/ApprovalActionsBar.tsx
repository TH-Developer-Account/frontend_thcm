import { useState } from "react";
import { CircleCheck, Info, Save, Send } from "lucide-react";
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

	// Keeps Approve visible but disabled (e.g. "approve every line item
	// first"). Optional — existing callers are unaffected.
	approveDisabled?: boolean;
	// Why Approve is disabled: shown on hover of the (i) icon next to the
	// button and as the button's tooltip.
	approveDisabledReason?: string;

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

// Small (i) with a hover/focus tooltip. A disabled button doesn't receive
// hover events in most browsers, so the reason lives on this icon.
const InfoTip = ({ text }: { text: string }) => (
	<span className="group relative inline-flex">
		<span
			tabIndex={0}
			role="img"
			aria-label={text}
			className="inline-flex cursor-help items-center text-amber-600 outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-full"
		>
			<Info aria-hidden="true" size={16} />
		</span>
		<span
			role="tooltip"
			className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 hidden w-56 rounded-md bg-iron-dark px-2.5 py-1.5 text-xs leading-snug text-white shadow-lg group-hover:block group-focus-within:block"
		>
			{text}
		</span>
	</span>
);

const ApprovalActionsBar = ({
	variant,
	onBack,
	showBack = true,
	canApprove = false,
	canClarify = false,
	onApprove,
	onClarify,
	approveDisabled = false,
	approveDisabledReason,
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
		if (action === "approve" && approveDisabled) return;

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
								<span className="inline-flex items-center gap-1.5">
									<Button
										type="button"
										text={approveLabel}
										size="sm"
										appearance="standard"
										variant="brand"
										isTooltip={
											approveDisabled ? approveDisabledReason : undefined
										}
										disabled={isBusy || !isReasonValid || approveDisabled}
										onClick={() => void submitReason("approve")}
									/>
									{/* {approveDisabled && approveDisabledReason ? (
										<InfoTip text={approveDisabledReason} />
									) : null} */}
								</span>
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
