import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";

import { formatDateTime } from "../../../utils/format";

import { CardEmpty, CardSkeleton } from "../CardSkeleton";

import { auditApi } from "./audit.api";
import { auditKeys } from "./audit.keys";
import type { AuditLogRowProps, AuditLogSectionProps } from "./audit.types";
import { getAuditMessageParts } from "./audit.helper";

const Separator = () => (
	<span className="comment-audit-separator" aria-hidden="true">
		-
	</span>
);

/**
 * Renders: Actor - Action - Timestamp - Reason/comment
 */
const AuditLogRow = React.memo(function AuditLogRow({
	entry,
	entityName,
	actionMessages,
	formatMessage,
}: AuditLogRowProps) {
	const { actorName, actionLabel, reason } = getAuditMessageParts(entry, {
		entityName,
		actionMessages,
		formatTimestamp: formatDateTime,
	});

	const action = formatMessage?.(entry) ?? actionLabel;
	console.log("audit messages :", action);

	return (
		<div className="comment-card comment-audit-card">
			<div className="comment-audit-message">
				<div className="comment-audit-content">
					<span className="comment-audit-actor">{actorName}</span>

					<Separator />

					<span className="comment-audit-text">{action}</span>

					{entry.createdAt ? (
						<>
							<Separator />

							<time className="comment-audit-time" dateTime={entry.createdAt}>
								{formatDateTime(entry.createdAt)}
							</time>
						</>
					) : null}

					{reason ? (
						<>
							<Separator />

							<span className="comment-audit-reason">{reason}</span>
						</>
					) : null}
				</div>
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
		queryFn: () =>
			api.getAuditLog({
				subjectType,
				subjectId,
			}),
		enabled: Boolean(subjectType.trim() && subjectId.trim()),
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
