import React from "react";
import type { EpcDetailResponse } from "../types/ActivityView.types";
import { statusMap } from "../../../../../utils/types";
import { formatDate } from "../../../../../utils/format";

type Props = {
	epcData?: EpcDetailResponse;
	createdBy?: string;
};

const formatAmount = (value?: number | string | null) => {
	const amount = Number(value || 0);

	return amount.toLocaleString("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	});
};

const PdfSection = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => {
	return (
		<section className="pdf-section">
			<h2 className="pdf-section-title">{title}</h2>
			{children}
		</section>
	);
};

const InfoGrid = ({
	items,
}: {
	items: { label: string; value?: React.ReactNode }[];
}) => {
	return (
		<div className="pdf-grid">
			{items.map((item, index) => (
				<div className="pdf-field" key={`${item.label}-${index}`}>
					<p className="pdf-label">{item.label}</p>
					<p className="pdf-value">{item.value || "--"}</p>
				</div>
			))}
		</div>
	);
};

const LineItemsTable = ({
	title,
	items = [],
}: {
	title: string;
	items?: any[];
}) => {
	if (!items.length) return null;

	return (
		<PdfSection title={title}>
			<table className="pdf-table">
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
						const rate = Number(item.rate || item.amount || 0);
						const quantity = Number(item.quantity || 1);
						const total = rate * quantity;

						return (
							<tr key={item.id || `${title}-${index}`}>
								<td>{index + 1}</td>
								<td>{item.particular || item.name || "--"}</td>
								<td>{item.description || "--"}</td>
								<td>{formatAmount(rate)}</td>
								<td>{quantity}</td>
								<td>{formatAmount(total)}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</PdfSection>
	);
};

const ActivityPlannerPdfTemplate = ({ epcData, createdBy }: Props) => {
	const epf = epcData?.epf;
	const crf = epcData?.crf;
	const activeWorkflow = epcData?.activeWorkflow;

	const statusLabel = epcData?.status
		? statusMap[epcData.status] || epcData.status
		: "--";

	const approvalRows =
		activeWorkflow?.stages?.flatMap((stage: any) =>
			(stage.approvals || []).map((approval: any) => ({
				stageOrder: stage.stageOrder,
				stageName: stage.name || `Stage ${stage.stageOrder}`,
				strategy: stage.strategy,
				approver:
					approval?.approver?.name ||
					approval?.approver?.first_name ||
					approval?.approver?.email ||
					"--",
				status: approval?.status || "--",
			})),
		) || [];

	return (
		<div id="pdf-content" className="pdf-document">
			<header className="pdf-header">
				<div>
					<p className="pdf-kicker">Activity Planner Report</p>
					<h1>{epcData?.event_name?.title || "Activity Planner"}</h1>
					<p className="pdf-subtitle">
						Proposal No: {epcData?.proposal_number || "--"}
					</p>
				</div>

				<div className="pdf-status">{statusLabel}</div>
			</header>

			<PdfSection title="Basic Details">
				<InfoGrid
					items={[
						{ label: "Proposer", value: createdBy || "--" },
						{ label: "Department", value: epcData?.department?.title },
						{ label: "Region", value: epcData?.region?.title },
						{ label: "Branch", value: epcData?.branch?.description },
						{ label: "Vertical", value: epcData?.vertical?.title },
						{ label: "Location", value: epcData?.location },
						{
							label: "Event From",
							value: formatDate(epcData?.event_from_date),
						},
						{
							label: "Event To",
							value: formatDate(epcData?.event_to_date),
						},
						{
							label: "Event Description",
							value: epcData?.event_description || "--",
						},
						{
							label: "Objective",
							value: epcData?.event_objective || "--",
						},
					]}
				/>
			</PdfSection>

			{/* <PdfSection title="Event Description">
				<p className="pdf-paragraph">{epcData?.event_description || "--"}</p>

				<div className="pdf-divider" />

				<p className="pdf-label">Objective</p>
				<p className="pdf-paragraph">{epcData?.event_objective || "--"}</p>
			</PdfSection> */}

			<PdfSection title="Participants">
				<InfoGrid
					items={[
						{
							label: "External Participants",
							value: epf?.externalParticipants ?? "--",
						},
						{
							label: "Internal Participants",
							value: epf?.internalParticipants ?? "--",
						},
						{
							label: "Total Participants",
							value:
								Number(epf?.externalParticipants || 0) +
								Number(epf?.internalParticipants || 0),
						},
					]}
				/>
			</PdfSection>

			<PdfSection title="Budget Summary">
				<InfoGrid
					items={[
						{
							label: "Annual Budget",
							value: formatAmount(epf?.annualBudget),
						},
						{
							label: "Available Budget",
							value: formatAmount(epf?.availableBudget),
						},
						{
							label: "Event Budget",
							value: formatAmount(epf?.eventBudget),
						},
						{
							label: "Dealer Name",
							value: epf?.dealerName || "--",
						},
						{
							label: "Dealer Share",
							value: `${epf?.dealerPercent || 0}% / ${formatAmount(
								epf?.dealerShare,
							)}`,
						},
						{
							label: "Tata Hitachi Share",
							value: `${epf?.tataHitachiPercent || 0}% / ${formatAmount(
								epf?.tataHitachiShare,
							)}`,
						},
						{
							label: "Tata Hitachi PO Amount",
							value: formatAmount(epf?.tataHitachiPoAmount),
						},
					]}
				/>
			</PdfSection>

			<div className="pdf-page-break" />

			<LineItemsTable
				title="EPF Cost Items"
				items={(epf as any)?.lineItems || (epf as any)?.costItems || []}
			/>

			<LineItemsTable
				title="CRF Cost Items"
				items={(crf as any)?.lineItems || (crf as any)?.costItems || []}
			/>

			<PdfSection title="Approval Flow">
				{approvalRows.length ? (
					<table className="pdf-table">
						<thead>
							<tr>
								<th>Stage</th>
								<th>Stage Name</th>
								<th>Strategy</th>
								<th>Approver</th>
								<th>Status</th>
							</tr>
						</thead>

						<tbody>
							{approvalRows.map((row: any, index: number) => (
								<tr key={`${row.stageOrder}-${row.approver}-${index}`}>
									<td>{row.stageOrder}</td>
									<td>{row.stageName}</td>
									<td>{row.strategy}</td>
									<td>{row.approver}</td>
									<td>{row.status}</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<p className="pdf-empty">No approval flow available.</p>
				)}
			</PdfSection>
		</div>
	);
};

export default ActivityPlannerPdfTemplate;
