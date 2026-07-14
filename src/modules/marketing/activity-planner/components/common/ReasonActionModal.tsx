// components/common/ReasonActionModal.tsx

import React from "react";

import Button from "../../../../../components/common/Button";
import { Modal } from "../../../../../components/common/Modal";
import TextareaInput from "../../../../../components/forms/TextareaInput";

export type ReasonActionMode = "clarify-workflow" | "clarify-report";

type ReasonActionModalProps = {
	open: boolean;
	mode: ReasonActionMode | null;
	loading?: boolean;
	onClose: () => void;
	onConfirm: (reason: string) => void | Promise<void>;
};

type ReasonActionCopy = {
	title: string;
	description: string;
	placeholder: string;
	confirmText: string;
	loadingText: string;
};

const MODAL_COPY: Record<ReasonActionMode, ReasonActionCopy> = {
	"clarify-workflow": {
		title: "Send for Clarification",
		description:
			"This will send the EPC back to the proposer. The proposer can update the EPC, CRF, or EPF and resubmit the workflow.",
		placeholder: "Example: Please update the budget breakup before approval.",
		confirmText: "Send Clarification",
		loadingText: "Sending...",
	},
	"clarify-report": {
		title: "Clarify Report",
		description:
			"This will send only the event report back to the proposer for correction. It will not restart the EPC approval workflow.",
		placeholder:
			"Example: Please correct the event photos and leads generated.",
		confirmText: "Clarify Report",
		loadingText: "Sending...",
	},
};

export const ReasonActionModal = ({
	open,
	mode,
	loading = false,
	onClose,
	onConfirm,
}: ReasonActionModalProps) => {
	const [reason, setReason] = React.useState("");

	React.useEffect(() => {
		if (!open) {
			setReason("");
		}
	}, [open]);

	const trimmedReason = reason.trim();

	const handleClose = React.useCallback(() => {
		if (loading) return;

		setReason("");
		onClose();
	}, [loading, onClose]);

	const handleConfirm = React.useCallback(async () => {
		if (!trimmedReason || loading) return;

		await onConfirm(trimmedReason);
	}, [loading, onConfirm, trimmedReason]);

	if (!mode) return null;

	const copy = MODAL_COPY[mode];

	return (
		<Modal open={open} title={copy.title} size="md" onClose={handleClose}>
			<div className="modal-form">
				<p className="modal-description">{copy.description}</p>

				<TextareaInput
					name="reason"
					label="Reason"
					value={reason}
					placeholder={copy.placeholder}
					rows={4}
					autoFocus
					disabled={loading}
					onChange={(event) => setReason(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
							event.preventDefault();
							void handleConfirm();
						}
					}}
				/>

				<footer className="modal-footer">
					<span className="modal-footer-hint">Ctrl + Enter to submit</span>

					<div className="modal-footer-actions">
						<Button
							type="button"
							text="Cancel"
							appearance="standard"
							variant="outline"
							size="sm"
							disabled={loading}
							onClick={handleClose}
						/>

						<Button
							type="button"
							text={loading ? copy.loadingText : copy.confirmText}
							appearance="standard"
							variant="brand"
							size="sm"
							disabled={!trimmedReason || loading}
							onClick={() => void handleConfirm()}
						/>
					</div>
				</footer>
			</div>
		</Modal>
	);
};
