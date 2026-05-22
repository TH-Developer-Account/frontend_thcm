import React from "react";
import type { EpcDetailResponse } from "../types/epc.types";
import { statusMap } from "../../../../utils/types";
import {
	formatCurrency,
	formatDate,
	getEpcBranchName,
	getEpcDepartmentName,
	getEpcRegionName,
	getEpcVerticalName,
} from "../utils/formatters";

type Props = {
	epcData?: EpcDetailResponse | null;
	createdBy?: string;
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
const TextSummaryGrid = ({
	items,
}: {
	items: { label: string; value?: React.ReactNode }[];
}) => {
	return (
		<div className="pdf-summary-grid">
			{items.map((item, index) => (
				<div className="pdf-summary-field" key={`${item.label}-${index}`}>
					<p className="pdf-label">{item.label}</p>
					<p className="pdf-long-value">{item.value || "--"}</p>
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
	items?:
		| EpcDetailResponse["epf"]["lineItems"]
		| EpcDetailResponse["crf"]["lineItems"];
}) => {
	if (!items?.length) return null;

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
						const quantity = Number(item.quantity || item.qty || 1);
						const total = Number(item.total || rate * quantity);

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
				status: approval.status || "--",
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
				{/* <div>Created By : </div> */}
			</header>

			<PdfSection title="Basic Details">
				<InfoGrid
					items={[
						{ label: "Proposer", value: createdBy || "--" },
						{ label: "Department", value: getEpcDepartmentName(epcData) },
						{ label: "Region", value: getEpcRegionName(epcData) },
						{ label: "Branch", value: getEpcBranchName(epcData) },
						{ label: "Vertical", value: getEpcVerticalName(epcData) },
						{ label: "Location", value: epcData?.location || "--" },
						{
							label: "Event From",
							value: formatDate(epcData?.event_from_date),
						},
						{ label: "Event To", value: formatDate(epcData?.event_to_date) },
					]}
				/>

				<TextSummaryGrid
					items={[
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
							value: formatCurrency(epf?.annualBudget),
						},
						{
							label: "Available Budget",
							value: formatCurrency(epf?.availableBudget),
						},
						{
							label: "Event Budget",
							value: formatCurrency(epf?.eventBudget),
						},
						{
							label: "Dealer Name",
							value: epf?.dealerName || "--",
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

			<div className="pdf-page-break" />

			<LineItemsTable title="EPF Cost Items" items={epf?.lineItems || []} />
			<LineItemsTable title="CRF Cost Items" items={crf?.lineItems || []} />

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
							{approvalRows.map((row, index) => (
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
