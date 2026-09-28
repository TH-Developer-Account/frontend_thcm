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

// Row renders: Actor - Action - Timestamp - Reason/comment
const DEFAULT_MESSAGE_TRUNCATE_LENGTH = 50;

/**
 * Renders a piece of the audit line, truncating it with a "...read more"
 * toggle when it exceeds `truncateLength`. Expanded text wraps normally.
 */
const TruncatedText = ({
	text,
	truncateLength,
	className,
}: {
	text: string;
	truncateLength: number;
	className?: string;
}) => {
	const [expanded, setExpanded] = React.useState(false);

	const isTruncatable =
		Number.isFinite(truncateLength) && text.length > truncateLength;

	if (!isTruncatable) {
		return <span className={className}>{text}</span>;
	}

	if (expanded) {
		return (
			<span
				className={className}
				style={{
					display: "block",
					width: "100%",
					flexBasis: "100%",
					minWidth: 0,
					whiteSpace: "pre-wrap",
					overflowWrap: "anywhere",
					wordBreak: "break-word",
				}}
			>
				{text}{" "}
				<button
					type="button"
					className="comment-audit-readmore-toggle"
					onClick={() => setExpanded(false)}
				>
					Show less
				</button>
			</span>
		);
	}

	return (
		<span className={className}>
			{text.slice(0, truncateLength).trimEnd()}
			{"... "}
			<button
				type="button"
				className="comment-audit-readmore-toggle"
				onClick={() => setExpanded(true)}
			>
				Read more
			</button>
		</span>
	);
};

const AuditLogRow = React.memo(function AuditLogRow({
	entry,
	entityName,
	actionMessages,
	formatMessage,
	anonymousActorLabel,
	messageTruncateLength = DEFAULT_MESSAGE_TRUNCATE_LENGTH,
}: AuditLogRowProps) {
	const { actorName, actionLabel, reason } = getAuditMessageParts(entry, {
		entityName,
		actionMessages,
		formatTimestamp: formatDateTime,
		anonymousActorLabel,
	});

	const action = formatMessage?.(entry) ?? actionLabel;
	const actionText = typeof action === "string" ? action : null;

	return (
		<div className="comment-card comment-audit-card">
			<div className="comment-audit-message">
				<div className="comment-audit-content">
					<span className="comment-audit-actor">{actorName}</span>

					<Separator />

					{actionText !== null ? (
						<TruncatedText
							text={actionText}
							truncateLength={messageTruncateLength}
							className="comment-audit-text"
						/>
					) : (
						<span className="comment-audit-text">{action}</span>
					)}

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

							<TruncatedText
								text={reason}
								truncateLength={messageTruncateLength}
								className="comment-audit-reason"
							/>
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
	anonymousActorLabel,
	messageTruncateLength,
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
								anonymousActorLabel={anonymousActorLabel}
								messageTruncateLength={messageTruncateLength}
							/>
						))}
					</div>
				</div>
			)}
		</section>
	);
}
