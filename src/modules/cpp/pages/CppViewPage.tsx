import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";

import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import { Badge } from "../../../components/common/Badge";
import ReadOnlyField from "../../../components/forms/ReadOnlyField";
import SimpleViewTable, {
	type SimpleTableColumn,
} from "../../../components/ui/tables/SimpleViewTable";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { getApiErrorMessage } from "../../../utils/apiError.helper";

import { useCppDetail } from "../hooks/useCppMutations";
import { toNumber } from "../helpers/cpp.mapper";
import type { CppAttachment, CppItem } from "../types/cpp.types";

const LISTING_URL = "/cpp/listing";

const inr = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 2,
});
const plain = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 4 });
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
	day: "2-digit",
	month: "short",
	year: "numeric",
});

const money = (value: unknown): string => {
	const n = toNumber(value as string | number | null);
	return n === null ? "--" : inr.format(n);
};
const num = (value: unknown): string => {
	const n = toNumber(value as string | number | null);
	return n === null ? "--" : plain.format(n);
};
const date = (value?: string | null): string => {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFormatter.format(d);
};

const GRID = "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3";

/** Same formulas as the F02 sheet and the server roll-ups. */
const difference = (item: CppItem): number | null => {
	const existing = toNumber(item.existingPrice);
	const next = toNumber(item.newPrice);
	return existing === null || next === null ? null : next - existing;
};

const ITEM_COLUMNS: SimpleTableColumn<CppItem>[] = [
	{ key: "lineNo", header: "#", minWidth: 48, render: (i) => i.lineNo },
	{ key: "plantCode", header: "Plant", render: (i) => i.plantCode ?? "--" },
	{ key: "partNo", header: "Part No.", minWidth: 120, render: (i) => i.partNo ?? "--" },
	{ key: "description", header: "Description", minWidth: 200, render: (i) => i.description ?? "--" },
	{ key: "existingPrice", header: "Existing Price", align: "right", render: (i) => num(i.existingPrice) },
	{ key: "newPrice", header: "New Price", align: "right", render: (i) => num(i.newPrice) },
	{
		key: "difference",
		header: "Difference",
		align: "right",
		render: (i) => {
			const d = difference(i);
			return d === null ? "--" : plain.format(d);
		},
	},
	{ key: "effectiveFrom", header: "Effective From", minWidth: 110, render: (i) => date(i.effectiveFrom) },
	{ key: "receivedQty", header: "Received Qty", align: "right", render: (i) => num(i.receivedQty) },
	{ key: "abpVolume", header: "ABP Volume", align: "right", render: (i) => num(i.abpVolume) },
	{ key: "qtyPerMachine", header: "Qty / M/C", align: "right", render: (i) => num(i.qtyPerMachine) },
];

const CppViewPage = () => {
	const navigate = useNavigate();
	const { id = "" } = useParams<{ id: string }>();
	const { data: cpp, isLoading, isError, error, refetch } = useCppDetail(id);

	const attachments = useMemo(() => cpp?.attachments ?? [], [cpp]);

	const header = (
		<PageHeader
			headerText={cpp ? `CPP Request ${cpp.referenceNumber}` : "CPP Request"}
			navigation={{
				variant: "breadcrumbs",
				ariaLabel: "CPP request location",
				breadcrumbs: [
					{ label: "Home Screen", href: "/" },
					{ label: "Contract Price Procurement", href: LISTING_URL },
					{ label: cpp?.referenceNumber ?? "CPP Request" },
				],
				separator: "›",
			}}
		>
			<Button
				type="button"
				text="Back to listing"
				Icon={ArrowLeft}
				iconPosition="left"
				iconSize={16}
				appearance="standard"
				variant="outline"
				size="sm"
				onClick={() => navigate(LISTING_URL)}
			/>
			{cpp?.status === "DRAFT" ? (
				<Button
					type="button"
					text="Continue editing"
					Icon={Pencil}
					iconPosition="left"
					iconSize={16}
					size="sm"
					onClick={() => navigate(`/cpp/${cpp.id}/edit`)}
				/>
			) : null}
		</PageHeader>
	);

	if (isLoading) {
		return (
			<PageSectionLayout>
				<Card padding="spacious">
					<p role="status">Loading CPP request…</p>
				</Card>
			</PageSectionLayout>
		);
	}

	if (isError || !cpp) {
		return (
			<PageSectionLayout>
				{header}
				<Card padding="spacious">
					<div className="flex flex-col items-start gap-3">
						<p className="text-sm text-rejected" role="alert">
							{getApiErrorMessage(error, "Unable to load this CPP request.")}
						</p>
						<Button
							type="button"
							text="Retry"
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={() => void refetch()}
						/>
					</div>
				</Card>
			</PageSectionLayout>
		);
	}

	return (
		<PageSectionLayout>
			{header}

			<Card
				title={cpp.title?.trim() || "Untitled request"}
				subtitle={`${cpp.formatVersion} · Last updated ${date(cpp.updated_at)}`}
				actions={<Badge status={cpp.status} />}
			>
				<div className={GRID}>
					<ReadOnlyField label="Reference Number" value={cpp.referenceNumber} />
					<ReadOnlyField label="Initiated By" value={cpp.initiatedBy?.name} />
					<ReadOnlyField label="Created On" value={date(cpp.created_at)} />
				</div>
			</Card>

			<Card
				sections={[
					{
						id: "classification",
						title: "Request details",
						children: (
							<div className={GRID}>
								<ReadOnlyField label="Material Category" value={cpp.materialCategory} />
								<ReadOnlyField label="Request Type" value={cpp.requestType} />
								<ReadOnlyField label="Reason for Price Update" value={cpp.reasonCode} />
								<ReadOnlyField label="Effect" value={cpp.effectQcd.join(", ")} />
								<ReadOnlyField label="Pricing Condition" value={cpp.pricingCondition} />
								<ReadOnlyField label="Price Type" value={cpp.priceType} />
								<ReadOnlyField label="Plants" value={cpp.plantCodes.join(", ")} />
								<ReadOnlyField label="Models" value={cpp.models} />
							</div>
						),
					},
					{
						id: "supplier",
						title: "Supplier",
						children: (
							<div className={GRID}>
								<ReadOnlyField label="Supplier Code" value={cpp.supplierCode} />
								<ReadOnlyField label="Supplier Name" value={cpp.supplierName} />
								<span />
								<ReadOnlyField label="Existing Supplier Code" value={cpp.existingSupplierCode} />
								<ReadOnlyField label="Existing Supplier Name" value={cpp.existingSupplierName} />
							</div>
						),
					},
					{
						id: "items",
						title: "Price details",
						subtitle: `${cpp.itemCount} line${cpp.itemCount === 1 ? "" : "s"}`,
						children: (
							<SimpleViewTable<CppItem>
								ariaLabel="CPP price lines"
								data={cpp.items}
								columns={ITEM_COLUMNS}
								getRowId={(item) => item.id}
								maxHeight="520px"
								emptyTitle="No price lines added"
								emptyDescription="This request has no part lines yet."
							/>
						),
					},
					{
						id: "impact",
						title: "Impact summary",
						children: (
							<div className={GRID}>
								<ReadOnlyField label="Highest Part Value" value={money(cpp.maxPartValue)} />
								<ReadOnlyField label="Annualised Value" value={money(cpp.annualisedValue)} />
								<ReadOnlyField
									label="Max Price Variation"
									value={
										toNumber(cpp.maxVariationPct) === null
											? "--"
											: `${plain.format(toNumber(cpp.maxVariationPct) as number)} %`
									}
								/>
								<ReadOnlyField label="Actual Impact" value={money(cpp.actualImpact)} />
								<ReadOnlyField label="Annualised Impact" value={money(cpp.annualisedImpact)} />
							</div>
						),
					},
					{
						id: "justification",
						title: "Justification",
						children: (
							<ReadOnlyField value={cpp.justification} valueClassName="whitespace-pre-wrap" />
						),
					},
					{
						id: "attachments",
						title: "Attachments",
						subtitle: `${attachments.length} file${attachments.length === 1 ? "" : "s"}`,
						children: (
							<SimpleViewTable<CppAttachment>
								ariaLabel="CPP attachments"
								data={attachments}
								getRowId={(a) => a.id}
								columns={[
									{ key: "type", header: "Type", render: (a) => a.type },
									{
										key: "size",
										header: "Size",
										align: "right",
										render: (a) => `${Math.max(1, Math.round(a.size / 1024))} KB`,
									},
									{ key: "uploadedAt", header: "Uploaded On", render: (a) => date(a.uploadedAt) },
								]}
								fileColumn={{
									header: "File",
									accessor: (a) => ({ name: a.fileName, url: a.url, mimeType: a.mimeType }),
								}}
								emptyTitle="No attachments"
								emptyDescription="No supporting documents were uploaded."
							/>
						),
					},
					// Added with the workflow: approval workflow, comments, audit trail
					// (ApprovalWorkflowTableContent, CommentsSection, AuditLogSection).
				]}
			/>
		</PageSectionLayout>
	);
};

export default CppViewPage;
