// modules/audit/dealerAudit/cycle/components/AuditPageStates.tsx
//
// Loading / error / no-access / empty states shared by the cycle pages, so
// each page stays focused on its own content.

import { Alert } from "../../../../../components/common/Alert";
import Button from "../../../../../components/common/Button";
import { dealerCycleContent as content } from "../dealer-cycle.content";

const text = content.common;

export function PageLoading({ label }: { label?: string }) {
	return (
		<p className="py-10 text-center text-sm text-(--color-text-secondary)" role="status">
			{label ?? "Loading…"}
		</p>
	);
}

export function PageError({
	message,
	onRetry,
}: {
	message?: string | null;
	onRetry: () => void;
}) {
	return (
		<Alert
			variant="error"
			title={text.loadError}
			description={message ?? undefined}
			primaryAction={{ label: text.retry, onClick: onRetry }}
		/>
	);
}

export function PageNoAccess() {
	return <Alert variant="info" title={text.noAccess} description={text.noAccessHelp} />;
}

export function PageEmpty({ title, help }: { title: string; help?: string }) {
	return (
		<div className="rounded-xl border border-dashed border-(--color-border-default) px-4 py-10 text-center">
			<p className="text-base font-semibold">{title}</p>
			{help ? (
				<p className="mt-1 text-sm text-(--color-text-secondary)">{help}</p>
			) : null}
		</div>
	);
}

export function RetryButton({ onClick }: { onClick: () => void }) {
	return (
		<Button
			type="button"
			text={text.retry}
			appearance="standard"
			variant="outline"
			onClick={onClick}
		/>
	);
}
