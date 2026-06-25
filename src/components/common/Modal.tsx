import { X } from "lucide-react";
import type { ModalProps } from "./common.types";

export function Modal({
	open,
	title,
	children,
	onClose,
	size = "md",
	className,
	header_children,
}: ModalProps) {
	if (!open) return null;

	const sizeClass = {
		sm: "max-w-md",
		md: "max-w-2xl",
		lg: "max-w-4xl",
		xl: "max-w-6xl",
		full: "max-w-[95vw]",
	};

	return (
		<div className={`modal-overlay`}>
			<div className={`modal-container ${sizeClass[size]}  ${className}`}>
				{title || onClose ? (
					<div className="flex items-center justify-between border-b border-gray-300 px-3 py-1.5">
						<h2 className="text-sm font-semibold text-gray-900">{title}</h2>
						<div className="flex items-center justify-between gap-4">
							{header_children}
							{onClose ? (
								<button
									type="button"
									onClick={onClose}
									className="rounded-full p-2 hover:bg-gray-100"
								>
									<X size={16} />
								</button>
							) : null}
						</div>
					</div>
				) : null}

				<div>{children}</div>
			</div>
		</div>
	);
}
