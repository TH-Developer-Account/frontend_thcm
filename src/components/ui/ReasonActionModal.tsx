import React from "react";

import Button from "../common/Button";
import { Modal } from "../common/Modal";
import TextareaInput from "../forms/TextareaInput";
import {
	REASON_ACTION_MODAL_COPY,
	REASON_ACTION_MODAL_LABEL,
	REASON_ACTION_MODAL_SHORTCUT_HINT,
	type ReasonActionMode,
} from "../../utils/constant";

export type { ReasonActionMode } from "../../utils/constant";

type ReasonActionModalProps = {
	open: boolean;
	mode: ReasonActionMode | null;
	loading?: boolean;
	/**
	 * Optional text to pre-fill the reason textarea with whenever the modal
	 * opens (e.g. a caller-generated summary the person can review and edit
	 * before confirming). Only applied at the moment `open` flips to true —
	 * changes to this value while the modal is already open won't fight
	 * what the person is typing.
	 */
	defaultReason?: string;
	onClose: () => void;
	onConfirm: (reason: string) => void | Promise<void>;
};

export const ReasonActionModal = ({
	open,
	mode,
	loading = false,
	defaultReason = "",
	onClose,
	onConfirm,
}: ReasonActionModalProps) => {
	const [reason, setReason] = React.useState("");

	// Seed the textarea from defaultReason only on the open transition, and
	// clear it on close. defaultReason is intentionally excluded from the
	// dependency array — if it were included, every re-render of the parent
	// that recomputes a new defaultReason (e.g. as the person edits other
	// fields) would stomp over what they've typed into this textarea.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	React.useEffect(() => {
		setReason(open ? defaultReason : "");
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

	const copy = REASON_ACTION_MODAL_COPY[mode];

	return (
		<Modal open={open} title={copy.title} size="md" onClose={handleClose}>
			<div className="modal-form">
				<p className="modal-description">{copy.description}</p>

				<TextareaInput
					name="reason"
					label={REASON_ACTION_MODAL_LABEL}
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
					<span className="modal-footer-hint">
						{REASON_ACTION_MODAL_SHORTCUT_HINT}
					</span>

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
