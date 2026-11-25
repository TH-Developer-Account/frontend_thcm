// components/CppPdfView.tsx — the CPP request drawn as the Tata Hitachi price approval sheet (page 1
// of the "WS" approval PDF). Landscape, same block order and labels, filled from the saved request.
// Nothing is generated or downloaded per view.
//
// Part rows come from the uploaded summary sheet (values.summaryParts, read by the
// server). As on the paper form, at most 5 parts are listed; the rest are in the sheet.
// Layout is compact: the attribute boxes (models, plants, price type, pricing
// condition, For Plants / For Spares) run in one row, so the justification and
// material cost tracker no longer sit next to a tall empty column.
import type { ReactNode } from "react";

import type { CppFormValues, CppPartRow } from "../types/cpp.types";

/** The columns of the sheet's part table. */
type PdfPartRow = Pick<
	CppPartRow,
	| "partNo"
	| "description"
	| "uom"
	| "existingRate"
	| "existingWef"
	| "quotedRate"
	| "quotedWef"
	| "finalRate"
	| "finalWef"
>;

const DASH = "--";
/** "For more than 5 parts, please use summary sheet" (CPP format). */
const MAX_SHEET_PARTS = 5;
const PLANTS = ["DWD", "KGP", "SPARE"] as const;
const PRICING_OPTIONS = [
	{ code: "PB00", label: "Regular" },
	{ code: "PB50", label: "Amortised" },
	{ code: "PB25", label: "One Time" },
	{ code: "PB75", label: "Provisional" },
] as const;

/** Mandatory Check List rows: sheet label + the key the answer is saved under. */
const CHECKLIST_ROWS = [
	{ key: "annualisedImpact", label: "1) Annualized Impact Cal." },
	{ key: "modelImpact", label: "2) Model wise Impact Cal." },
	{ key: "zbc", label: "3) ZBC Calculation" },
	{ key: "commodityTrend", label: "4) Commodity Price Trend" },
	{ key: "ecn", label: "5) ECN attached" },
	{ key: "nesting", label: "6) Nesting Calculation" },
	{ key: "comparativeQuote", label: "7) Comparative Quote./Ana." },
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

const text = (value?: string | number | null): string => {
	if (value === null || value === undefined) return DASH;
	const out = String(value);
	return out.trim() ? out : DASH;
};

const INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

/** A saved amount with Indian digit grouping; non-numbers are shown as typed. */
const amount = (value?: string | number | null): string => {
	const raw = text(value);
	if (raw === DASH) return DASH;
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? INR.format(parsed) : raw;
};

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

type FinancialCell = {
	actualInr?: string;
	actualPct?: string;
	annualisedInr?: string;
	annualisedPct?: string;
};

const CppPdfView = ({
	values,
	referenceNumber,
	stages,
	initiatedBy,
}: CppPdfViewProps) => {
	const effects = values.effects ?? [];
	const summaryParts = values.summaryParts ?? [];
	const sheetRows: PdfPartRow[] = summaryParts
		.slice(0, MAX_SHEET_PARTS)
		.map((part) => ({
		partNo: part.partNo,
		description: part.description,
		uom: part.uom,
		existingRate: part.existingPrice,
		existingWef: "",
		quotedRate: "",
		quotedWef: "",
		finalRate: part.newPrice,
		finalWef: part.effectiveDate,
	}));
	// Older requests typed their parts by hand; use them when there is no sheet.
	const parts: PdfPartRow[] = sheetRows.length
		? sheetRows
		: (values.parts ?? []);
	const moreParts = Math.max(0, summaryParts.length - MAX_SHEET_PARTS);
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

	const financialPlants = (values.financial?.plants ?? {}) as Record<
		string,
		FinancialCell | undefined
	>;
	const checklist = values.other?.checklist ?? {};
	const plantPrices = (values.other?.plantPrices ?? []).filter(
		(row) => row && (row.plant || row.partNumber || row.price),
	);

	const checkedBy = approversFor(stages, /^checker/i);
	const recommendedBy = approversFor(stages, /^recommender/i);
	const approvedBy = approversFor(stages, /^approver-[123]/i);
	const committee = approversFor(stages, /committee/i);
	// No authority is typed on the form: the last approval stage is the authority.
	const lastStage = [...stages]
		.filter((stage) => !/price feeding|tcs/i.test(stage.stageName ?? ""))
		.sort((a, b) => (a.stageOrder ?? 0) - (b.stageOrder ?? 0))
		.pop();
	const authority =
		values.workflow?.authority?.trim() ||
		lastStage?.stageName?.split("·").pop()?.trim() ||
		"";
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
							{(parts.length ? parts : [null]).map((part, index) => (
								<tr key={index}>
									<td>{text(part?.partNo)}</td>
									<td>{text(part?.description)}</td>
									<td>{text(part?.uom)}</td>
									<td>{amount(part?.existingRate)}</td>
									<td>{text(part?.existingWef)}</td>
									<td>{amount(part?.quotedRate)}</td>
									<td>{text(part?.quotedWef)}</td>
									<td>{amount(part?.finalRate)}</td>
									<td>{text(part?.finalWef)}</td>
								</tr>
							))}
							{moreParts > 0 ? (
								<tr>
									<td colSpan={9} className="cpp-pdf-note">
										+ {moreParts} more part{moreParts === 1 ? "" : "s"} — see
										the summary sheet ({summaryParts.length} in total)
									</td>
								</tr>
							) : null}
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
									<td>{amount(financialPlants[plant]?.actualInr)}</td>
									<td>{text(financialPlants[plant]?.actualPct)}</td>
									<td>{amount(financialPlants[plant]?.annualisedInr)}</td>
									<td>{text(financialPlants[plant]?.annualisedPct)}</td>
								</tr>
							))}
							<tr className="cpp-pdf-total">
								<td>Total</td>
								<td>{DASH}</td>
								<td>{text(values.financial?.totalActualPct)}</td>
								<td>{amount(values.approvalValues?.amount)}</td>
								<td>{text(values.financial?.totalAnnualisedPct)}</td>
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
							{(amortisation.length ? amortisation : [null]).map(
								(row, index) => (
									<tr key={index}>
										<td>{text(row?.partNo)}</td>
										<td>{amount(row?.priceInclAmort)}</td>
										<td>{dateOf(row?.cutoffDate)}</td>
										<td>{text(row?.amortQty)}</td>
										<td>{amount(row?.priceAfterAmort)}</td>
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
							{(perMachine.length ? perMachine : [null]).map(
								(row, index) => (
									<tr key={index}>
										<td>{text(row?.plant)}</td>
										<td>{text(row?.model)}</td>
										<td>{amount(row?.withAmort)}</td>
										<td>{amount(row?.withoutAmort)}</td>
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
							{(plantPrices.length ? plantPrices : [null]).map(
								(row, index) => (
									<tr key={index}>
										<td>{text(row?.plant)}</td>
										<td>{text(row?.partNumber)}</td>
										<td>{amount(row?.price)}</td>
									</tr>
								),
							)}
						</tbody>
					</table>
				</Box>
			</div>

			{/* ── Attributes: models · plants · price type · pricing · plants / spares ── */}
			<div className="cpp-pdf-row cpp-pdf-row-attrs">
				<div className="cpp-pdf-stack">
					<Box caption="Models">
						<div className="cpp-pdf-value">
							{models.length ? models.join(", ") : DASH}
						</div>
					</Box>
					<Box caption="Price Type">
						<div className="cpp-pdf-value">{text(values.priceType)}</div>
					</Box>
				</div>
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

			{/* ── Justification · material cost tracker ── */}
			<div className="cpp-pdf-row cpp-pdf-row-body">
				<Box caption="Justification">
					<div className="cpp-pdf-justification">
						{text(values.justification)}
					</div>
				</Box>
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
							{(costTracker.length ? costTracker : [null]).map(
								(row, index) => (
									<tr key={index}>
										<td>{text(row?.model)}</td>
										<td>{text(row?.perMachineImpact)}</td>
										<td>{text(row?.budgetedIncrease)}</td>
										<td>{text(row?.statusYtd)}</td>
										<td>{text(row?.budgetedMaterialCost)}</td>
										<td>{amount(row?.materialCostYtd)}</td>
									</tr>
								),
							)}
						</tbody>
					</table>
				</Box>
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
						{text(authority)}
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
							{CHECKLIST_ROWS.map((item) => (
								<tr key={item.key}>
									<td>{item.label}</td>
									<td>{text(checklist[item.key])}</td>
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
