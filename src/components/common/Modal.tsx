import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import type { ModalProps } from "./common.types";

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const modalSizeClasses = {
	sm: "modal-container-sm",
	md: "modal-container-md",
	lg: "modal-container-lg",
	xl: "modal-container-xl",
	full: "modal-container-full",
} as const;

export function Modal({
	open,
	title,
	children,
	onClose,
	size = "md",
	className = "",
	header_children,
	footer_children,
	footer_actions,
}: ModalProps) {
	const generatedTitleId = React.useId();
	const modalRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (!open) return;

		const previousActiveElement =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;

		const previousOverflow = document.body.style.overflow;

		document.body.style.overflow = "hidden";

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && onClose) {
				event.preventDefault();
				onClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		const animationFrameId = requestAnimationFrame(() => {
			modalRef.current?.focus();
		});

		return () => {
			cancelAnimationFrame(animationFrameId);

			document.body.style.overflow = previousOverflow;

			document.removeEventListener("keydown", handleKeyDown);

			previousActiveElement?.focus();
		};
	}, [open, onClose]);

	if (!open) return null;

	const hasHeader = Boolean(title || header_children || onClose);

	const modalContent = (
		<div
			className="modal-overlay"
			role="presentation"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget && onClose) {
					onClose();
				}
			}}
		>
			<div
				ref={modalRef}
				className={joinClassNames(
					"modal-container",
					modalSizeClasses[size],
					className,
				)}
				role="dialog"
				aria-modal="true"
				aria-labelledby={title ? generatedTitleId : undefined}
				tabIndex={-1}
				onMouseDown={(event) => event.stopPropagation()}
			>
				{hasHeader ? (
					<header className="modal-header">
						<div className="modal-header-copy">
							{header_children ?? (
								<>
									{title ? (
										<h2 id={generatedTitleId} className="modal-title">
											{title}
										</h2>
									) : null}
								</>
							)}
						</div>

						{onClose ? (
							<div className="modal-header-actions">
								<button
									type="button"
									className="modal-close-button"
									onClick={onClose}
									aria-label="Close dialog"
								>
									<X className="modal-close-icon" aria-hidden="true" />
								</button>
							</div>
						) : null}
					</header>
				) : null}

				<div className="modal-body">{children}</div>
				{footer_children || footer_actions ? (
					<footer className="modal-footer">
						<div className="modal-footer-copy">{footer_children}</div>
						<div className="modal-footer-actions">{footer_actions}</div>
					</footer>
				) : null}
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}
