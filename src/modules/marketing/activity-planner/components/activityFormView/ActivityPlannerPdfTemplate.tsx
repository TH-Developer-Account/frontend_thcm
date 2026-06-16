import React from "react";
import type { EpcDetailResponse } from "../../types/epc.types";
import { statusMap } from "../../../../../utils/types";
import {
	formatCurrency,
	formatDate,
	getEpcBranchName,
	getEpcDepartmentName,
	getEpcRegionName,
	getEpcVerticalName,
} from "../../utils/formatters";

import { formatDateTime } from "../../../../../utils/format";
import { getAuditMessage } from "../../helpers/activityLogMessage.helper";
import type { WorkflowComment } from "../../types/workflow.types";
import { mapCrfLineItemsToTableRows } from "../../forms/CRF/crf.mapper";
import { mapEpfLineItemsToTableRows } from "../../forms/EPF/epf.mapper";

type Props = {
	epcData?: EpcDetailResponse | null;
	createdBy?: string;
	workflowEntries?: WorkflowComment[];
};

type InfoItem = {
	label: string;
	value?: React.ReactNode;
	span?: "default" | "wide" | "full";
};

type LineItem = NonNullable<EpcDetailResponse["epf"]>["lineItems"][number];

type ApprovalRow = {
	stageOrder?: number | string | null;
	stageName?: string | null;
	strategy?: string | null;
	approver: string;
	email?: string | null;
	status?: string | null;
};

const safeValue = (value?: React.ReactNode) => {
	if (value === null || value === undefined || value === "") return "--";
	return value;
};

const toNumber = (value: unknown, fallback = 0) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const getLineItemRate = (item: any) => {
	return toNumber(item?.rate ?? item?.amount ?? item?.unitRate ?? 0);
};
const getActorName = (entry: WorkflowComment) => {
	const name = `${entry.actor?.first_name ?? ""} ${
		entry.actor?.last_name ?? ""
	}`.trim();

	return name || entry.actor?.email || "--";
};

const sortWorkflowEntries = (entries: WorkflowComment[] = []) => {
	return [...entries].sort(
		(a, b) =>
			new Date(a.createdAt ?? 0).getTime() -
			new Date(b.createdAt ?? 0).getTime(),
	);
};
const getLineItemQty = (item: any) => {
	return toNumber(item?.quantity ?? item?.qty ?? 1, 1);
};

const getLineItemTotal = (item: any) => {
	const rate = getLineItemRate(item);
	const qty = getLineItemQty(item);
	return toNumber(item?.total ?? item?.totalAmount ?? rate * qty);
};

const getGrandTotal = (items: LineItem[] = []) => {
	return items.reduce((sum, item) => sum + getLineItemTotal(item), 0);
};

const PdfSection = ({
	title,
	children,
	className = "",
}: {
	title: string;
	children: React.ReactNode;
	className?: string;
}) => {
	return (
		<section className={`pdf-section ${className}`}>
			<div className="pdf-section-heading">
				<span className="pdf-section-marker" />
				<h2 className="pdf-section-title">{title}</h2>
			</div>
			{children}
		</section>
	);
};

const InfoGrid = ({ items }: { items: InfoItem[] }) => {
	return (
		<div className="pdf-grid">
			{items.map((item, index) => (
				<div
					className={`pdf-field ${
						item.span === "wide"
							? "pdf-field-wide"
							: item.span === "full"
								? "pdf-field-full"
								: ""
					}`}
					key={`${item.label}-${index}`}
				>
					<p className="pdf-label">{item.label}</p>
					<p className="pdf-value">{safeValue(item.value)}</p>
				</div>
			))}
		</div>
	);
};

const NarrativeBlock = ({ items }: { items: InfoItem[] }) => {
	return (
		<div className="pdf-narrative-grid">
			{items.map((item, index) => (
				<div className="pdf-narrative-field" key={`${item.label}-${index}`}>
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
	value?: React.ReactNode;
	tone?: "default" | "strong";
}) => {
	return (
		<div
			className={`pdf-metric-card ${tone === "strong" ? "pdf-metric-card-strong" : ""}`}
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
	items?: LineItem[];
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
					{items.map((item: any, index) => {
						const rate = getLineItemRate(item);
						const quantity = getLineItemQty(item);
						const total = getLineItemTotal(item);

						return (
							<tr key={item.id || `${title}-${index}`}>
								<td>{index + 1}</td>
								<td>
									{item.particulars ||
										item.particular ||
										item.product?.name ||
										"--"}
								</td>
								<td>{item.description || item.product?.description || "--"}</td>
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

const ApprovalTable = ({ rows }: { rows: ApprovalRow[] }) => {
	if (!rows.length) {
		return <p className="pdf-empty">No approval flow available.</p>;
	}

	return (
		<table className="pdf-table pdf-approval-table">
			<thead>
				<tr>
					<th>Stage</th>
					<th>Stage Name</th>
					<th>Flow</th>
					<th>Approver</th>
					<th>Email</th>
					<th>Status</th>
				</tr>
			</thead>

			<tbody>
				{rows.map((row, index) => (
					<tr key={`${row.stageOrder}-${row.approver}-${index}`}>
						<td>{safeValue(row.stageOrder)}</td>
						<td>{safeValue(row.stageName)}</td>
						<td>{safeValue(row.strategy)}</td>
						<td>{safeValue(row.approver)}</td>
						<td>{safeValue(row.email)}</td>
						<td>
							<span className="pdf-status-pill">{safeValue(row.status)}</span>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};

const PdfCommentsAndAuditTrail = ({
	entries = [],
}: {
	entries?: WorkflowComment[];
}) => {
	const sortedEntries = sortWorkflowEntries(entries);

	if (!sortedEntries.length) {
		return (
			<p className="pdf-empty">No comments or audit messages available.</p>
		);
	}

	return (
		<div className="pdf-audit-list">
			{sortedEntries.map((entry, index) => {
				const isAuditLog = entry.entryType === "ACTIVITY_LOG";

				return (
					<div
						key={entry.id || `${entry.entryType}-${entry.createdAt}-${index}`}
						className="pdf-audit-item"
					>
						<div className="pdf-audit-dot" />

						<div className="pdf-audit-content">
							{isAuditLog ? (
								<p className="pdf-audit-message">
									{getAuditMessage(entry as any)}
								</p>
							) : (
								<>
									<div className="pdf-audit-meta">
										<strong>{getActorName(entry)}</strong>
										<span>
											{entry.createdAt ? formatDateTime(entry.createdAt) : "--"}
										</span>
									</div>

									<p className="pdf-comment-message">
										{entry.message || entry.reason || "--"}
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
	workflowEntries = [],
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

	const approvalRows: ApprovalRow[] =
		activeWorkflow?.stages?.flatMap((stage) =>
			(stage.approvals || []).map((approval) => ({
				stageOrder: stage.stageOrder,
				stageName: stage.stageName || `Stage ${stage.stageOrder}`,
				strategy: stage.strategy,
				approver:
					`${approval.approver?.first_name ?? ""} ${
						approval.approver?.last_name ?? ""
					}`.trim() ||
					approval.approver?.email ||
					"--",
				email: approval.approver?.email,
				status: approval.status || "--",
			})),
		) || [];

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
						{ label: "Event From", value: formatDate(epcData.event_from_date) },
						{ label: "Event To", value: formatDate(epcData.event_to_date) },
						{ label: "Region / Zone", value: getEpcRegionName(epcData) },
						{ label: "Vertical", value: getEpcVerticalName(epcData) },
						{
							label: "Location",
							value: epcData.location || "--",
							span: "wide",
						},
						{ label: "Created Date", value: formatDate(epcData.created_at) },
						{ label: "Current Status", value: statusLabel },
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
							value: `${epf?.dealerPercent || 0}% / ${formatCurrency(epf?.dealerShare)}`,
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

			<LineItemsTable
				title="CRF Cost Items"
				items={mapCrfLineItemsToTableRows(crf?.lineItems) || []}
			/>
			<LineItemsTable
				title="EPF Cost Items"
				items={mapEpfLineItemsToTableRows(epf?.lineItems) || []}
			/>
			<PdfSection title="Approval Flow">
				<ApprovalTable rows={approvalRows} />
			</PdfSection>

			<PdfSection title="Comments & Audit Trail">
				<PdfCommentsAndAuditTrail entries={workflowEntries} />
			</PdfSection>
		</div>
	);
};

export default ActivityPlannerPdfTemplate;
