import { useEffect, useRef } from "react";

import Button from "../../../components/common/Button";
import { currencyFormatter } from "../hooks/useReimbursementClaimForm";

type ClaimOverLimitDialogProps = {
	open: boolean;
	/** How far the claim is above the available limit, in rupees. */
	overBy: number;
	busy?: boolean;
	onCancel: () => void;
	onConfirm: () => void;
};

/**
 * "This claim exceeds your limit" confirmation shown before submitting an
 * over-limit claim. Swap for your shared Modal if you have one.
 */
export const ClaimOverLimitDialog = ({
	open,
	overBy,
	busy = false,
	onCancel,
	onConfirm,
}: ClaimOverLimitDialogProps) => {
	const dialogRef = useRef<HTMLDivElement>(null);

	// Move focus into the dialog (first button = "Go back and edit").
	useEffect(() => {
		if (open) dialogRef.current?.querySelector("button")?.focus();
	}, [open]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
			onKeyDown={(event) => {
				if (event.key === "Escape" && !busy) onCancel();
			}}
		>
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="claim-over-limit-title"
				aria-describedby="claim-over-limit-desc"
				className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
			>
				<h2
					id="claim-over-limit-title"
					className="mb-2 text-lg font-semibold text-iron-dark"
				>
					This claim exceeds your limit
				</h2>
				<p
					id="claim-over-limit-desc"
					className="mb-5 text-sm leading-6 text-iron"
				>
					Your bills are {currencyFormatter.format(overBy)} above the available
					limit. You can submit anyway. HR will review the claim and may approve
					only the eligible amount.
				</p>
				<div className="flex justify-end gap-2">
					<Button
						type="button"
						text="Go back and edit"
						size="sm"
						appearance="standard"
						variant="outline"
						disabled={busy}
						onClick={onCancel}
					/>
					<Button
						type="button"
						text={busy ? "Submitting..." : "Submit anyway"}
						size="sm"
						appearance="standard"
						variant="brand"
						disabled={busy}
						onClick={onConfirm}
					/>
				</div>
			</div>
		</div>
	);
};

export default ClaimOverLimitDialog;
