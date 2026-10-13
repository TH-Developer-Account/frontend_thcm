import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardList } from "lucide-react";

import { formatDateTime } from "../../../utils/format";

import { CardEmpty, CardSkeleton } from "../CardSkeleton";

import { auditApi } from "./audit.api";
import { auditKeys } from "./audit.keys";
import type {
	AuditLogEntry,
	AuditLogRowProps,
	AuditLogSectionProps,
} from "./audit.types";
import {
	formatAuditLabel,
	getAuditMessageParts,
	normalizeAuditAction,
} from "./audit.helper";

import "./audit.css";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_MESSAGE_TRUNCATE_LENGTH = 50;

type AuditTone = "brand" | "success" | "warning" | "danger";

const ACTION_TONES: Record<string, AuditTone> = {
	CREATED: "success",
	INITIATED: "success",
	APPROVED: "success",
	VALIDATED: "success",
	ACCEPTED: "success",
	CONDUCTED: "success",
	CLOSED: "success",

	UPDATED: "warning",
	RESUBMITTED: "warning",
	CLARIFY: "warning",
	CLARIFICATION_REQUESTED: "warning",
	DEVIATION_RAISED: "warning",

	REJECTED: "danger",
	CANCELLED: "danger",
};

const getAuditTone = (entry: AuditLogEntry): AuditTone =>
	ACTION_TONES[normalizeAuditAction(entry.action)] ?? "brand";

/* -------------------------------------------------------------------------- */
/* Compact time: "Today, 10:42 am" / "Yesterday, …" / "05 Oct, 10:42 am"      */
/* -------------------------------------------------------------------------- */

const isSameDay = (a: Date, b: Date) =>
	a.getFullYear() === b.getFullYear() &&
	a.getMonth() === b.getMonth() &&
	a.getDate() === b.getDate();

const formatCompactTime = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";

	const now = new Date();
	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);

	const time = date.toLocaleTimeString("en-IN", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});

	if (isSameDay(date, now)) return `Today, ${time}`;
	if (isSameDay(date, yesterday)) return `Yesterday, ${time}`;

	const day = date.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
	});

	return `${day}, ${time}`;
};

/* -------------------------------------------------------------------------- */
/* Truncated text with read more                                              */
/* -------------------------------------------------------------------------- */

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

	return (
		<span className={className}>
			{expanded ? text : `${text.slice(0, truncateLength).trimEnd()}… `}
			{expanded ? " " : null}
			<button
				type="button"
				className="audit-timeline-readmore"
				aria-expanded={expanded}
				onClick={() => setExpanded((current) => !current)}
			>
				{expanded ? "Show less" : "Read more"}
			</button>
		</span>
	);
};

/* -------------------------------------------------------------------------- */
/* Row                                                                        */
/* -------------------------------------------------------------------------- */

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
	const tone = getAuditTone(entry);

	const stageName = entry.stageName?.trim();
	const previousStatus = entry.metadata?.previousStatus?.trim();
	const currentStatus = entry.metadata?.currentStatus?.trim();
	const hasStatusChange = Boolean(previousStatus || currentStatus);

	return (
		<li className={`audit-timeline-item audit-timeline-item--${tone}`}>
			<span className="audit-timeline-dot" aria-hidden="true" />

			{/* Line 1: action + stage chip */}
			<div className="audit-timeline-head">
				<span className="audit-timeline-action">{action}</span>

				{stageName ? (
					<span className="audit-timeline-chip" title="Workflow stage">
						{stageName}
					</span>
				) : null}
			</div>

			{/* Line 2: actor · time */}
			<div className="audit-timeline-meta">
				<span className="audit-timeline-actor">{actorName}</span>

				{entry.createdAt ? (
					<>
						<span aria-hidden="true">·</span>
						<time
							dateTime={entry.createdAt}
							title={formatDateTime(entry.createdAt)}
						>
							{formatCompactTime(entry.createdAt)}
						</time>
					</>
				) : null}
			</div>

			{/* Optional detail box: status change + reason */}
			{hasStatusChange || reason ? (
				<div className="audit-timeline-detail">
					{hasStatusChange ? (
						<span className="audit-timeline-status">
							<span>{formatAuditLabel(previousStatus) || "—"}</span>
							<ArrowRight size={11} aria-hidden="true" />
							<span>{formatAuditLabel(currentStatus) || "—"}</span>
						</span>
					) : null}

					{reason ? (
						<TruncatedText
							text={reason}
							truncateLength={messageTruncateLength}
							className="audit-timeline-reason"
						/>
					) : null}
				</div>
			) : null}
		</li>
	);
});

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

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
						<ol className="audit-timeline">
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
						</ol>
					</div>
				</div>
			)}
		</section>
	);
}
