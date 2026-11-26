// modules/audit/shared/execution/components/AuditHistoryPanel.tsx
//
// Audit trail. Only mount for users with permissions.canViewHistory — the
// viewer who may not see workflow details never gets this panel.

import { History } from "lucide-react";

import Button from "../../../../../components/common/Button";
import { auditExecutionContent as content } from "../audit-execution.content";
import type { AuditHistoryEntry } from "../audit-execution.types";
import { formatAuditDateTime } from "../audit-execution.format";


const text = content.history;

const ACTION_LABELS: Readonly<Record<string, string>> = text.actions;

/** Unknown actions fall back to the raw code rather than crashing. */
const resolveActionLabel = (action: string): string =>
	ACTION_LABELS[action] ?? action;

interface AuditHistoryPanelProps {
	entries: readonly AuditHistoryEntry[];
	/** Module-specific status wording, e.g. getAuditStatusLabel. */
	getStatusLabel: (status: string) => string;
	isLoading: boolean;
	isError: boolean;
	onRetry: () => void;
}

export default function AuditHistoryPanel({
	entries,
	getStatusLabel,
	isLoading,
	isError,
	onRetry,
}: AuditHistoryPanelProps) {
	if (isLoading) {
		return (
			<p className="text-sm text-(--color-text-secondary)" role="status">
				{text.loading}
			</p>
		);
	}

	if (isError) {
		return (
			<div className="space-y-2" role="alert">
				<p className="text-sm text-red-700">{text.failed}</p>
				<Button
					type="button"
					text={text.retry}
					appearance="standard"
					variant="outline"
					size="sm"
					onClick={onRetry}
				/>
			</div>
		);
	}

	if (entries.length === 0) {
		return (
			<p className="text-sm text-(--color-text-secondary)">{text.empty}</p>
		);
	}

	return (
		<ol className="space-y-3" aria-label={text.heading}>
			{entries.map((entry) => (
				<li key={entry.id} className="flex gap-3">
					<History
						className="mt-0.5 size-4 shrink-0 text-(--color-text-secondary)"
						aria-hidden="true"
					/>
					<div className="min-w-0 text-sm">
						<p className="font-medium text-(--color-text-primary)">
							{resolveActionLabel(entry.action)}
							{entry.fromStatus && entry.toStatus ? (
								<span className="ml-1 text-xs font-normal text-(--color-text-secondary)">
									({getStatusLabel(entry.fromStatus)} →{" "}
									{getStatusLabel(entry.toStatus)})
								</span>
							) : null}
						</p>
						<p className="text-xs text-(--color-text-secondary)">
							{entry.actorName}
							{entry.actorRole ? ` · ${entry.actorRole}` : ""} ·{" "}
							{formatAuditDateTime(entry.occurredAt)}
						</p>
						{entry.comment ? (
							<p className="mt-1 whitespace-pre-wrap break-words text-slate-700">
								{entry.comment}
							</p>
						) : null}
					</div>
				</li>
			))}
		</ol>
	);
}
