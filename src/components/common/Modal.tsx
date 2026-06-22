import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import type { ModalProps } from "./common.types";

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
) => classNames.filter(Boolean).join(" ");

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
}: ModalProps) {
	const titleId = React.useId();
	const modalRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (!open) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && onClose) {
				onClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		requestAnimationFrame(() => {
			modalRef.current?.focus();
		});

		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener("keydown", handleKeyDown);
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
				aria-labelledby={title ? titleId : undefined}
				tabIndex={-1}
				onMouseDown={(event) => event.stopPropagation()}
			>
				{hasHeader ? (
					<header className="modal-header">
						<div className="modal-header-copy">
							{title ? (
								<h2 id={titleId} className="modal-title">
									{title}
								</h2>
							) : null}
						</div>

						<div className="modal-header-actions">
							{header_children}

							{onClose ? (
								<button
									type="button"
									className="modal-close-button"
									onClick={onClose}
									aria-label="Close dialog"
								>
									<X className="modal-close-icon" aria-hidden="true" />
								</button>
							) : null}
						</div>
					</header>
				) : null}

				<div className="modal-body">{children}</div>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}
