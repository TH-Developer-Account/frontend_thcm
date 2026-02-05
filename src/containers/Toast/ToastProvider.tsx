import { useState, useCallback, useRef } from "react";
import { ToastContext } from "./ToastContext";
import { Toast, type ToastProps } from "../../components/common/Toast";
import type { ToastInput } from "./toast.types";

const AUTO_CLOSE_MS = 4000;

export default function ToastProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [toasts, setToasts] = useState<ToastProps[]>([]);
	const timers = useRef<Record<string, number>>({});

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
		clearTimeout(timers.current[id]);
		delete timers.current[id];
	}, []);

	const showToast = useCallback(
		(toast: ToastInput) => {
			const id = crypto.randomUUID();

			setToasts((prev) => [
				...prev,
				{
					id,
					type: toast.type ?? "info",
					title: toast.title,
					description: toast.description,
					actionText: toast.actionText,
					onAction: toast.onAction,
				},
			]);

			timers.current[id] = window.setTimeout(() => {
				removeToast(id);
			}, AUTO_CLOSE_MS);
		},
		[removeToast],
	);

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}

			{/* Global Toast Mount Point */}
			<div className="fixed top-4 right-4 z-50 space-y-3">
				{toasts.map((toast) => (
					<Toast
						key={toast.id}
						{...toast}
						onClose={() => removeToast(toast.id)}
					/>
				))}
			</div>
		</ToastContext.Provider>
	);
}
