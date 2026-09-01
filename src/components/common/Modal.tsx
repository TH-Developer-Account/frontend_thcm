import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import type { ModalProps } from "./common.types";
import Button from "./Button";

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

const isVisibleElement = (element: HTMLElement): boolean => {
	return (
		element.offsetWidth > 0 ||
		element.offsetHeight > 0 ||
		element.getClientRects().length > 0
	);
};

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
	const onCloseRef = React.useRef(onClose);

	/*
	 * Keep the latest callback available without making the modal lifecycle
	 * effect rerun whenever the parent creates a new function reference.
	 */
	React.useEffect(() => {
		onCloseRef.current = onClose;
	}, [onClose]);

	React.useEffect(() => {
		if (!open) return;

		const previousActiveElement =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		const getFocusableElements = (): HTMLElement[] => {
			const modalElement = modalRef.current;

			if (!modalElement) {
				return [];
			}

			return Array.from(
				modalElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
			).filter(
				(element) =>
					isVisibleElement(element) &&
					!element.hasAttribute("disabled") &&
					element.getAttribute("aria-hidden") !== "true",
			);
		};

		const focusModal = () => {
			const modalElement = modalRef.current;

			if (!modalElement) return;

			/*
			 * React's autoFocus normally focuses the field during mounting.
			 * This selector also supports explicitly marked initial fields and
			 * prevents the close button from overriding them.
			 */
			const preferredFocusElement =
				modalElement.querySelector<HTMLElement>(
					"[data-modal-initial-focus='true']",
				) ??
				modalElement.querySelector<HTMLElement>(
					"textarea[autofocus], input[autofocus], select[autofocus]",
				);

			if (
				preferredFocusElement &&
				isVisibleElement(preferredFocusElement) &&
				!preferredFocusElement.hasAttribute("disabled")
			) {
				preferredFocusElement.focus();
				return;
			}

			const activeElement = document.activeElement;

			/*
			 * Do not replace focus if a child element, such as a React
			 * autoFocus textarea, already received it while mounting.
			 */
			if (
				activeElement instanceof HTMLElement &&
				modalElement.contains(activeElement)
			) {
				return;
			}

			const firstFocusableElement = getFocusableElements()[0];

			if (firstFocusableElement) {
				firstFocusableElement.focus();
				return;
			}

			modalElement.focus();
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				const closeModal = onCloseRef.current;

				if (closeModal) {
					event.preventDefault();
					closeModal();
				}

				return;
			}

			if (event.key !== "Tab") return;

			const modalElement = modalRef.current;

			if (!modalElement) return;

			const focusableElements = getFocusableElements();

			if (focusableElements.length === 0) {
				event.preventDefault();
				modalElement.focus();
				return;
			}

			const firstFocusableElement = focusableElements[0];
			const lastFocusableElement =
				focusableElements[focusableElements.length - 1];

			if (event.shiftKey) {
				if (
					document.activeElement === firstFocusableElement ||
					!modalElement.contains(document.activeElement)
				) {
					event.preventDefault();
					lastFocusableElement.focus();
				}

				return;
			}

			if (
				document.activeElement === lastFocusableElement ||
				!modalElement.contains(document.activeElement)
			) {
				event.preventDefault();
				firstFocusableElement.focus();
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		const animationFrameId = window.requestAnimationFrame(focusModal);

		return () => {
			window.cancelAnimationFrame(animationFrameId);
			document.body.style.overflow = previousOverflow;
			document.removeEventListener("keydown", handleKeyDown);

			if (
				previousActiveElement &&
				document.body.contains(previousActiveElement)
			) {
				previousActiveElement.focus();
			}
		};
	}, [open]);

	if (!open) return null;

	const isShellMode = mode === "shell";
	const hasHeader =
		!isShellMode && Boolean(title || header_children || onClose);
	const hasFooter = !isShellMode && Boolean(footer_children || footer_actions);
	const labelledBy = title && !isShellMode ? generatedTitleId : undefined;

	const handleOverlayMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
		if (
			closeOnOverlayClick &&
			event.target === event.currentTarget &&
			onCloseRef.current
		) {
			onCloseRef.current();
		}
	};

	const modalContent = (
		<div
			className="modal-overlay"
			role="presentation"
			onMouseDown={handleOverlayMouseDown}
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
							<Button
								type="button"
								onClick={() => onCloseRef.current?.()}
								aria-label="Close dialog"
								appearance="icon"
								variant="brand"
								iconPosition="right"
								Icon={X}
								iconSize={20}
								size="sm"
							></Button>
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
