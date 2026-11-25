import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, ClipboardList } from "lucide-react";

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

// 50 cut most remarks mid-sentence; 140 keeps a typical approval remark whole.
const DEFAULT_MESSAGE_TRUNCATE_LENGTH = 140;

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

const formatTimeOnly = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleTimeString("en-IN", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
};

/* -------------------------------------------------------------------------- */
/* Day groups: "Today" / "Yesterday" / "24 Nov 2026", newest order preserved  */
/* -------------------------------------------------------------------------- */

const UNKNOWN_DAY = "unknown";

const dayKey = (value?: string): string => {
	const date = value ? new Date(value) : null;
	if (!date || Number.isNaN(date.getTime())) return UNKNOWN_DAY;
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const formatDayLabel = (value?: string): string => {
	const date = value ? new Date(value) : null;
	if (!date || Number.isNaN(date.getTime())) return "Date not recorded";

	const now = new Date();
	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);

	if (isSameDay(date, now)) return "Today";
	if (isSameDay(date, yesterday)) return "Yesterday";

	return date.toLocaleDateString("en-IN", {
		weekday: "short",
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

const groupByDay = (entries: AuditLogEntry[]) => {
	const groups: Array<{ key: string; label: string; entries: AuditLogEntry[] }> = [];
	for (const entry of entries) {
		const key = dayKey(entry.createdAt);
		const last = groups[groups.length - 1];
		if (last && last.key === key) {
			last.entries.push(entry);
		} else {
			groups.push({ key, label: formatDayLabel(entry.createdAt), entries: [entry] });
		}
	}
	return groups;
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
							{formatTimeOnly(entry.createdAt)}
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
		refetch,
		isFetching,
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

	// Raw API messages are not shown to users; the error is still in devtools.
	const hasLoadError = Boolean(error);
	const groups = React.useMemo(() => groupByDay(entries), [entries]);

	return (
		<section aria-label={title} className="comments-body">
			{isLoading ? (
				<CardSkeleton />
			) : hasLoadError ? (
				<div className="audit-timeline-error" role="alert">
					<AlertCircle aria-hidden="true" className="audit-timeline-error-icon" />
					<div className="audit-timeline-error-copy">
						<p className="audit-timeline-error-title">Couldn't load the activity log</p>
						<p className="audit-timeline-error-text">
							The record itself is fine. Try again in a moment.
						</p>
						<button
							type="button"
							className="button-base button-standard button-outline button-sm"
							onClick={() => void refetch()}
							disabled={isFetching}
						>
							{isFetching ? "Retrying…" : "Try again"}
						</button>
					</div>
				</div>
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
						<div className="audit-timeline-groups">
							{groups.map((group) => (
								<section
									key={group.key}
									className="audit-timeline-group"
									aria-label={group.label}
								>
									<h4 className="audit-timeline-date">
										{group.label}
										<span className="audit-timeline-date-count">
											{group.entries.length}
											<span className="sr-only">
												{group.entries.length === 1 ? " event" : " events"}
											</span>
										</span>
									</h4>
									<ol className="audit-timeline">
										{group.entries.map((entry) => (
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
								</section>
							))}
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
