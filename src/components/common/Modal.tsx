import type { ModalProps } from "./common.types";

export function Modal({ open, children }: ModalProps) {
	if (!open) return null;

	return (
		<div className="modal-overlay">
			<div className="modal-container">{children}</div>
		</div>
	);
}
