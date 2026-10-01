// modules/audit/shared/components/AuditConfirmModal.tsx
//
// Confirmation dialog for destructive / irreversible audit actions
// (delete template, discard changes …). Built on the shared Modal + Alert
// so it inherits focus trap, Escape handling and focus restore.

import type { ReactNode } from "react";

import Button from "../../../../components/common/Button";
import { Alert } from "../../../../components/common/Alert";
import { Modal } from "../../../../components/common/Modal";

type Props = {
	open: boolean;
	title: string;
	/** Headline of the warning box. */
	warningTitle: string;
	warningDescription?: string;
	/** Extra context rendered under the warning (e.g. the item name). */
	children?: ReactNode;
	confirmLabel: string;
	cancelLabel?: string;
	tone?: "danger" | "warning";
	isConfirming?: boolean;
	/** Server error to keep visible inside the dialog after a failed attempt. */
	errorMessage?: string | null;
	onConfirm: () => void;
	onClose: () => void;
};

export default function AuditConfirmModal({
	open,
	title,
	warningTitle,
	warningDescription,
	children,
	confirmLabel,
	cancelLabel = "Cancel",
	tone = "danger",
	isConfirming = false,
	errorMessage,
	onConfirm,
	onClose,
}: Props) {
	const handleClose = () => {
		if (isConfirming) return;
		onClose();
	};

	return (
		<Modal
			open={open}
			title={title}
			size="sm"
			dialogRole="alertdialog"
			closeOnOverlayClick={!isConfirming}
			onClose={handleClose}
			footer_actions={
				<>
					<Button
						text={cancelLabel}
						variant="outline"
						disabled={isConfirming}
						onClick={handleClose}
					/>
					<Button
						text={confirmLabel}
						variant={tone === "danger" ? "danger" : "warning"}
						loading={isConfirming}
						onClick={onConfirm}
					/>
				</>
			}
		>
			<div className="space-y-3">
				<Alert
					variant={tone === "danger" ? "error" : "warning"}
					title={warningTitle}
					description={warningDescription}
				/>
				{children}
				{errorMessage ? (
					<p className="form-error-text" role="alert">
						{errorMessage}
					</p>
				) : null}
			</div>
		</Modal>
	);
}
