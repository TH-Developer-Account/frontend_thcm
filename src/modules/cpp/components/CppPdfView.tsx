// components/CppPdfView.tsx — the CPP request drawn as the Tata Hitachi price approval sheet (page 1
// of the "WS" approval PDF). Landscape, same block order and labels, filled from the saved request.
// Nothing is generated or downloaded per view.
import type { ReactNode } from "react";

import type { CppFormValues } from "../types/cpp.types";

const DASH = "--";
const PLANTS = ["DWD", "KGP", "SPARE"] as const;
const PRICING_OPTIONS = [
	{ code: "PB00", label: "Regular" },
	{ code: "PB50", label: "Amortised" },
	{ code: "PB25", label: "One Time" },
	{ code: "PB75", label: "Provisional" },
] as const;

type PdfApprover = {
	first_name?: string | null;
	last_name?: string | null;
	email?: string | null;
	designation?: { name?: string | null } | null;
} | null;

export type CppPdfStage = {
	stageOrder?: number;
	stageName?: string;
	approvals?: { status?: string; approver?: PdfApprover }[];
};

type CppPdfViewProps = {
	values: CppFormValues;
	referenceNumber: string;
	stages: CppPdfStage[];
	/** Name of the person who initiated the request. */
	initiatedBy?: string | null;
};

const text = (value?: string | null): string =>
	value && value.trim() ? value : DASH;

const nameOf = (approver: PdfApprover | undefined): string =>
	[approver?.first_name, approver?.last_name]
		.map((part) => (part ?? "").trim())
		.filter(Boolean)
		.join(" ") || DASH;

/** yyyy-mm-dd to dd-mm-yyyy, as on the sheet. */
const dateOf = (iso?: string): string => {
	if (!iso) return DASH;
	const [year, month, day] = iso.slice(0, 10).split("-");
	return year && month && day ? `${day}-${month}-${year}` : iso;
};

const tick = (on: boolean): string => (on ? "✓" : "");

/** Approvers of every stage whose name matches, as "Name (designation)" lines. */
const approversFor = (stages: CppPdfStage[], pattern: RegExp) =>
	stages
		.filter((stage) => pattern.test(stage.stageName ?? ""))
		.flatMap((stage) =>
			(stage.approvals ?? []).map((approval) => ({
				name: nameOf(approval.approver),
				designation: approval.approver?.designation?.name ?? "",
			})),
		)
		.filter((person) => person.name !== DASH);

/** A bordered box with a small caption, used for every block on the sheet. */
const Box = ({
	caption,
	className = "",
	children,
}: {
	caption?: string;
	className?: string;
	children: ReactNode;
}) => (
	<div className={`cpp-pdf-box ${className}`.trim()}>
		{caption ? <div className="cpp-pdf-caption">{caption}</div> : null}
		{children}
	</div>
);

const CppPdfView = ({
	values,
	referenceNumber,
	stages,
	initiatedBy,
}: CppPdfViewProps) => {
	const effects = values.effects ?? [];
	const parts = values.parts ?? [];
	const amortisation = values.amortisation ?? [];
	const perMachine = values.perMachineImpact ?? [];
	const costTracker = values.costTracker ?? [];
	const plantDetails = values.masterData?.plantDetails ?? [];
	const models = (values.workflow?.models ?? []).filter(Boolean);
	const selectedPricing = values.workflow?.pricingCondition ?? "";
	const plantRow = plantDetails.find(
		(p) => p.group === "PLANT" && p.applicable,
	);
	const spareRow = plantDetails.find(
		(p) => p.group === "SPARE" && p.applicable,
	);

	const checkedBy = approversFor(stages, /^checker/i);
	const recommendedBy = approversFor(stages, /^recommender/i);
	const approvedBy = approversFor(stages, /^approver-[123]/i);
	const committee = approversFor(stages, /committee/i);
	const chairman = approversFor(stages, /chairman/i);

	const signed = (people: { name: string; designation: string }[]) =>
		people.length === 0 ? (
			<div className="cpp-pdf-sign-name">{DASH}</div>
		) : (
			people.map((person, index) => (
				<div key={`${person.name}-${index}`} className="cpp-pdf-sign">
					<div className="cpp-pdf-sign-name">{person.name}</div>
					{person.designation ? (
						<div className="cpp-pdf-sign-role">({person.designation})</div>
					) : null}
				</div>
			))
		);

	return (
		<article
			className="cpp-pdf-sheet"
			aria-label="CPP request price approval sheet"
		>
			{/* ── Title band ── */}
			<header className="cpp-pdf-titlebar">
				<div className="cpp-pdf-logo">
					<span className="cpp-pdf-brand">TATA HITACHI</span>
					<span className="cpp-pdf-tag">Reliable solutions</span>
				</div>
				<div className="cpp-pdf-doctitle">
					<div className="cpp-pdf-doctitle-main">
						DIRECT/ INDIRECT MATERIAL/ SPARE PARTS - PRICE APPROVAL
					</div>
					<div>Dharwad/ Kharagpur /Spare</div>
					<div className="cpp-pdf-format">Format no-THX11-D07-F02 Ver 1.5</div>
				</div>
			</header>

			{/* ── Reason · commodity · effect · approval ref ── */}
			<div className="cpp-pdf-row cpp-pdf-row-reason">
				<Box caption="Reason for price update">
					<div className="cpp-pdf-value">{text(values.reason)}</div>
				</Box>
				<Box className="cpp-pdf-center">
					<div className="cpp-pdf-value cpp-pdf-strong">
						Commodity Price adjustment
					</div>
				</Box>
				<Box caption="Effect (only for existing materials)">
					<div className="cpp-pdf-value">
						Quality [{tick(effects.includes("Quality"))}] &nbsp; Cost [
						{tick(effects.includes("Cost"))}] &nbsp; Delivery [
						{tick(effects.includes("Delivery"))}]
					</div>
				</Box>
				<Box className="cpp-pdf-ref">
					<div>
						Approval Ref.: <strong>{referenceNumber}</strong>
					</div>
					<div>
						Date: <strong>{dateOf(values.initiationDate)}</strong>
					</div>
				</Box>
			</div>

			{/* ── Purchasing details · financial impact ── */}
			<div className="cpp-pdf-row cpp-pdf-row-main">
				<Box caption="Purchasing Details" className="cpp-pdf-purchasing">
					<table className="cpp-pdf-table">
						<thead>
							<tr>
								<th colSpan={2}>Existing Supplier</th>
								<th colSpan={2}>Other Supplier</th>
								<th colSpan={2}>Recommended Supplier</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Name</td>
								<td>{text(values.suppliers?.existing?.name)}</td>
								<td>Name</td>
								<td>{text(values.suppliers?.other?.name)}</td>
								<td>Name</td>
								<td>{text(values.suppliers?.recommended?.name)}</td>
							</tr>
							<tr>
								<td>Code</td>
								<td>{text(values.suppliers?.existing?.code)}</td>
								<td>Code</td>
								<td>{text(values.suppliers?.other?.code)}</td>
								<td>Code</td>
								<td>{text(values.suppliers?.recommended?.code)}</td>
							</tr>
						</tbody>
					</table>
					<table className="cpp-pdf-table cpp-pdf-mt">
						<thead>
							<tr>
								<th rowSpan={2}>Part No.</th>
								<th rowSpan={2}>Description</th>
								<th rowSpan={2}>UOM</th>
								<th colSpan={2}>Existing Price</th>
								<th colSpan={2}>Quoted Price</th>
								<th colSpan={2}>Price Finalised</th>
							</tr>
							<tr>
								<th>Unit rate (₹)</th>
								<th>w.e.f</th>
								<th>Unit rate (₹)</th>
								<th>w.e.f</th>
								<th>Unit rate (₹)</th>
								<th>w.e.f</th>
							</tr>
						</thead>
						<tbody>
							{(parts.length ? parts : [null, null, null]).map(
								(part, index) => (
									<tr key={index}>
										<td>{text(part?.partNo)}</td>
										<td>{text(part?.description)}</td>
										<td>{text(part?.uom)}</td>
										<td>{text(part?.existingRate)}</td>
										<td>{text(part?.existingWef)}</td>
										<td>{text(part?.quotedRate)}</td>
										<td>{text(part?.quotedWef)}</td>
										<td>{text(part?.finalRate)}</td>
										<td>{text(part?.finalWef)}</td>
									</tr>
								),
							)}
						</tbody>
					</table>
				</Box>

				<Box caption="Financial Impact" className="cpp-pdf-financial">
					<table className="cpp-pdf-table">
						<thead>
							<tr>
								<th rowSpan={2}>Plant</th>
								<th colSpan={2}>Actual = [(a+ b)X Impact]</th>
								<th colSpan={2}>Annual Impact = [ c X Impact]</th>
							</tr>
							<tr>
								<th>in INR</th>
								<th>in %</th>
								<th>in INR</th>
								<th>in %</th>
							</tr>
						</thead>
						<tbody>
							{PLANTS.map((plant) => (
								<tr key={plant}>
									<td>{plant}</td>
									<td>{DASH}</td>
									<td>{DASH}</td>
									<td>{text(values.financial?.plantSplit?.[plant])}</td>
									<td>{DASH}</td>
								</tr>
							))}
							<tr className="cpp-pdf-total">
								<td>Total</td>
								<td>{DASH}</td>
								<td>{DASH}</td>
								<td>{text(values.approvalValues?.amount)}</td>
								<td>{DASH}</td>
							</tr>
						</tbody>
					</table>
				</Box>
			</div>

			{/* ── Amortisation · per machine · volumes · other data ── */}
			<div className="cpp-pdf-row cpp-pdf-row-mid">
				<Box caption="In case of Amortisation Only" className="cpp-pdf-amort">
					<table className="cpp-pdf-table">
						<thead>
							<tr>
								<th>Part No</th>
								<th>Price incl. Amort.</th>
								<th>Cutoff Date</th>
								<th>Amort. Qty.</th>
								<th>Price After Amort.</th>
							</tr>
						</thead>
						<tbody>
							{(amortisation.length ? amortisation : [null, null]).map(
								(row, index) => (
									<tr key={index}>
										<td>{text(row?.partNo)}</td>
										<td>{text(row?.priceInclAmort)}</td>
										<td>{dateOf(row?.cutoffDate)}</td>
										<td>{text(row?.amortQty)}</td>
										<td>{text(row?.priceAfterAmort)}</td>
									</tr>
								),
							)}
						</tbody>
					</table>
				</Box>

				<Box caption="Per Machine Impact" className="cpp-pdf-permachine">
					<table className="cpp-pdf-table">
						<thead>
							<tr>
								<th>Plant</th>
								<th>Model</th>
								<th>Impact in Rs. (With Amort.)</th>
								<th>Impact in Rs. (W/O Amort.)</th>
							</tr>
						</thead>
						<tbody>
							{(perMachine.length ? perMachine : [null, null]).map(
								(row, index) => (
									<tr key={index}>
										<td>{text(row?.plant)}</td>
										<td>{text(row?.model)}</td>
										<td>{text(row?.withAmort)}</td>
										<td>{text(row?.withoutAmort)}</td>
									</tr>
								),
							)}
						</tbody>
					</table>
				</Box>

				<Box
					caption="Volumes Taken For Calculation"
					className="cpp-pdf-volumes"
				>
					<table className="cpp-pdf-table">
						<thead>
							<tr>
								<th>Plant →</th>
								<th>DWD</th>
								<th>KGP</th>
								<th>SPARE</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Rcvd. Qty. (Till Date) = a</td>
								{PLANTS.map((plant) => (
									<td key={plant}>{text(values.volumes?.[plant]?.received)}</td>
								))}
							</tr>
							<tr>
								<td>Remaining Qty. = b</td>
								{PLANTS.map((plant) => (
									<td key={plant}>
										{text(values.volumes?.[plant]?.remaining)}
									</td>
								))}
							</tr>
							<tr>
								<td>For Annualised</td>
								<td />
								<td />
								<td />
							</tr>
							<tr>
								<td>Qty./mc x ABP No's = c</td>
								{PLANTS.map((plant) => (
									<td key={plant}>{text(values.volumes?.[plant]?.annual)}</td>
								))}
							</tr>
						</tbody>
					</table>
				</Box>

				<Box caption="Other Data" className="cpp-pdf-otherdata">
					<table className="cpp-pdf-table">
						<thead>
							<tr>
								<th colSpan={3}>Price in Other Plant Location (if any)</th>
							</tr>
							<tr>
								<th>Plant</th>
								<th>Part Number</th>
								<th>Price</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>{DASH}</td>
								<td>{DASH}</td>
								<td>{DASH}</td>
							</tr>
						</tbody>
					</table>
				</Box>
			</div>

			{/* ── Models & plants · justification · material cost tracker ── */}
			<div className="cpp-pdf-row cpp-pdf-row-body">
				<div className="cpp-pdf-col-left">
					<Box caption="Models">
						<div className="cpp-pdf-value">
							{models.length ? models.join(", ") : DASH}
						</div>
					</Box>
					<Box caption="Applicable Plant(s) (Y/N)">
						<table className="cpp-pdf-table">
							<tbody>
								{plantDetails.map((plant) => (
									<tr key={plant.code}>
										<td>{text(plant.name)}</td>
										<td>{text(plant.code)}</td>
										<td>{plant.applicable ? "Yes" : "No"}</td>
									</tr>
								))}
							</tbody>
						</table>
					</Box>
					<Box caption="Price Type">
						<div className="cpp-pdf-value">{text(values.priceType)}</div>
					</Box>
					<Box caption="Pricing Condition">
						<table className="cpp-pdf-table">
							<tbody>
								{PRICING_OPTIONS.map((option) => (
									<tr key={option.code}>
										<td>{option.code}</td>
										<td>
											{option.label}
											{option.code === selectedPricing ? " ✓" : ""}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</Box>
					<Box caption="For Plants">
						<div className="cpp-pdf-kv">
							<span>Inco Terms</span>
							<span>{text(plantRow?.incoTerms)}</span>
							<span>Purch. Grp.</span>
							<span>{text(plantRow?.purchasingGroup)}</span>
							<span>Tax Code</span>
							<span>{text(plantRow?.taxCode)}</span>
							<span>Store Loc.</span>
							<span>{text(plantRow?.storeLocation)}</span>
						</div>
					</Box>
					<Box caption="For Spares">
						<div className="cpp-pdf-kv">
							<span>Inco Terms</span>
							<span>{text(spareRow?.incoTerms)}</span>
							<span>P&amp;F (%)</span>
							<span>{text(spareRow?.pfPct)}</span>
							<span>Tax Code</span>
							<span>{text(spareRow?.taxCode)}</span>
						</div>
					</Box>
				</div>

				<div className="cpp-pdf-col-mid">
					<Box caption="Justification">
						<div className="cpp-pdf-justification">
							{text(values.justification)}
						</div>
					</Box>
				</div>

				<div className="cpp-pdf-col-right">
					<Box caption="Material Cost Tracker (all value in lakhs INR)">
						<table className="cpp-pdf-table">
							<thead>
								<tr>
									<th>Model</th>
									<th>Per Machine Impact</th>
									<th>Budgeted increase in Price (Per M/c – FY16)</th>
									<th>Status YTD (FY19)</th>
									<th>Budgeted Material Cost</th>
									<th>Material Cost YTD</th>
								</tr>
							</thead>
							<tbody>
								{(costTracker.length
									? costTracker
									: [null, null, null, null]
								).map((row, index) => (
									<tr key={index}>
										<td>{text(row?.model)}</td>
										<td>{text(row?.perMachineImpact)}</td>
										<td>{text(row?.budgetedIncrease)}</td>
										<td>{text(row?.statusYtd)}</td>
										<td>{text(row?.budgetedMaterialCost)}</td>
										<td>{text(row?.materialCostYtd)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</Box>
				</div>
			</div>

			{/* ── Approval block ── */}
			<div className="cpp-pdf-row cpp-pdf-row-approvals">
				<Box caption="Initiated By" className="cpp-pdf-initiated">
					<div className="cpp-pdf-sign-grid">
						<div>
							<div className="cpp-pdf-sign-label">Proposed By:</div>
							<div className="cpp-pdf-sign-name">{text(initiatedBy)}</div>
						</div>
						<div>
							<div className="cpp-pdf-sign-label">Checked By:</div>
							{signed(checkedBy)}
						</div>
						<div>
							<div className="cpp-pdf-sign-label">Recommended By:</div>
							{signed(recommendedBy)}
						</div>
						<div>
							<div className="cpp-pdf-sign-label">Approved By:</div>
							{signed(approvedBy)}
						</div>
					</div>
				</Box>

				<Box caption="Approving Authority" className="cpp-pdf-authority">
					<div className="cpp-pdf-value">
						{text(values.workflow?.authority)}
					</div>
					<div className="cpp-pdf-sign-grid cpp-pdf-sign-grid-wide">
						<div>
							<div className="cpp-pdf-sign-label">CPP committee</div>
							{signed(committee)}
						</div>
						<div>
							<div className="cpp-pdf-sign-label">
								Approval from CPP chairman
							</div>
							{signed(chairman)}
						</div>
					</div>
				</Box>

				<Box caption="Mandatory Check List" className="cpp-pdf-checklist">
					<table className="cpp-pdf-table">
						<thead>
							<tr>
								<th>Check</th>
								<th>Yes / No / NA</th>
							</tr>
						</thead>
						<tbody>
							{[
								"1) Annualized Impact Cal.",
								"2) Model wise Impact Cal.",
								"3) ZBC Calculation",
								"4) Commodity Price Trend",
								"5) ECN attached",
								"6) Nesting Calculation",
								"7) Comparative Quote./Ana.",
							].map((item) => (
								<tr key={item}>
									<td>{item}</td>
									<td>{DASH}</td>
								</tr>
							))}
						</tbody>
					</table>
				</Box>
			</div>

			{/* ── Footer: approval dates and references ── */}
			<footer className="cpp-pdf-foot">
				<span className="cpp-pdf-foot-label">
					Approval dates and references:
				</span>
				<span>CPP</span>
				<span>MDO</span>
				<span>PFA</span>
				<span>Price Feeding</span>
				<span>Ref &amp; Date</span>
				<span>POSA Run</span>
				<span>PO applicable for PO/SA</span>
				<span className="cpp-pdf-foot-ref">{referenceNumber}</span>
			</footer>
		</article>
	);
};

export default CppPdfView;
