// modules/audit/shared/components/AuditConfirmModal.tsx
//
// Confirmation dialog for destructive / irreversible audit actions
// (delete template, discard changes …). Built on the shared Modal so it
// inherits focus trap, Escape handling and focus restore. The message is
// plain content (no nested card) so the dialog reads as one clean surface.

import { AlertTriangle, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import Button from "../../../../components/common/Button";
import { Modal } from "../../../../components/common/Modal";

type Props = {
	open: boolean;
	title: string;
	/** Headline shown under the icon. */
	warningTitle: string;
	warningDescription?: string;
	/** Extra context rendered under the message (e.g. the item name). */
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

const TONE_STYLES = {
	danger: { circle: "bg-danger-bg text-danger", Icon: Trash2 },
	warning: { circle: "bg-caution-bg text-caution", Icon: AlertTriangle },
} as const;

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

	const { circle, Icon } = TONE_STYLES[tone];

	return (
		<Modal
			open={open}
			title={title}
			size="sm"
			dialogRole="alertdialog"
			closeOnOverlayClick={!isConfirming}
			onClose={handleClose}
			footer_children={
				<div className="bottom-buttons-bar-between ">
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
				</div>
			}
		>
			<div className="flex flex-col items-center gap-3 px-2 py-2 text-center">
				<span
					className={`flex h-12 w-12 items-center justify-center rounded-full ${circle}`}
					aria-hidden="true"
				>
					<Icon size={22} />
				</span>

				<div className="space-y-1">
					<p className="text-sm font-semibold text-fg">{warningTitle}</p>
					{warningDescription ? (
						<p className="text-sm text-fg-secondary">{warningDescription}</p>
					) : null}
				</div>

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
