import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";

import { formatDateTime } from "../../../utils/format";

import { auditApi } from "./audit.api";
import { auditKeys } from "./audit.keys";
import { getAuditMessage } from "./audit.helper";
import type { AuditApiAdapter, AuditLogEntry } from "./audit.types";

import { CardEmpty, CardSkeleton } from "../CardSkeleton";

export type AuditLogSectionProps = {
	subjectType: string;
	subjectId: string;
	entityName: string;
	refreshKey?: string | number;
	title?: string;
	emptyTitle?: string;
	emptyDescription?: string;
	api?: AuditApiAdapter;
	formatMessage?: (entry: AuditLogEntry) => React.ReactNode;
	actionMessages?: Parameters<typeof getAuditMessage>[1]["actionMessages"];
};

const AuditLogRow = React.memo(function AuditLogRow({
	entry,
	entityName,
	actionMessages,
	formatMessage,
}: {
	entry: AuditLogEntry;
	entityName: string;
	actionMessages?: AuditLogSectionProps["actionMessages"];
	formatMessage?: AuditLogSectionProps["formatMessage"];
}) {
	const message =
		formatMessage?.(entry) ??
		getAuditMessage(entry, {
			entityName,
			actionMessages,
			includeTimestamp: false,
		});

	return (
		<div className="comment-card">
			<div className="comment-audit-message">
				<span>{message}</span>
				<time className="comment-submeta" dateTime={entry.createdAt}>
					{formatDateTime(entry.createdAt)}
				</time>
			</div>
		</div>
	);
});

export default function AuditLogSection({
	subjectType,
	subjectId,
	entityName,
	refreshKey = 0,
	title = "Activity log",
	emptyTitle = "No activity yet",
	emptyDescription = "System events will show up here as they happen.",
	api = auditApi,
	formatMessage,
	actionMessages,
}: AuditLogSectionProps) {
	const queryKey = React.useMemo(
		() => [...auditKeys.log(subjectType, subjectId), refreshKey] as const,
		[subjectType, subjectId, refreshKey],
	);

	const {
		data: entries = [],
		isLoading,
		error,
	} = useQuery({
		queryKey,
		queryFn: () => api.getAuditLog({ subjectType, subjectId }),
		enabled: Boolean(subjectType && subjectId),
		staleTime: Infinity,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const loadError = error
		? error instanceof Error
			? error.message
			: "Unable to load activity log"
		: null;

	return (
		<section aria-label={title} className="comments-body">
			{isLoading ? (
				<CardSkeleton />
			) : loadError ? (
				<CardEmpty
					title="Unable to load activity"
					description={loadError}
					Icon={ClipboardList}
					iconSize={20}
				/>
			) : entries.length === 0 ? (
				<CardEmpty
					title={emptyTitle}
					description={emptyDescription}
					Icon={ClipboardList}
					iconSize={20}
				/>
			) : (
				<div className="comments-section">
					<div className="comments-list scrollbar-sleek">
						{entries.map((entry) => (
							<AuditLogRow
								key={entry.id}
								entry={entry}
								entityName={entityName}
								actionMessages={actionMessages}
								formatMessage={formatMessage}
							/>
						))}
					</div>
				</div>
			)}
		</section>
	);
}
