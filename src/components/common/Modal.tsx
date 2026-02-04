import React from "react";

interface ModalProps {
	open: boolean;
	title?: string;
	onClose: () => void;
	children: React.ReactNode;
	type: string;
}

export function Modal({ open, children, type }: ModalProps) {
	console.log(type);
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25">
			<div className="w-full rounded-2xl">{children}</div>
		</div>
	);
}
