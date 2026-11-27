// modules/audit/dealerAudit/cycle/components/AuditPageStates.tsx
//
// Loading / error / no-access / empty states shared by the cycle pages, so
// each page stays focused on its own content.

import { Alert } from "../../../../../components/common/Alert";
import { dealerCycleContent as content } from "../dealer-cycle.content";

const text = content.common;

export function PageLoading({ label }: { label?: string }) {
	return (
		<p className="py-10 text-center text-sm text-fg-secondary" role="status">
			{label ?? "Loading…"}
		</p>
	);
}

export function PageError({
	message,
	onRetry,
	title = text.loadError,
	retryLabel = text.retry,
}: {
	message?: string | null;
	onRetry: () => void;
	title?: string;
	retryLabel?: string;
}) {
	return (
		<Alert
			variant="error"
			type="banner"
			title={title}
			description={message ?? undefined}
			primaryAction={{ label: retryLabel, onClick: onRetry }}
		/>
	);
}

export function PageNoAccess({
	title = text.noAccess,
	description = text.noAccessHelp,
	variant = "info",
}: {
	title?: string;
	description?: string;
	variant?: "info" | "warning";
}) {
	return (
		<Alert
			variant={variant}
			type="banner"
			title={title}
			description={description}
		/>
	);
}

export function PageEmpty({ title, help }: { title: string; help?: string }) {
	return (
		<div className="rounded-xl border border-dashed border-line-strong bg-surface px-4 py-10 text-center">
			<p className="text-base font-semibold text-fg">{title}</p>
			{help ? <p className="mt-1 text-sm text-fg-secondary">{help}</p> : null}
		</div>
	);
}
