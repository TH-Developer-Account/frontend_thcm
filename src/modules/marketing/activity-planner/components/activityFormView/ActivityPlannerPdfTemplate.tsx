import type { ReactNode } from "react";

import type { EpcDetailResponse } from "../../types/epc.types";
import type { TableRow } from "../../types/lineItem.types";

import { statusMap } from "../../types/activityplanner.types";
import { formatDateTime } from "../../../../../utils/format";

import {
	formatCurrency,
	formatDate,
	getEpcBranchName,
	getEpcDepartmentName,
	getEpcRegionName,
	getEpcVerticalName,
} from "../../utils/formatters";

import { getAuditMessage } from "../../../../../components/ui/audit";
import { mapCrfLineItemsToTableRows } from "../../forms/CRF/crf.mapper";
import { mapEpfLineItemsToTableRows } from "../../forms/EPF/epf.mapper";
import { mapWorkflowStagesToApprovalRows } from "../../utils/approvalTable.mapper";
import type { CommentItem } from "../../../../../components/ui/comments";
import type { AuditLogEntry } from "../../../../../components/ui/audit";
import { ApprovalTable } from "../../../../workflows";

type Props = {
	epcData?: EpcDetailResponse | null;
	createdBy?: string;
	comments?: CommentItem[];
	auditEntries?: AuditLogEntry[];
};

type InfoItem = {
	label: string;
	value?: ReactNode;
	span?: "default" | "wide" | "full";
};

const safeValue = (value?: ReactNode) => {
	if (value === null || value === undefined || value === "") {
		return "--";
	}

	return value;
};

const toNumber = (value: unknown, fallback = 0): number => {
	const parsed = Number(value);

	return Number.isFinite(parsed) ? parsed : fallback;
};

const getLineItemRate = (item: TableRow): number => {
	return toNumber(
		item.rate ??
			(item as TableRow & { amount?: unknown }).amount ??
			(item as TableRow & { unitRate?: unknown }).unitRate ??
			0,
	);
};

const getLineItemQuantity = (item: TableRow): number => {
	return toNumber(
		item.qty ??
			(
				item as TableRow & {
					quantity?: unknown;
				}
			).quantity ??
			1,
		1,
	);
};

const getLineItemTotal = (item: TableRow): number => {
	const rate = getLineItemRate(item);
	const quantity = getLineItemQuantity(item);

	return toNumber(
		item.total ??
			(
				item as TableRow & {
					totalAmount?: unknown;
				}
			).totalAmount ??
			rate * quantity,
	);
};

const getGrandTotal = (items: TableRow[] = []): number => {
	return items.reduce((sum, item) => sum + getLineItemTotal(item), 0);
};

const getActorName = (
	actor?: { first_name?: string; last_name?: string; email?: string } | null,
): string => {
	const name = [actor?.first_name, actor?.last_name]
		.filter(Boolean)
		.join(" ")
		.trim();

	return name || actor?.email || "--";
};

// ─────────────────────────────────────────────────────────────────────────
// PDF timeline entry — comments and audit rows merge-sorted for display.
// Backend/API now keep them separate; this local union exists only so the
// PDF's single chronological list can render both kinds.
// ─────────────────────────────────────────────────────────────────────────
type TimelineEntry =
	| { kind: "COMMENT"; createdAt: string; comment: CommentItem }
	| { kind: "AUDIT"; createdAt: string; audit: AuditLogEntry };

const buildTimeline = (
	comments: CommentItem[] = [],
	auditEntries: AuditLogEntry[] = [],
): TimelineEntry[] => {
	const commentEntries: TimelineEntry[] = comments.map((comment) => ({
		kind: "COMMENT",
		createdAt: comment.createdAt,
		comment,
	}));

	const auditTimelineEntries: TimelineEntry[] = auditEntries.map((audit) => ({
		kind: "AUDIT",
		createdAt: audit.createdAt,
		audit,
	}));

	return [...commentEntries, ...auditTimelineEntries].sort(
		(a, b) =>
			new Date(a.createdAt ?? 0).getTime() -
			new Date(b.createdAt ?? 0).getTime(),
	);
};

const PdfSection = ({
	title,
	children,
	className = "",
}: {
	title: string;
	children: ReactNode;
	className?: string;
}) => {
	return (
		<section className={["pdf-section", className].filter(Boolean).join(" ")}>
			<div className="pdf-section-heading">
				<span className="pdf-section-marker" aria-hidden="true" />

				<h2 className="pdf-section-title">{title}</h2>
			</div>

			{children}
		</section>
	);
};

const InfoGrid = ({ items }: { items: InfoItem[] }) => {
	return (
		<div className="pdf-grid">
			{items.map((item, index) => {
				const spanClass =
					item.span === "wide"
						? "pdf-field-wide"
						: item.span === "full"
							? "pdf-field-full"
							: "";

				return (
					<div
						key={`${item.label}-${index}`}
						className={["pdf-field", spanClass].filter(Boolean).join(" ")}
					>
						<p className="pdf-label">{item.label}</p>

						<p className="pdf-value">{safeValue(item.value)}</p>
					</div>
				);
			})}
		</div>
	);
};

const NarrativeBlock = ({ items }: { items: InfoItem[] }) => {
	return (
		<div className="pdf-narrative-grid">
			{items.map((item, index) => (
				<div key={`${item.label}-${index}`} className="pdf-narrative-field">
					<p className="pdf-label">{item.label}</p>

					<p className="pdf-long-value">{safeValue(item.value)}</p>
				</div>
			))}
		</div>
	);
};

const MetricCard = ({
	label,
	value,
	tone = "default",
}: {
	label: string;
	value?: ReactNode;
	tone?: "default" | "strong";
}) => {
	return (
		<div
			className={[
				"pdf-metric-card",
				tone === "strong" ? "pdf-metric-card-strong" : "",
			]
				.filter(Boolean)
				.join(" ")}
		>
			<p className="pdf-label">{label}</p>

			<p className="pdf-metric-value">{safeValue(value)}</p>
		</div>
	);
};

const LineItemsTable = ({
	title,
	items = [],
}: {
	title: string;
	items?: TableRow[];
}) => {
	if (!items.length) return null;

	return (
		<PdfSection title={title} className="pdf-keep-together-soft">
			<table className="pdf-table pdf-line-table">
				<thead>
					<tr>
						<th>#</th>
						<th>Particular</th>
						<th>Description</th>
						<th>Rate</th>
						<th>Qty</th>
						<th>Total</th>
					</tr>
				</thead>

				<tbody>
					{items.map((item, index) => {
						const rate = getLineItemRate(item);

						const quantity = getLineItemQuantity(item);

						const total = getLineItemTotal(item);

						return (
							<tr key={item.id ?? `${title}-${index}`}>
								<td>{index + 1}</td>

								<td>{item.particulars || "--"}</td>

								<td>{item.description || "--"}</td>

								<td>{formatCurrency(rate)}</td>

								<td>{quantity}</td>

								<td>{formatCurrency(total)}</td>
							</tr>
						);
					})}
				</tbody>

				<tfoot>
					<tr>
						<td colSpan={5}>Grand Total</td>

						<td>{formatCurrency(getGrandTotal(items))}</td>
					</tr>
				</tfoot>
			</table>
		</PdfSection>
	);
};

const PdfCommentsAndAuditTrail = ({
	comments = [],
	auditEntries = [],
}: {
	comments?: CommentItem[];
	auditEntries?: AuditLogEntry[];
}) => {
	const timeline = buildTimeline(comments, auditEntries);

	if (!timeline.length) {
		return (
			<p className="pdf-empty">No comments or audit messages available.</p>
		);
	}

	return (
		<div className="pdf-audit-list">
			{timeline.map((entry, index) => {
				const key =
					entry.kind === "COMMENT"
						? entry.comment.id
						: (entry.audit.id ?? `audit-${entry.createdAt}-${index}`);

				return (
					<div
						key={key || `${entry.kind}-${entry.createdAt}-${index}`}
						className="pdf-audit-item"
					>
						<div className="pdf-audit-dot" aria-hidden="true" />

						<div className="pdf-audit-content">
							{entry.kind === "AUDIT" ? (
								<p className="pdf-audit-message">
									{getAuditMessage(entry.audit, {
										entityName: "event proposal",
									})}
								</p>
							) : (
								<>
									<div className="pdf-audit-meta">
										<strong>{getActorName(entry.comment.actor)}</strong>

										<span>
											{entry.comment.createdAt
												? formatDateTime(entry.comment.createdAt)
												: "--"}
										</span>
									</div>

									<p className="pdf-comment-message">
										{entry.comment.message || "--"}
									</p>
								</>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
};

const ActivityPlannerPdfTemplate = ({
	epcData,
	createdBy,
	comments = [],
	auditEntries = [],
}: Props) => {
	if (!epcData) {
		return (
			<div className="pdf-document">
				<p className="pdf-empty">No activity planner data available.</p>
			</div>
		);
	}

	const epf = epcData.epf;
	const crf = epcData.crf;
	const activeWorkflow = epcData.activeWorkflow;

	const statusLabel = epcData.status
		? statusMap[epcData.status] || epcData.status
		: "--";

	const internalParticipants = toNumber(epf?.internalParticipants);

	const externalParticipants = toNumber(epf?.externalParticipants);

	const totalParticipants = internalParticipants + externalParticipants;

	const crfLineItems = mapCrfLineItemsToTableRows(crf?.lineItems ?? []);

	const epfLineItems = mapEpfLineItemsToTableRows(epf?.lineItems ?? []);

	const approvalRows = mapWorkflowStagesToApprovalRows(
		activeWorkflow?.stages ?? [],
		{
			showOnlyCurrentStageStatus: true,
		},
	);

	return (
		<div className="pdf-document">
			<header className="pdf-cover-header">
				<div className="pdf-brand-block">
					<p className="pdf-kicker">Activity Planner</p>

					<h1>{epcData.event_name?.title || "Activity Planner"}</h1>

					<p className="pdf-subtitle">
						Proposal No: <strong>{epcData.proposal_number || "--"}</strong>
					</p>
				</div>

				<div className="pdf-header-meta">
					<div className="pdf-status">{statusLabel}</div>

					<p>Generated: {formatDate(new Date().toISOString())}</p>
				</div>
			</header>

			<section className="pdf-hero-card">
				<div>
					<p className="pdf-label">Proposer</p>

					<p className="pdf-hero-value">{createdBy || "--"}</p>
				</div>

				<div>
					<p className="pdf-label">Department</p>

					<p className="pdf-hero-value">{getEpcDepartmentName(epcData)}</p>
				</div>

				<div>
					<p className="pdf-label">Branch</p>

					<p className="pdf-hero-value">{getEpcBranchName(epcData)}</p>
				</div>

				<div>
					<p className="pdf-label">Event Budget</p>

					<p className="pdf-hero-value pdf-money">
						{formatCurrency(epf?.eventBudget)}
					</p>
				</div>
			</section>

			<PdfSection title="Activity Details">
				<InfoGrid
					items={[
						{
							label: "Event From",
							value: formatDate(epcData.event_from_date),
						},
						{
							label: "Event To",
							value: formatDate(epcData.event_to_date),
						},
						{
							label: "Region / Zone",
							value: getEpcRegionName(epcData),
						},
						{
							label: "Vertical",
							value: getEpcVerticalName(epcData),
						},
						{
							label: "Location",
							value: epcData.location || "--",
							span: "wide",
						},
						{
							label: "Created Date",
							value: formatDate(epcData.created_at),
						},
						{
							label: "Current Status",
							value: statusLabel,
						},
					]}
				/>

				<NarrativeBlock
					items={[
						{
							label: "Event Description",
							value: epcData.event_description || "--",
						},
						{
							label: "Objective",
							value: epcData.event_objective || "--",
						},
					]}
				/>
			</PdfSection>

			<PdfSection title="Participants & Budget Summary">
				<div className="pdf-metric-grid">
					<MetricCard
						label="Internal Participants"
						value={internalParticipants}
					/>

					<MetricCard
						label="External Participants"
						value={externalParticipants}
					/>

					<MetricCard label="Total Participants" value={totalParticipants} />

					<MetricCard
						label="Total Event Cost"
						value={formatCurrency(epf?.eventBudget)}
						tone="strong"
					/>
				</div>

				<InfoGrid
					items={[
						{
							label: "Annual Budget",
							value: formatCurrency(epf?.annualBudget),
						},
						{
							label: "Available Budget",
							value: formatCurrency(epf?.availableBudget),
						},
						{
							label: "Dealer Name",
							value: epf?.dealerName || "--",
							span: "wide",
						},
						{
							label: "Dealer Share",
							value: `${epf?.dealerPercent || 0}% / ${formatCurrency(
								epf?.dealerShare,
							)}`,
						},
						{
							label: "Tata Hitachi Share",
							value: `${epf?.tataHitachiPercent || 0}% / ${formatCurrency(
								epf?.tataHitachiShare,
							)}`,
						},
						{
							label: "Tata Hitachi PO Amount",
							value: formatCurrency(epf?.tataHitachiPoAmount),
						},
					]}
				/>
			</PdfSection>

			<LineItemsTable title="CRF Cost Items" items={crfLineItems} />

			<LineItemsTable title="EPF Cost Items" items={epfLineItems} />

			<PdfSection title="Approval Flow">
				<ApprovalTable data={approvalRows} variant="pdf" />
			</PdfSection>

			<PdfSection title="Comments & Audit Trail">
				<PdfCommentsAndAuditTrail
					comments={comments}
					auditEntries={auditEntries}
				/>
			</PdfSection>
		</div>
	);
};

export default ActivityPlannerPdfTemplate;
