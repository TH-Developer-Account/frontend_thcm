import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";

import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import { Badge } from "../../../components/common/Badge";
import ReadOnlyField from "../../../components/forms/ReadOnlyField";
import SimpleViewTable from "../../../components/ui/tables/SimpleViewTable";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { getApiErrorMessage } from "../../../utils/apiError.helper";

import { useCppDetail } from "../hooks/useCppMutations";
import { mimeFromName, toNumber } from "../helpers/cpp.mapper";
import type { CppAttachment, CppSectionKey } from "../types/cpp.types";
import { CPP_CATEGORY_LABELS, CPP_STATUS } from "../utils/cpp.constants";
import { CPP_ATTACHMENTS, getCondition } from "../utils/cpp.utils";
import { ClipboardClock } from "lucide-react";
import { CardEmpty } from "../../../components/ui/CardSkeleton";
import { useAuth } from "../../../context/Auth/useAuth";
import {
	ApprovalWorkflowTableContent,
	getWorkflowApproverData,
} from "../../workflows";

const LISTING_URL = "/cpp/listing";

const inr = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 2,
});
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
	day: "2-digit",
	month: "short",
	year: "numeric",
});

const money = (value: unknown): string => {
	const n = toNumber(value as string | number | null);
	return n === null ? "--" : inr.format(n);
};
const date = (value?: string | null): string => {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFormatter.format(d);
};
const str = (value: unknown): string => {
	if (Array.isArray(value)) return value.join(", ") || "--";
	return typeof value === "string" && value.trim() ? value : "--";
};

const GRID = "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3";

type Supplier = { name?: string; code?: string };
const supplierText = (s: unknown): string => {
	const { name, code } = (s ?? {}) as Supplier;
	return [code, name].filter(Boolean).join(" · ") || "--";
};

const attachmentLabel = (type: string): string =>
	type === "purchasingFile"
		? "Purchasing details (Excel)"
		: (CPP_ATTACHMENTS.find((item) => item.key === type)?.label ?? type);

const CppViewPage = () => {
	const navigate = useNavigate();
	const { id = "" } = useParams<{ id: string }>();
	const { data: cpp, isLoading, isError, error, refetch } = useCppDetail(id);

	const attachments = useMemo(() => cpp?.attachments ?? [], [cpp]);
	const section = (key: CppSectionKey): Record<string, unknown> =>
		cpp?.sections.find((s) => s.key === key)?.data ?? {};

	const { user } = useAuth();
	const workflowData = useMemo(
		() => getWorkflowApproverData((cpp as any)?.activeWorkflow ?? null, user),
		[cpp, user],
	);
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
			{cpp?.status === CPP_STATUS.DRAFT ? (
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

	const basic = section("basic");
	const purchasing = section("purchasing");
	const master = section("master");
	const other = section("other");
	const workflow = (basic.workflow ?? {}) as Record<string, unknown>;
	const suppliers = (purchasing.suppliers ?? {}) as Record<string, unknown>;

	return (
		<PageSectionLayout>
			{header}

			<Card
				title={getCondition(cpp.condition ?? "")?.label ?? "CPP request"}
				subtitle={`Last updated ${date(cpp.updated_at)}`}
				actions={<Badge status={cpp.status} />}
			>
				<div className={GRID}>
					<ReadOnlyField label="Reference Number" value={cpp.referenceNumber} />
					<ReadOnlyField
						label="Category"
						value={CPP_CATEGORY_LABELS[cpp.category ?? ""] ?? cpp.category}
					/>
					<ReadOnlyField label="Plant" value={cpp.plant} />
					<ReadOnlyField label="Created On" value={date(cpp.created_at)} />
					<ReadOnlyField label="Submitted On" value={date(cpp.submittedAt)} />
				</div>
			</Card>

			<Card
				sections={[
					{
						id: "basic",
						title: "Basic details",
						children: (
							<div className={GRID}>
								<ReadOnlyField
									label="Material Type"
									value={str(basic.materialType)}
								/>
								<ReadOnlyField label="Reason" value={str(basic.reason)} />
								<ReadOnlyField label="Effect" value={str(basic.effects)} />
								<ReadOnlyField
									label="Price Type"
									value={str(basic.priceType)}
								/>
								<ReadOnlyField
									label="Pricing Condition"
									value={str(workflow.pricingCondition)}
								/>
								<ReadOnlyField label="Models" value={str(workflow.models)} />
								<ReadOnlyField
									label="Applicable Plants"
									value={str(workflow.plants)}
								/>
								<ReadOnlyField
									label="Initiation Date"
									value={date(str(basic.initiationDate))}
								/>
							</div>
						),
					},
					{
						id: "justification",
						title: "Justification",
						children: (
							<ReadOnlyField
								value={str(basic.justification)}
								valueClassName="whitespace-pre-wrap"
							/>
						),
					},
					{
						id: "purchasing",
						title: "Purchasing details",
						children: (
							<div className={GRID}>
								<ReadOnlyField
									label="Existing Supplier"
									value={supplierText(suppliers.existing)}
								/>
								<ReadOnlyField
									label="Other Supplier"
									value={supplierText(suppliers.other)}
								/>
								<ReadOnlyField
									label="Recommended Supplier"
									value={supplierText(suppliers.recommended)}
								/>
								<ReadOnlyField
									label="Highest Value per Part"
									value={money(cpp.maxPartValue)}
								/>
								<ReadOnlyField
									label="Highest Price Variation"
									value={
										cpp.maxVariationPct === null
											? "--"
											: `${cpp.maxVariationPct} %`
									}
								/>
								<ReadOnlyField
									label="Annualised Value"
									value={money(cpp.annualisedValue)}
								/>
								<ReadOnlyField
									label="Annualised Impact"
									value={money(cpp.annualisedImpact)}
								/>
								<ReadOnlyField
									label="Actual Impact"
									value={money(cpp.actualImpact)}
								/>
							</div>
						),
					},
					{
						id: "master",
						title: "Master data",
						children: (
							<div className={GRID}>
								<ReadOnlyField
									label="Material Group"
									value={str(master.materialGroup)}
								/>
								<ReadOnlyField
									label="Material Type"
									value={str(master.materialType)}
								/>
								<ReadOnlyField
									label="Purchasing Group"
									value={str(master.purchasingGroup)}
								/>
								<ReadOnlyField
									label="Inco Terms"
									value={str(master.incoTerms)}
								/>
								<ReadOnlyField label="Tax Code" value={str(master.taxCode)} />
								<ReadOnlyField
									label="Store Location"
									value={str(master.storeLocation)}
								/>
								<ReadOnlyField
									label="Valid From"
									value={date(str(master.validFrom))}
								/>
								<ReadOnlyField
									label="Update Source List"
									value={str(master.updateSourceList)}
								/>
								<ReadOnlyField label="Note" value={str(master.note)} />
							</div>
						),
					},
					{
						id: "other",
						title: "Other data",
						children: (
							<ReadOnlyField
								label="Remarks"
								value={str(other.remarks)}
								valueClassName="whitespace-pre-wrap"
							/>
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
									{
										key: "type",
										header: "Document",
										render: (a) => attachmentLabel(a.type),
									},
									{
										key: "uploadedAt",
										header: "Uploaded On",
										render: (a) => date(a.uploadedAt),
									},
								]}
								fileColumn={{
									header: "File",
									accessor: (a) => ({
										name: a.fileName,
										url: a.url,
										mimeType: mimeFromName(a.fileName),
									}),
								}}
								emptyTitle="No attachments"
								emptyDescription="No supporting documents were uploaded."
							/>
						),
					},
					// Added with the workflow: approval workflow, comments, audit trail.
				]}
			/>
			<Card title="Approval workflow" size="small">
				{workflowData.stages.length > 0 ? (
					<ApprovalWorkflowTableContent
						stages={workflowData.stages}
						showEmptyState={false}
					/>
				) : (
					<CardEmpty
						title="No workflow yet"
						description="This request has not been submitted."
						Icon={ClipboardClock}
					/>
				)}
			</Card>
		</PageSectionLayout>
	);
};

export default CppViewPage;
