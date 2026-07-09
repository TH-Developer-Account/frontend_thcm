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

const FOCUSABLE_SELECTOR = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex='-1'])",
].join(",");

export function Modal({
	open,
	title,
	children,
	onClose,
	size = "md",
	mode = "standard",
	className = "",
	header_children,
	footer_children,
	footer_actions,
	dialogRole = "dialog",
	ariaLabel,
	ariaDescribedBy,
	closeOnOverlayClick = true,
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

		const focusModal = () => {
			const modalElement = modalRef.current;
			if (!modalElement) return;

			const focusableElements =
				modalElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

			const firstFocusableElement = focusableElements[0];

			if (firstFocusableElement) {
				firstFocusableElement.focus();
				return;
			}

			modalElement.focus();
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && onClose) {
				event.preventDefault();
				onClose();
				return;
			}

			if (event.key !== "Tab") return;

			const modalElement = modalRef.current;
			if (!modalElement) return;

			const focusableElements = Array.from(
				modalElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
			).filter((element) => {
				const isVisible =
					element.offsetWidth > 0 ||
					element.offsetHeight > 0 ||
					element.getClientRects().length > 0;

				return isVisible && !element.hasAttribute("disabled");
			});

			if (focusableElements.length === 0) {
				event.preventDefault();
				modalElement.focus();
				return;
			}

			const firstFocusableElement = focusableElements[0];
			const lastFocusableElement =
				focusableElements[focusableElements.length - 1];

			if (event.shiftKey) {
				if (document.activeElement === firstFocusableElement) {
					event.preventDefault();
					lastFocusableElement.focus();
				}

				return;
			}

			if (document.activeElement === lastFocusableElement) {
				event.preventDefault();
				firstFocusableElement.focus();
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		const animationFrameId = requestAnimationFrame(focusModal);

		return () => {
			cancelAnimationFrame(animationFrameId);
			document.body.style.overflow = previousOverflow;
			document.removeEventListener("keydown", handleKeyDown);
			previousActiveElement?.focus();
		};
	}, [open, onClose]);

	if (!open) return null;

	const isShellMode = mode === "shell";
	const hasHeader =
		!isShellMode && Boolean(title || header_children || onClose);
	const hasFooter = !isShellMode && Boolean(footer_children || footer_actions);
	const labelledBy = title && !isShellMode ? generatedTitleId : undefined;

	const modalContent = (
		<div
			className="modal-overlay"
			role="presentation"
			onMouseDown={(event) => {
				if (
					closeOnOverlayClick &&
					event.target === event.currentTarget &&
					onClose
				) {
					onClose();
				}
			}}
		>
			<div
				ref={modalRef}
				className={joinClassNames(
					"modal-container",
					isShellMode && "modal-container-shell",
					modalSizeClasses[size],
					className,
				)}
				role={dialogRole}
				aria-modal="true"
				aria-labelledby={labelledBy}
				aria-label={!labelledBy ? ariaLabel : undefined}
				aria-describedby={ariaDescribedBy}
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

				{isShellMode ? (
					children
				) : (
					<>
						<div className="modal-body">{children}</div>

						{hasFooter ? (
							<footer className="modal-footer">
								{footer_children ? (
									<div className="modal-footer-copy">{footer_children}</div>
								) : null}

								{footer_actions ? (
									<div className="modal-footer-actions">{footer_actions}</div>
								) : null}
							</footer>
						) : null}
					</>
				)}
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}
