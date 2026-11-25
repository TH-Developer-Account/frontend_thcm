import { useEffect, useRef, useState, type FormEvent } from "react";

import Button from "../components/common/Button";
import Card from "../components/common/Card";
import FormInput from "../components/forms/FormInput";
import FormValidationSummary from "../components/forms/FormValidationSummary";
import ReadOnlyField, { ReadOnlyGrid } from "../components/forms/ReadOnlyField";
import Pagination from "../components/common/Pagination";
import { Alert } from "../components/common/Alert";
import ApprovalActionsBar from "../components/ui/ApprovalActionsBar";
import { ReasonActionModal, type ReasonActionMode } from "../components/ui/ReasonActionModal";
import PendingOnStatus from "../components/common/PendingOnStatus";
import NextStepsPanel from "../components/ui/NextStepsPanel";
import FormHeader from "../components/ui/FormHeader";
import DateRangeSection from "../components/ui/DateRangeSection";
import OtpInput from "../components/forms/OtpInput";
import PhoneInput from "../components/forms/PhoneInput";
import Radio from "../components/forms/Radio";
import Checkbox from "../components/forms/Checkbox";
import MultiSelectInput from "../components/forms/MultiSelectInput";
import UserAsyncSelect from "../components/forms/AsyncSelect";
import PincodeAsyncSelect from "../components/forms/PincodeAsyncSelect";
import HelperTooltip from "../components/common/HelperTooltip";
import { ManagementTable, ManagementIdentityCell, ManagementAvatarGroup, ManagementValueCell } from "../components/ui/tables/ManagementTable";
import TableListing from "../components/ui/tables/DataTable/TableListing";
import DataTableSkeleton from "../components/ui/tables/Skeletons/DataTableSkeleton";
import NavigateButton from "../components/common/NavigateButton";
import { ThemeToggle } from "../components/common/ThemeToggle";
import Loader from "../components/ui/Loader";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { Accordion } from "../components/common/Accordion";
import SectionAccordion from "../components/common/SectionAccordion";
import SectionHeader from "../components/common/SectionHeader";
import EditableCard from "../components/common/EditableCard";
import ActionMenu from "../components/common/ActionMenu";
import FilterDropdown from "../components/common/FilterDropdown";
import Popover from "../components/common/Popover";
import Toggle from "../components/common/Toggle";
import ThreeWayToggle from "../components/common/ThreeWayToggle";
import DatePickerInput from "../components/common/DatePickerInput";
import { SearchInput } from "../components/forms/SearchInput";
import Avatar from "../components/common/Avatar";
import { Building2, Copy as CopyIcon, Eye as EyeIcon, LayoutGrid, List, Pencil, Trash2 as TrashIcon, Rows3 } from "lucide-react";
import { Modal } from "../components/common/Modal";
import { FileUploadField } from "../components/ui/FileUpload/FileUploadField";
import type { FileUploadValue } from "../components/ui/FileUpload/fileUpload.types";
import CommentsSection from "../components/ui/comments/CommentsSection";
import type { CommentApiAdapter, CommentItem } from "../components/ui/comments/comment.types";
import { CardEmpty } from "../components/ui/CardSkeleton";
import { MessageCircle, Paperclip } from "lucide-react";
import { Badge } from "../components/common/Badge";
import { useToast } from "../context/Auth/AuthContext";
import AuditLogSection from "../components/ui/audit/AuditLogSection";
import type { AuditApiAdapter, AuditLogEntry } from "../components/ui/audit/audit.types";
import { MetricCard, MetricGrid } from "../components/ui/MetricCard";
import WorkflowStageList, { type WorkflowStageItem } from "../components/ui/WorkflowStageList";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable, { type DataTableColumnMeta } from "../components/ui/tables/DataTable/DataTable";
import SimpleViewTable from "../components/ui/tables/SimpleViewTable";
import TabsBar from "../components/common/TabsBar";
import { PageHeader } from "../components/ui/PageHeader";
import SectionNav from "../components/ui/SectionNav";
import StepProgress, { type StepProgressStep } from "../components/ui/StepProgress";
import SelectInput from "../components/forms/SelectInput";
import TextareaInput from "../components/forms/TextareaInput";
import { focusFirstInvalidField } from "../utils/focusField";

/*
 * DEV-ONLY design-system playground.
 * Route: /dev/design-system (registered only when import.meta.env.DEV).
 * Uses the real shared components and CSS. Every value here is sample data
 * for testing styles; nothing is sent to an API.
 */

type Option = { label: string; value: string };

const PLANTS: Option[] = [
	{ label: "DWD", value: "DWD" },
	{ label: "KGP", value: "KGP" },
	{ label: "Spares", value: "Spares" },
];

const FIELD_ORDER = ["category", "vendorCode", "plant", "justification"];

type PartRow = {
	id: string;
	part: string;
	description: string;
	supplier: string;
	oldPrice: number;
	newPrice: number;
	volume: number;
};

const PART_ROWS: PartRow[] = [
	{ id: "1", part: "4436221", description: "Bucket tooth adapter, forged, for EX 200 / EX 210 standard bucket", supplier: "Bharat Forge", oldPrice: 1840, newPrice: 1912, volume: 4200 },
	{ id: "2", part: "4652110", description: "Track link assembly", supplier: "Sundram Fasteners", oldPrice: 12650, newPrice: 13020, volume: 960 },
	{ id: "3", part: "YN52V01016", description: "Hydraulic hose, high pressure, 1/2 inch, 1.2 m with crimped fittings both ends", supplier: "Parker Hannifin", oldPrice: 2310, newPrice: 2265, volume: 3100 },
	{ id: "4", part: "4689573", description: "Idler bracket", supplier: "Amtek Auto", oldPrice: 5420, newPrice: 5420, volume: 1150 },
	{ id: "5", part: "9195291", description: "Swing bearing seal kit", supplier: "NOK Asia", oldPrice: 890, newPrice: 934, volume: 2600 },
];

const SAMPLE_STATUSES = [
	"DRAFT", "SUBMITTED", "INITIATED", "RECOMMENDED", "PENDING", "SENT_FOR_APPROVAL",
	"CLARIFICATION_REQUESTED", "RESUBMITTED", "APPROVED", "REJECTED", "CANCELLED", "CLOSED", "ON_HOLD",
];

const SAMPLE_STAGES: WorkflowStageItem[] = [
	{
		id: "s1", name: "Plant SCM review", status: "completed", strategy: "sequential",
		approvers: [{ id: "a1", name: "Arun Kumar", role: "SCM Manager, KGP", status: "approved", actedAt: "21 Nov 2026, 11:05 am", remarks: "Volumes confirmed for FY27." }],
	},
	{
		id: "s2", name: "Price panel committee", status: "current", strategy: "parallel",
		approvers: [
			{ id: "a2", name: "Priya Nair", role: "Head of Purchase", status: "approved", actedAt: "24 Nov 2026, 9:40 am" },
			{ id: "a3", name: "Monica R", role: "Finance Controller", status: "pending", isCurrentUser: true },
			{ id: "a4", name: "S. Iyer", role: "Cost consultant", status: "pending", external: true },
		],
	},
	{
		id: "s3", name: "MD approval", status: "pending", strategy: "any",
		approvers: [{ id: "a5", name: "R. Mehta", role: "Managing Director", status: "waiting" }],
	},
];

const daysAgo = (days: number, hour: number, minute: number) => {
	const d = new Date();
	d.setDate(d.getDate() - days);
	d.setHours(hour, minute, 0, 0);
	return d.toISOString();
};

const actor = (first: string, last: string) => ({ id: first, first_name: first, last_name: last });

const SAMPLE_AUDIT: AuditLogEntry[] = [
	{ id: "e1", action: "APPROVED", actor: actor("Priya", "Nair"), stageName: "Price panel committee", createdAt: daysAgo(0, 9, 40), metadata: { remarks: "Revised price is within the indexation band agreed in the 2025 contract. Approved on that basis; please attach the supplier's updated quotation before MD review." } },
	{ id: "e2", action: "RESUBMITTED", actor: actor("Monica", "R"), createdAt: daysAgo(1, 17, 12) },
	{ id: "e3", action: "CLARIFICATION_REQUESTED", actor: actor("Arun", "Kumar"), stageName: "Plant SCM review", createdAt: daysAgo(1, 10, 3), metadata: { remarks: "Annual volume for part 4652110 doesn't match the FY27 plan." } },
	{ id: "e4", action: "REJECTED", actor: actor("R", "Mehta"), createdAt: daysAgo(6, 15, 30), metadata: { previousStatus: "PENDING", currentStatus: "REJECTED", remarks: "Earlier draft superseded." } },
	{ id: "e5", action: "CREATED", actor: actor("Monica", "R"), createdAt: daysAgo(6, 9, 2) },
];

const remoteFile = (name: string, type: string, size: string): FileUploadValue => ({
	id: name, file: null, url: "data:text/plain,sample", name, type, size: 1, extension: name.split(".").pop() ?? "",
	sizeLabel: size, isLocal: false,
});

const SAMPLE_COMMENTS: CommentItem[] = [
	{ id: "c1", message: "Please attach the supplier's updated quotation before MD review.", actor: { id: "u2", first_name: "Priya", last_name: "Nair" }, createdAt: daysAgo(0, 9, 42) },
	{ id: "c2", message: "Attached. Volumes are per the FY27 plan shared by SCM.", actor: { id: "me", first_name: "Monica", last_name: "R" }, createdAt: daysAgo(0, 10, 5) },
];

const PHONE_CODES = [{ code: "+91", label: "India (+91)" }, { code: "+81", label: "Japan (+81)" }, { code: "+971", label: "UAE (+971)" }];

const inr = (value: number) =>
	`₹ ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const setRootAttr = (name: string, value: string | null) => {
	const root = document.documentElement;
	if (value) root.setAttribute(name, value);
	else root.removeAttribute(name);
};

export default function DesignSystemPlayground() {
	const formRef = useRef<HTMLFormElement>(null);

	// ---- global controls (theme, brand, font, type scale) ----
	const [brand, setBrand] = useState("tata-hitachi");
	const [mode, setMode] = useState(
		() => document.documentElement.getAttribute("data-theme") ?? "light",
	);
	const [font, setFont] = useState("outfit");
	const [scale, setScale] = useState(0.875);

	useEffect(() => setRootAttr("data-brand", brand === "tata-hitachi" ? null : brand), [brand]);
	useEffect(() => setRootAttr("data-theme", mode), [mode]);
	useEffect(() => setRootAttr("data-font", font === "outfit" ? null : font), [font]);
	useEffect(() => {
		document.documentElement.style.setProperty("--type-scale", String(scale));
	}, [scale]);

	// Restore the app's real settings when leaving the playground.
	useEffect(() => {
		const previousTheme = document.documentElement.getAttribute("data-theme");
		return () => {
			setRootAttr("data-theme", previousTheme);
			setRootAttr("data-brand", null);
			setRootAttr("data-font", null);
			document.documentElement.style.removeProperty("--type-scale");
		};
	}, []);

	// ---- sample form (local validation only) ----
	const [values, setValues] = useState({
		category: "",
		vendorCode: "",
		plant: null as Option | null,
		amount: "99,00,000",
		justification: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitCount, setSubmitCount] = useState(0);
	const [gridVariant, setGridVariant] = useState<"plain" | "boxed">("plain");
	const [wizardStep, setWizardStep] = useState(3);
	const [markInvalid, setMarkInvalid] = useState(true);
	const [tab, setTab] = useState<"overview" | "lines" | "history">("overview");
	const [softTab, setSoftTab] = useState<"all" | "pending" | "approved">("pending");
	const [section, setSection] = useState<"basic" | "purchasing" | "financial" | "attachments" | "workflow">("basic");
	const [pageIndex, setPageIndex] = useState(2);
	const [pageSize, setPageSize] = useState(10);
	const [parts, setParts] = useState<PartRow[]>(PART_ROWS);
	const [tableState, setTableState] = useState<"data" | "loading" | "empty" | "error">("data");
	const [striped, setStriped] = useState(true);
	const [compact, setCompact] = useState(false);
	const [auditFails, setAuditFails] = useState(false);
	const [auditKey, setAuditKey] = useState(0);
	const { showToast } = useToast();
	const [modalOpen, setModalOpen] = useState(false);
	const [toggleOn, setToggleOn] = useState(true);
	const [reasonMode, setReasonMode] = useState<ReasonActionMode | null>(null);
	const [otp, setOtp] = useState("");
	const [phone, setPhone] = useState("9876543210");
	const [radioValue, setRadioValue] = useState("domestic");
	const [agree, setAgree] = useState(false);
	const [models, setModels] = useState<Option[]>([{ label: "EX 200", value: "EX 200" }]);
	const [mgmtSelected, setMgmtSelected] = useState<string[]>([]);
	const [view, setView] = useState<"grid" | "list" | "rows">("list");
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState<{ status: string[]; plant: string[]; from: string; to: string }>({ status: ["PENDING"], plant: [], from: "", to: "" });
	const [dateValue, setDateValue] = useState<Date | undefined>(undefined);
	const [vendor, setVendor] = useState({ legalName: "Bharat Forge Ltd", gstin: "29ABCDE1234F1Z5", email: "vendor.accounts@example.com" });
	const [singleFile, setSingleFile] = useState<FileUploadValue | null>(null);
	const [quoteFile, setQuoteFile] = useState<FileUploadValue | null>(remoteFile("supplier-quotation-FY27.pdf", "application/pdf", "1.2 MB"));
	const [photos, setPhotos] = useState<FileUploadValue[]>([remoteFile("event-photo-1.pdf", "application/pdf", "820 KB"), remoteFile("attendance-sheet.pdf", "application/pdf", "410 KB")]);
	const [commentsFail, setCommentsFail] = useState(false);
	const [commentsKey, setCommentsKey] = useState(0);
	const [comments, setComments] = useState<CommentItem[]>(SAMPLE_COMMENTS);

	const commentApi: CommentApiAdapter = {
		getComments: () =>
			new Promise((resolve, reject) =>
				setTimeout(() => (commentsFail ? reject(new Error("Network Error")) : resolve(comments)), 250),
			),
		createComment: ({ payload }) =>
			new Promise((resolve) =>
				setTimeout(() => {
					const item: CommentItem = { id: `c${Date.now()}`, message: payload.message, actor: { id: "me", first_name: "Monica", last_name: "R" }, createdAt: new Date().toISOString() };
					setComments((c) => [...c, item]);
					resolve({ data: item, message: "Comment created successfully" });
				}, 200),
			),
	};

	const auditApi: AuditApiAdapter = {
		getAuditLog: () =>
			new Promise((resolve, reject) =>
				setTimeout(
					() => (auditFails ? reject(new Error("Request failed with status code 502")) : resolve(SAMPLE_AUDIT)),
					300,
				),
			),
	};

	const impact = (row: PartRow) => (row.newPrice - row.oldPrice) * row.volume;
	const totalImpact = parts.reduce((sum, row) => sum + impact(row), 0);

	const partColumns: ColumnDef<PartRow>[] = [
		{ accessorKey: "part", header: "Part number", meta: { emphasis: true } satisfies DataTableColumnMeta, footer: () => "Total" },
		{ accessorKey: "description", header: "Description", meta: { truncate: true } satisfies DataTableColumnMeta, enableSorting: false },
		{ accessorKey: "supplier", header: "Supplier" },
		{ accessorKey: "oldPrice", header: "Current price", cell: (c) => inr(c.getValue<number>()), meta: { numeric: true } satisfies DataTableColumnMeta },
		{
			accessorKey: "newPrice",
			header: "Proposed price",
			enableSorting: false,
			meta: { numeric: true, editable: true } satisfies DataTableColumnMeta,
			cell: ({ row }) => (
				<input
					className="form-input"
					style={{ textAlign: "right", minHeight: "var(--control-height-sm)" }}
					inputMode="decimal"
					aria-label={`Proposed price for ${row.original.part}`}
					value={row.original.newPrice}
					onChange={(e) => {
						const next = Number(e.target.value.replace(/[^0-9.]/g, "")) || 0;
						setParts((rows) => rows.map((r) => (r.id === row.original.id ? { ...r, newPrice: next } : r)));
					}}
				/>
			),
		},
		{ accessorKey: "volume", header: "Annual volume", cell: (c) => c.getValue<number>().toLocaleString("en-IN"), meta: { numeric: true } satisfies DataTableColumnMeta, footer: () => parts.reduce((s, r) => s + r.volume, 0).toLocaleString("en-IN") },
		{
			id: "impact",
			header: "Annualised impact",
			accessorFn: impact,
			cell: (c) => {
				const v = c.getValue<number>();
				return <span style={{ color: v > 0 ? "var(--color-status-rejected-text)" : v < 0 ? "var(--color-status-approved-text)" : undefined }}>{v > 0 ? "+" : ""}{inr(v)}</span>;
			},
			meta: { numeric: true, emphasis: true } satisfies DataTableColumnMeta,
			footer: () => `${totalImpact > 0 ? "+" : ""}${inr(totalImpact)}`,
		},
	];

	const wizardSteps: StepProgressStep[] = [
		{ id: 1, label: "Basic details" },
		{ id: 2, label: "Purchasing", status: markInvalid ? "invalid" : undefined },
		{ id: 3, label: "Financial impact", description: "Enter the annualised value and the price change for each part." },
		{ id: 4, label: "Amortisation", status: "skipped" },
		{ id: 5, label: "Review & submit" },
	].map((s) => (s.id === wizardStep && s.status !== "skipped" ? { ...s, status: undefined } : s)) as StepProgressStep[];

	const validate = () => {
		const next: Record<string, string> = {};
		if (!values.category.trim()) next.category = "Category is required.";
		if (!/^\d{6}$/.test(values.vendorCode)) next.vendorCode = "Vendor code must be 6 digits.";
		if (!values.plant) next.plant = "Select a plant.";
		if (values.justification.trim().length < 50)
			next.justification = "Enter at least 50 characters.";
		return next;
	};

	const onSubmit = (event: FormEvent) => {
		event.preventDefault();
		const next = validate();
		setErrors(next);
		setSubmitCount((n) => n + 1);
		if (Object.keys(next).length) focusFirstInvalidField(formRef.current, next, FIELD_ORDER);
	};

	const amountWarning =
		values.amount.replace(/\D/g, "").length >= 7
			? "Higher than usual for this category. Check before submitting."
			: undefined;

	return (
		<div className="page-section-layout">
			<div className="page-section-layout-inner" style={{ gap: "var(--space-4)" }}>
				<header className="page-header">
					<h1 className="page-header-title">Design system playground</h1>
					<p className="page-header-subtitle">
						Dev-only page. Sample data, no API calls. Use the controls to test themes, fonts and text size.
					</p>
				</header>

				{/* -------- Controls -------- */}
				<Card title="Controls" padding="default">
					<div className="saas-form-grid saas-form-grid-4">
						<SelectInput<Option>
							inputId="pg-brand"
							label="Brand theme"
							options={[
								{ label: "Tata Hitachi (default)", value: "tata-hitachi" },
								{ label: "Pink & violet (test)", value: "pink-violet" },
							]}
							value={{ label: brand === "tata-hitachi" ? "Tata Hitachi (default)" : "Pink & violet (test)", value: brand }}
							onChange={(o) => o && setBrand(o.value)}
							isSearchable={false}
						/>
						<SelectInput<Option>
							inputId="pg-mode"
							label="Light / dark"
							options={[
								{ label: "Light", value: "light" },
								{ label: "Dark", value: "dark" },
							]}
							value={{ label: mode === "light" ? "Light" : "Dark", value: mode }}
							onChange={(o) => o && setMode(o.value)}
							isSearchable={false}
						/>
						<SelectInput<Option>
							inputId="pg-font"
							label="Font"
							options={[
								{ label: "Outfit (default)", value: "outfit" },
								{ label: "Arial / Helvetica", value: "arial" },
							]}
							value={{ label: font === "outfit" ? "Outfit (default)" : "Arial / Helvetica", value: font }}
							onChange={(o) => o && setFont(o.value)}
							isSearchable={false}
						/>
						<div className="form-field">
							<div className="form-label-row">
								<label className="form-label" htmlFor="pg-scale">
									Text size (--type-scale): {scale.toFixed(3)}
								</label>
							</div>
							<input
								id="pg-scale"
								type="range"
								min={0.75}
								max={1}
								step={0.025}
								value={scale}
								onChange={(e) => setScale(Number(e.target.value))}
								style={{ accentColor: "var(--color-brand)" }}
							/>
						</div>
					</div>
				</Card>

				{/* -------- Batch 4: form states -------- */}
				<Card
					title="Form states"
					subtitle="Click into fields to see the active state. Submit empty to see the summary and jump-to-field."
					padding="default"
				>
					<form ref={formRef} noValidate onSubmit={onSubmit}>
						<div style={{ display: "grid", gap: "var(--space-4)" }}>
							<FormValidationSummary
								errors={errors}
								scopeRef={formRef}
								focusKey={submitCount}
								fields={[
									{ name: "category", label: "Category" },
									{ name: "vendorCode", label: "Vendor code" },
									{ name: "plant", label: "Plant" },
									{ name: "justification", label: "Justification" },
								]}
							/>

							<div className="saas-form-grid saas-form-grid-3">
								<FormInput
									id="category"
									name="category"
									label="Category"
									required
									helperText="Tooltip help: the commodity category of the part."
									value={values.category}
									error={errors.category}
									onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
								/>
								<FormInput
									id="vendorCode"
									name="vendorCode"
									label="Vendor code"
									required
									placeholder="6 digits"
									value={values.vendorCode}
									error={errors.vendorCode}
									onChange={(e) => setValues((v) => ({ ...v, vendorCode: e.target.value }))}
								/>
								<SelectInput<Option>
									inputId="plant"
									name="plant"
									label="Plant"
									required
									options={PLANTS}
									value={values.plant}
									error={errors.plant}
									onChange={(o) => setValues((v) => ({ ...v, plant: o ?? null }))}
								/>
								<FormInput
									id="amount"
									name="amount"
									label="Annualised value (₹)"
									helperText="Warning appears at 7+ digits (sample rule)."
									isTooltip={false}
									value={values.amount}
									warning={amountWarning}
									onChange={(e) => setValues((v) => ({ ...v, amount: e.target.value }))}
								/>
								<FormInput id="remarks" name="remarks" label="Internal remarks" optional />
								<FormInput id="locked" name="locked" label="Plant code (disabled)" disabled value="KGP" readOnly />
								<FormInput id="viewMode" label="Submitted value (view mode)" mode="view" value="Casting & Forging" />
								<FormInput id="ok" name="ok" label="Validated field" value="P85850" success readOnly />
							</div>

							<TextareaInput
								id="justification"
								name="justification"
								label="Justification"
								required
								value={values.justification}
								error={errors.justification}
								onChange={(e) => setValues((v) => ({ ...v, justification: e.target.value }))}
							/>

							<div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
								<Button
									type="button"
									variant="secondary"
									onClick={() => {
										setErrors({});
										setSubmitCount(0);
									}}
								>
									Reset errors
								</Button>
								<Button type="submit" variant="brand">
									Submit
								</Button>
							</div>
						</div>
					</form>
				</Card>

				{/* -------- Batch 12: last shared components -------- */}
				<Card title="Approval flow, inputs & listings" subtitle="Batch 12: the remaining shared components." padding="default">
					<div style={{ display: "grid", gap: "var(--space-8)" }} id="pg-b12">
						<section style={{ display: "grid", gap: "var(--space-4)" }} id="pg-approval">
							<FormHeader title="Approval actions" Icon={ClipboardCheck} />
							<div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 22rem), 1fr))", alignItems: "start" }}>
								<ApprovalActionsBar variant="approver" layout="card" eyebrow="Awaiting your approval" title="Price panel committee" subtitle="Your decision moves this request to MD approval." canApprove canClarify onApprove={() => undefined} onClarify={() => undefined} />
								<div style={{ display: "grid", gap: "var(--space-3)" }}>
									<NextStepsPanel steps={[{ title: "Plant SCM review", description: "Checks volumes against the FY27 plan." }, { title: "Price panel committee", description: "Approves the revised price." }, { title: "MD approval", description: "Final sign-off." }]} />
									<div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center" }}>
										<span className="text-sm text-fg-secondary">Pending on:</span>
										<PendingOnStatus status="PENDING" pendingOn={{ role: "APPROVER", approvers: [{ id: "1", name: "Priya Nair" }, { id: "2", name: "Monica R" }, { id: "3", name: "S. Iyer" }] }} maxVisible={2} />
										<PendingOnStatus status="CLARIFY" pendingOn={{ role: "PROPOSER" }} />
										<PendingOnStatus status="APPROVED" pendingOn={{ role: "NONE", outcome: "APPROVED" }} />
									</div>
									<DateRangeSection fromDate="2026-12-01" toDate="2026-12-14" />
								</div>
							</div>
							<ApprovalActionsBar variant="approver" canApprove canClarify approveDisabled approveDisabledReason="Approve every line item first." onApprove={() => undefined} onClarify={() => undefined} showBack onBack={() => undefined} />
							<ApprovalActionsBar variant="proposer" showBack onBack={() => undefined} canCancel onCancel={() => undefined} canSaveDraft onSaveDraft={() => undefined} canSubmit onSubmit={() => undefined} />
							<div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
								<Button type="button" size="sm" variant="secondary" appearance="standard" text="Open clarify dialog" onClick={() => setReasonMode("clarify-workflow")} />
								<NavigateButton text="Back to listing" Icon={ArrowLeft} direction="back" onClick={() => undefined} />
								<ThemeToggle />
								<span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }} className="text-sm text-fg-secondary">Helper tooltip <HelperTooltip label="Plant" text="The plant that consumes this part." /></span>
							</div>
							<ReasonActionModal open={reasonMode !== null} mode={reasonMode} onClose={() => setReasonMode(null)} onConfirm={() => setReasonMode(null)} />
						</section>

						<section style={{ display: "grid", gap: "var(--space-4)" }} id="pg-inputs">
							<FormHeader title="More inputs" />
							<div className="saas-form-grid saas-form-grid-3" style={{ alignItems: "start" }}>
								<PhoneInput label="Mobile number" required countryCodes={PHONE_CODES} countryCodeProps={{ value: "+91" }} value={phone} onChange={(e) => setPhone((e.target as HTMLInputElement).value)} />
								<PhoneInput label="Alternate number" mode="view" countryCodes={PHONE_CODES} value="" />
								<MultiSelectInput label="Models" options={["EX 200", "EX 210", "SH 210", "TH 76"].map((m) => ({ label: m, value: m }))} value={models} onChange={(v) => setModels([...(v ?? [])])} />
								<UserAsyncSelect label="Assign approver" onChange={() => undefined} placeholder="Search by name or email" />
								<PincodeAsyncSelect label="Pincode" onChange={() => undefined} placeholder="Type a pincode" />
								<div><p className="form-label">Verification code</p><OtpInput length={6} value={otp} onChange={setOtp} /></div>
							</div>
							<div style={{ display: "flex", gap: "var(--space-8)", flexWrap: "wrap" }}>
								<Radio name="supplier-type" groupLabel="Supplier type" options={[{ label: "Domestic", value: "domestic", description: "GST registered in India" }, { label: "Import", value: "import", description: "Customs duty applies" }, { label: "Inter-company", value: "ic", disabled: true }]} selectedValue={radioValue} onChange={setRadioValue} />
								<div style={{ display: "grid", gap: "var(--space-2)" }}>
									<Checkbox name="agree" label="I confirm the quotation is current" checked={agree} onChange={setAgree} required />
									<Checkbox name="ind" label="Some plants selected" indeterminate />
									<Checkbox name="dis" label="Locked option" checked disabled />
									<Checkbox name="err" label="Accept the DPDP consent" error="Consent is required to continue." />
								</div>
							</div>
						</section>

						<section style={{ display: "grid", gap: "var(--space-4)" }} id="pg-mgmt">
							<FormHeader title="Management table & listing" />
							<ManagementTable
								ariaLabel="Sample users"
								rows={[
									{ id: "u1", name: "Priya Nair", email: "priya.nair@example.com", role: "Head of Purchase", plants: ["KGP", "DWD"], status: "ACTIVE" },
									{ id: "u2", name: "Arun Kumar", email: "arun.k@example.com", role: "SCM Manager", plants: ["KGP"], status: "INACTIVE" },
									{ id: "u3", name: "Monica R", email: "monica.r@example.com", role: "Finance Controller", plants: ["JSR", "KGP", "DWD", "BLR"], status: "ACTIVE" },
								]}
								getRowId={(r) => r.id}
								selectable
								selectedRowIds={mgmtSelected}
								onSelectedRowIdsChange={setMgmtSelected}
								columns={[
									{ key: "user", header: "User", render: (r) => <ManagementIdentityCell title={r.name} subtitle={r.email} /> },
									{ key: "role", header: "Role", render: (r) => <ManagementValueCell primary={r.role} secondary={`${r.plants.length} plant${r.plants.length === 1 ? "" : "s"}`} /> },
									{ key: "team", header: "Team", render: (r) => <ManagementAvatarGroup items={r.plants.map((p) => ({ id: p, name: p }))} max={3} />, hideBelow: "md" },
									{ key: "status", header: "Status", render: (r) => <Badge status={r.status} withIcon /> },
								]}
							/>
							<TableListing<PartRow>
								data={parts.slice(0, 3)}
								columns={partColumns.slice(0, 4)}
								ariaLabel="Sample listing"
								toolbarStart={<span className="text-sm font-semibold text-fg">CPP requests</span>}
								toolbarEnd={<Button type="button" size="sm" variant="brand" text="New request" />}
								message={<span className="text-xs text-fg-secondary">Showing sample rows.</span>}
							/>
							<DataTableSkeleton rows={3} columns={5} />
							<div style={{ display: "flex", justifyContent: "center", padding: "var(--space-4)" }}><Loader /></div>
						</section>
					</div>
				</Card>

				{/* -------- Batch 10: remaining shared components -------- */}
				<Card title="Menus, toggles, sections & pickers" subtitle="Batch 10: shared components not covered by earlier batches." padding="default">
					<div style={{ display: "grid", gap: "var(--space-8)" }} id="pg-b10">
						<section style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-4)" }} id="pg-controls">
							<div style={{ width: "16rem" }}><SearchInput value={search} onChange={setSearch} onClear={() => setSearch("")} placeholder="Search requests" /></div>
							<FilterDropdown
								filters={filters}
								onChange={(u) => setFilters((f) => ({ ...f, ...u }))}
								onClearAll={() => setFilters({ status: [], plant: [], from: "", to: "" })}
								activeFilterCount={filters.status.length + filters.plant.length + (filters.from ? 1 : 0)}
								sections={[
									{ type: "checkbox", key: "status", label: "Status", options: [{ label: "Pending", value: "PENDING" }, { label: "Approved", value: "APPROVED" }, { label: "Rejected", value: "REJECTED" }], columns: 1 },
									{ type: "checkbox", key: "plant", label: "Plant", options: [{ label: "KGP", value: "KGP" }, { label: "DWD", value: "DWD" }], columns: 2 },
									{ type: "dateRange", label: "Initiated", fromKey: "from", toKey: "to" },
								]}
							/>
							<ThreeWayToggle
								ariaLabel="View"
								value={view}
								onChange={setView}
								options={[{ value: "grid", label: "Cards", Icon: LayoutGrid }, { value: "list", label: "List", Icon: List }, { value: "rows", label: "Compact", Icon: Rows3 }]}
							/>
							<Toggle checked={toggleOn} onChange={setToggleOn} label="Email me updates" />
							<ActionMenu row={{ id: "1" }} ariaLabel="Row actions" actions={[{ id: "v", label: "View", Icon: EyeIcon, onClick: () => undefined }, { id: "e", label: "Edit", Icon: Pencil, onClick: () => undefined }, { id: "c", label: "Duplicate", Icon: CopyIcon, onClick: () => undefined }, { id: "d", label: "Delete", Icon: TrashIcon, onClick: () => undefined, variant: "danger" }]} />
							<Popover trigger={<span className="button-base button-standard button-secondary button-sm">Popover</span>}><div style={{ padding: "var(--space-3)", maxWidth: "16rem" }} className="text-sm text-fg-secondary">Popover content with a short explanation.</div></Popover>
							<div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
								<Avatar firstName="Monica" lastName="R" size="xs" /><Avatar firstName="Monica" lastName="R" size="sm" /><Avatar firstName="Priya" lastName="Nair" size="md" /><Avatar firstName="Arun" lastName="Kumar" size="lg" />
							</div>
						</section>

						<section style={{ display: "grid", gap: "var(--space-3)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))", alignItems: "start" }} id="pg-dates">
							<DatePickerInput label="Effective date" mode="single" value={dateValue} onChange={(v) => setDateValue(v as Date | undefined)} placeholder="Choose a date" />
							<DatePickerInput label="Event period" mode="range" placeholder="Choose start and end" />
						</section>

						<section style={{ display: "grid", gap: "var(--space-4)" }} id="pg-sections">
							<SectionHeader title="Supplier details" Icon={Building2} action={<Button type="button" size="sm" variant="secondary" appearance="standard" text="Edit" />}>
								<p className="text-sm text-fg-secondary">Standard section header with an icon and an action.</p>
							</SectionHeader>
							<SectionHeader title="Price justification" variant="accordion">
								<p className="text-sm text-fg-secondary">Accordion section content.</p>
							</SectionHeader>
							<SectionHeader title="Amortisation" variant="accordion" defaultOpen={false}>{null}</SectionHeader>
							<SectionAccordion title="Additional information" />
							<Accordion items={[{ id: "a1", title: "What happens after I submit?", content: "The request goes to Plant SCM review first." }, { id: "a2", title: "Who can see my remarks?", content: "Everyone on the workflow." }]} defaultOpen={["a1"]} />
							<EditableCard
								title="Vendor profile"
								subtitle="Used on purchase orders"
								value={vendor}
								onSubmit={(v) => { setVendor(v); return true; }}
								fields={[{ name: "legalName", label: "Legal name", required: true }, { name: "gstin", label: "GSTIN" }, { name: "email", label: "Accounts email", type: "email", span: 2 }]}
							/>
						</section>
					</div>
				</Card>

				{/* -------- Batch 9: dialogs, uploads, comments, empty states -------- */}
				<Card title="Dialogs, uploads, comments & empty states" subtitle="Batch 9. The button bar below stacks full width on phones; try a narrow window." padding="default">
					<div style={{ display: "grid", gap: "var(--space-8)" }}>
						<section style={{ display: "grid", gap: "var(--space-3)" }}>
							<h3 className="text-base font-semibold text-fg">Dialog</h3>
							<div><Button type="button" size="sm" text="Open approval dialog" variant="brand" onClick={() => setModalOpen(true)} /></div>
							<Modal
								open={modalOpen}
								onClose={() => setModalOpen(false)}
								title="Approve CPP-2026-00418?"
								description="Your approval moves this request to MD approval. Remarks are visible to everyone on the workflow."
								size="sm"
								footer_actions={<>
									<Button type="button" variant="secondary" appearance="standard" text="Cancel" onClick={() => setModalOpen(false)} />
									<Button type="button" text="Approve" variant="brand" onClick={() => { setModalOpen(false); showToast({ type: "success", title: "Approved", description: "CPP-2026-00418 moved to MD approval." }); }} />
								</>}
							>
								<TextareaInput label="Remarks" optional helperText="Shown to the proposer and later approvers." isTooltip={false} value="" onChange={() => undefined} />
							</Modal>
						</section>

						<section style={{ display: "grid", gap: "var(--space-4)" }} id="pg-uploads">
							<h3 className="text-base font-semibold text-fg">File upload</h3>
							<div className="saas-form-grid saas-form-grid-3" style={{ alignItems: "start" }}>
								<FileUploadField kind="pdf" label="Supporting document" description="PDF, up to 5 MB" value={singleFile} onChange={(v) => setSingleFile(v)} />
								<FileUploadField kind="pdf" label="Supplier quotation" required value={quoteFile} onChange={(v) => setQuoteFile(v)} />
								<FileUploadField kind="pdf" label="Signed approval note" required description="PDF, up to 5 MB" error="Upload the signed approval note to continue." value={null} onChange={() => undefined} />
							</div>
							<FileUploadField kind="pdf" multiple maxFiles={5} label="Event evidence" description="Photos or PDFs, up to 5 files" value={photos} onChange={(v) => setPhotos(v)} />
							<FileUploadField kind="pdf" label="Submitted invoice (view mode)" readonly previewVariant="line" value={quoteFile} onChange={() => undefined} />
						</section>

						<section style={{ display: "grid", gap: "var(--space-3)" }} id="pg-comments">
							<div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
								<h3 className="text-base font-semibold text-fg" style={{ marginRight: "auto" }}>Comments</h3>
								<Button type="button" size="sm" appearance="toggle" active={commentsFail} text="Simulate load failure" onClick={() => { setCommentsFail((v) => !v); setCommentsKey((k) => k + 1); }} />
							</div>
							<div style={{ maxWidth: "30rem" }}>
								<CommentsSection subjectType="CPP" subjectId="pg" currentUserId="me" api={commentApi} refreshKey={commentsKey} canComment />
							</div>
						</section>

						<section style={{ display: "grid", gap: "var(--space-3)" }} id="pg-empty">
							<h3 className="text-base font-semibold text-fg">Empty states &amp; detail pairs</h3>
							<div style={{ display: "grid", gap: "var(--space-3)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))" }}>
								<CardEmpty title="No comments yet" description="Start the conversation, and @mention someone to notify them." Icon={MessageCircle} iconSize={18} />
								<CardEmpty title="No attachments" description="Add the supplier quotation and any supporting documents." Icon={Paperclip} iconSize={18} action={<Button type="button" size="sm" variant="secondary" appearance="standard" text="Upload file" />} />
							</div>
							<div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))" }}>
								<div><p className="detail-label">GSTIN</p><p className="detail-value">29ABCDE1234F1Z5</p></div>
								<div><p className="detail-label">Billing address</p><p className="detail-value">Plot 12, KIADB Industrial Area, Dharwad 580011</p></div>
								<div><p className="detail-label">Payment terms</p><p className="detail-value">45 days from invoice</p></div>
							</div>
						</section>

						<section id="pg-bar" style={{ paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border-subtle)" }}>
							<div className="bottom-buttons-bar-between">
								<Button type="button" variant="secondary" appearance="standard" text="Back" />
								<div className="bottom-buttons-bar-end">
									<Button type="button" variant="secondary" appearance="standard" text="Save as draft" />
									<Button type="button" text="Submit for approval" variant="brand" />
								</div>
							</div>
						</section>
					</div>
				</Card>

				{/* -------- Batch 8: feedback & business components -------- */}
				<Card title="Feedback, status & business components" subtitle="Badges, alerts, toasts, metrics, workflow stages and the audit trail." padding="default">
					<div style={{ display: "grid", gap: "var(--space-8)" }}>
						<section style={{ display: "grid", gap: "var(--space-2)" }}>
							<h3 className="text-base font-semibold text-fg">Status badges (one central map)</h3>
							<div id="pg-badges" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
								{SAMPLE_STATUSES.map((s) => <Badge key={s} status={s} withIcon />)}
							</div>
							<p className="text-xs text-fg-muted">"On Hold" isn't in the map, so it shows neutral, not amber.</p>
						</section>

						<section style={{ display: "grid", gap: "var(--space-3)" }} id="pg-alerts">
							<h3 className="text-base font-semibold text-fg">Alerts</h3>
							<Alert variant="info" type="banner" title="Pending approval" description="This request is with the Price panel committee. You'll be notified when it moves." />
							<Alert variant="warning" type="banner" title="2 fields need attention before you can submit" description="Fix these, then submit again:" primaryAction={{ label: "Go to first", onClick: () => undefined }}>
								<ul><li>Vendor code must be 6 digits</li><li>Justification is under 50 characters</li></ul>
							</Alert>
							<Alert variant="success" type="banner" title="Draft saved" description="Saved at 10:42 am. You can leave and continue later." dismissible />
							<Alert variant="error" type="banner" title="Available budget exceeded" description="Claimed ₹ 6,85,000 is more than the ₹ 6,20,000 left for this quarter." />
							<div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
								{(["success", "info", "warning", "error"] as const).map((t) => (
									<Button key={t} type="button" size="sm" variant="secondary" appearance="standard" text={`Show ${t} toast`}
										onClick={() => showToast({ type: t, title: t === "error" ? "Upload failed" : t === "success" ? "Request submitted" : t === "warning" ? "Session ends in 5 minutes" : "Export started", description: t === "error" ? "invoice-4436221.pdf is larger than 10 MB." : "Sample toast for the playground." })} />
								))}
							</div>
						</section>

						<section style={{ display: "grid", gap: "var(--space-3)" }}>
							<h3 className="text-base font-semibold text-fg">Metric cards</h3>
							<MetricGrid aria-label="Sample budget summary">
								<MetricCard label="Annual budget" value="₹ 48,00,000" tone="brand" size="lg" description="FY 2026–27, Marketing · South" />
								<MetricCard label="Available budget" value="₹ 3,40,000" progress={{ value: 44_60_000, max: 48_00_000, label: "93% used · ₹ 3,40,000 left" }} tone="warning" />
								<MetricCard label="Annualised impact" value="+₹ 10,02,100" delta={{ value: "+4.1%", direction: "up", intent: "negative", label: "vs current prices" }} tone="danger" />
								<MetricCard label="Financial impact" state="pending" description="Formula awaiting business confirmation." />
								<MetricCard label="Participants" value="148" unit="people" delta={{ value: "+12", direction: "up", intent: "positive", label: "vs plan" }} />
								<MetricCard label="Dealer contribution" state="loading" />
								<MetricCard label="Claimed amount" value="₹ 0.00" description="An actual zero: nothing claimed yet." />
								<MetricCard label="Retro impact" state="error" />
							</MetricGrid>
						</section>

						<section style={{ display: "grid", gap: "var(--space-3)" }} id="pg-workflow">
							<h3 className="text-base font-semibold text-fg">Workflow stages</h3>
							<WorkflowStageList stages={SAMPLE_STAGES} ariaLabel="Sample approval workflow" />
						</section>

						<section style={{ display: "grid", gap: "var(--space-3)" }} id="pg-audit">
							<div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
								<h3 className="text-base font-semibold text-fg" style={{ marginRight: "auto" }}>Audit trail</h3>
								<Button type="button" size="sm" appearance="toggle" active={auditFails} text="Simulate load failure" onClick={() => { setAuditFails((v) => !v); setAuditKey((k) => k + 1); }} />
							</div>
							<div style={{ maxWidth: "28rem" }}>
								<AuditLogSection subjectType="CPP" subjectId="pg" entityName="request" api={auditApi} refreshKey={auditKey} />
							</div>
						</section>
					</div>
				</Card>

				{/* -------- Batch 7: tables -------- */}
				<Card title="Tables" subtitle="DataTable options and the restyled SimpleViewTable. Edit a proposed price to see the totals update." padding="default">
					<div style={{ display: "grid", gap: "var(--space-6)" }}>
						<div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
							{(["data", "loading", "empty", "error"] as const).map((s) => (
								<Button key={s} type="button" size="sm" appearance="toggle" active={tableState === s} text={s[0].toUpperCase() + s.slice(1)} onClick={() => setTableState(s)} />
							))}
							<span style={{ width: "var(--space-4)" }} />
							<Button type="button" size="sm" appearance="toggle" active={striped} text="Striped" onClick={() => setStriped((v) => !v)} />
							<Button type="button" size="sm" appearance="toggle" active={compact} text="Compact" onClick={() => setCompact((v) => !v)} />
						</div>
						<div id="pg-datatable" style={{ border: "1px solid var(--table-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
							<DataTable<PartRow>
								ariaLabel="Sample CPP part pricing"
								scrollTargetId="pg-datatable-scroll"
								data={tableState === "empty" ? [] : parts}
								columns={partColumns}
								getRowId={(r) => r.id}
								loading={tableState === "loading"}
								error={tableState === "error" ? "The pricing service didn't respond. Your filters are kept." : undefined}
								onRetry={() => setTableState("data")}
								emptyTitle="No parts on this request"
								emptyDescription="Add parts in the Purchasing step to see their price impact."
								emptyAction={<Button type="button" size="sm" variant="secondary" appearance="standard" text="Reset sample" onClick={() => setTableState("data")} />}
								striped={striped}
								density={compact ? "compact" : "comfortable"}
								stickyFirstColumn
								minWidth="xl"
								pageSize={5}
							/>
						</div>
						<p className="text-xs text-fg-muted">Sample parts and prices for the playground only.</p>

						<SimpleViewTable<PartRow>
							title="Saved claim heads (SimpleViewTable)"
							ariaLabel="Sample simple table"
							data={parts.slice(0, 3)}
							getRowId={(r) => r.id}
							selectable
							columns={[
								{ key: "part", header: "Part", render: (r) => r.part },
								{ key: "supplier", header: "Supplier", widthUnits: 2, render: (r) => r.supplier },
								{ key: "amount", header: "Amount", align: "right", render: (r) => inr(r.oldPrice), footer: (rows) => inr(rows.reduce((s, r) => s + r.oldPrice, 0)) },
							]}
							fileColumn={{ header: "Invoice", accessor: (r) => (r.id === "2" ? null : { name: `invoice-${r.part}.pdf`, url: "#" }) }}
							maxHeight="320px"
						/>
					</div>
				</Card>

				{/* -------- Batch 6: navigation & orientation -------- */}
				<Card title="Navigation & orientation" subtitle="Where am I, what's done, what's wrong, what's next." padding="default">
					<div style={{ display: "grid", gap: "var(--space-8)" }}>
						<PageHeader
							headerText="CPP Request CPP-2026-00418"
							status={<span className="badge badge-warning">Pending approval</span>}
							metaItems={[
								{ label: "Initiated by", value: "Monica R" },
								{ label: "Initiated", value: "24 Nov 2026" },
								{ label: "Plant", value: "KGP" },
							]}
							navigation={{
								variant: "breadcrumbs",
								ariaLabel: "Sample location",
								breadcrumbs: [
									{ label: "Home Screen", href: "/" },
									{ label: "Contract & Price Panel Committee", href: "/cpp/listing" },
									{ label: "CPP-2026-00418" },
								],
								separator: "›",
							}}
							headerChildren={<Button type="button" size="sm" text="Export" variant="secondary" appearance="standard" />}
						/>

						<div style={{ display: "grid", gap: "var(--space-3)" }}>
							<StepProgress
								steps={wizardSteps}
								currentStep={wizardStep}
								showSummary
								onStepClick={setWizardStep}
								ariaLabel="Sample wizard steps"
							/>
							<div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
								<Button type="button" size="sm" variant="secondary" appearance="standard" text="Previous" disabled={wizardStep <= 1} onClick={() => setWizardStep((s) => Math.max(1, s - 1))} />
								<Button type="button" size="sm" text="Next" variant="brand" disabled={wizardStep >= 5} onClick={() => setWizardStep((s) => Math.min(5, s + 1))} />
								<Button type="button" size="sm" appearance="toggle" active={markInvalid} text="Step 2 has errors" onClick={() => setMarkInvalid((v) => !v)} />
							</div>
							<p className="text-xs text-fg-muted">Click a finished or flagged step to jump back. Upcoming steps aren't clickable, so a wizard can still validate before moving forward.</p>
						</div>

						<div style={{ display: "grid", gap: "var(--space-4)" }}>
							<TabsBar
								ariaLabel="Sample underline tabs"
								items={[
									{ label: "Overview", value: "overview" },
									{ label: "Line items", value: "lines", badge: <span className="section-nav-count">12</span> },
									{ label: "History", value: "history" },
								]}
								active={tab}
								onChange={setTab}
								className="px-0"
							/>
							<TabsBar
								ariaLabel="Sample soft tabs"
								variant="soft"
								items={[
									{ label: "All", value: "all" },
									{ label: "Pending", value: "pending" },
									{ label: "Approved", value: "approved" },
								]}
								active={softTab}
								onChange={setSoftTab}
							/>
						</div>

						<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 14rem), 1fr))", gap: "var(--space-4)", alignItems: "start" }}>
							<SectionNav
								ariaLabel="Sample request sections"
								title="Request details"
								sticky
								items={[
									{ value: "basic", label: "Basic details", status: "complete" },
									{ value: "purchasing", label: "Purchasing details" },
									{ value: "financial", label: "Financial impact", status: "warning" },
									{ value: "attachments", label: "Attachments", count: 4 },
									{ value: "workflow", label: "Workflow", status: "invalid" },
								]}
								active={section}
								onChange={setSection}
							/>
							<div style={{ gridColumn: "span 2", minWidth: 0, padding: "var(--space-4)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)" }}>
								<p className="text-base font-semibold text-fg">{section[0].toUpperCase() + section.slice(1)}</p>
								<p className="text-sm text-fg-secondary">Section content shows here. Status marks come from real data, e.g. a warning when a calculation is pending.</p>
							</div>
						</div>

						<Pagination
							pageIndex={pageIndex}
							pageSize={pageSize}
							totalPages={9}
							onPageChange={setPageIndex}
							onPageSizeChange={setPageSize}
						/>
					</div>
				</Card>

				{/* -------- Batch 5: read-only view mode -------- */}
				<Card
					title="View mode (submitted request)"
					subtitle="The form above, as a viewer sees it after submission. Type in the form and the values show here."
					padding="default"
				>
					<div style={{ display: "grid", gap: "var(--space-6)" }}>
						<div className="saas-form-grid saas-form-grid-3" id="view-form">
							<FormInput label="Category" required mode="view" value={values.category} />
							<FormInput label="Vendor code" required mode="view" value={values.vendorCode} />
							<SelectInput<Option>
								label="Plant"
								required
								mode="view"
								options={PLANTS}
								value={values.plant}
							/>
							<FormInput label="Annualised value (₹)" type="number" mode="view" value={values.amount} />
							<FormInput label="Internal remarks" mode="view" emptyReadOnlyReason="not-applicable" />
						</div>
						<TextareaInput label="Justification" required mode="view" value={values.justification} />

						<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
							<h3 className="text-base font-semibold text-fg">Key-value grid · every empty reason</h3>
							<div style={{ display: "flex", gap: "var(--space-2)" }}>
								{(["plain", "boxed"] as const).map((v) => (
									<Button
										key={v}
										type="button"
										size="sm"
										appearance="toggle"
										active={gridVariant === v}
										text={v === "plain" ? "Plain" : "Boxed"}
										onClick={() => setGridVariant(v)}
									/>
								))}
							</div>
						</div>

						<ReadOnlyGrid columns={3} variant={gridVariant} aria-label="Sample CPP request details">
							<ReadOnlyField label="Reference number" value="CPP-2026-00418" copyable />
							<ReadOnlyField label="Initiation date" value="24 Nov 2026" valueType="date" />
							<ReadOnlyField label="Annualised value" value="₹ 12,45,000.00" valueType="currency" />
							<ReadOnlyField label="Price change (actual zero)" value={0} valueType="numeric" />
							<ReadOnlyField label="Supplier GSTIN" emptyReason="not-applicable" />
							<ReadOnlyField label="Alternate contact" />
							<ReadOnlyField label="Financial impact" emptyReason="pending" helperText="Formula awaiting business confirmation." />
							<ReadOnlyField label="Vendor master record" emptyReason="error" />
							<ReadOnlyField label="Highest value part" emptyReason="loading" />
							<ReadOnlyField label="Recommended supplier" emptyReason="unavailable" />
							<ReadOnlyField label="Plants" values={["KGP", "DWD", "JSR"]} />
							<ReadOnlyField label="Models" values={["EX 200", "EX 210", "SH 210", "TH 76", "EX 1200"]} />
							<ReadOnlyField
								label="Remarks"
								valueType="multiline"
								fullWidth
								value={"Supplier has agreed to hold the revised price for 12 months from the effective date.\nThe revision covers raw-material indexation only; tooling cost stays with the earlier approval.\nPlant SCM confirmed volumes for FY27."}
							/>
						</ReadOnlyGrid>
						<p className="text-xs text-fg-muted">Sample values for the playground only.</p>
					</div>
				</Card>

				{/* -------- Batches 1–3: buttons, badges, table -------- */}
				<Card title="Buttons, badges & table" padding="default">
					<div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center" }}>
						<Button variant="brand">Primary</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="outline">Outline</Button>
						<Button variant="iron">Secondary brand</Button>
						<Button variant="danger">Destructive</Button>
						<Button variant="success">Success</Button>
						<Button variant="warning">Warning</Button>
						<Button variant="brand" disabled>
							Disabled
						</Button>
						<span className="badge badge-brand">Draft</span>
						<span className="badge badge-success">Approved</span>
						<span className="badge badge-warning">Pending</span>
						<span className="badge badge-danger">Rejected</span>
						<span className="badge badge-info">In Progress</span>
					</div>

					<div className="data-table-shell" style={{ marginTop: "var(--space-4)" }}>
						<div className="data-table-scroll">
							<table className="data-table data-table-min-sm">
								<thead className="data-table-head">
									<tr className="data-table-head-row">
										<th className="data-table-head-cell"><div className="data-table-head-content">Reference</div></th>
										<th className="data-table-head-cell"><div className="data-table-head-content">Status</div></th>
										<th className="data-table-head-cell data-table-align-right"><div className="data-table-head-content">Amount</div></th>
									</tr>
								</thead>
								<tbody className="data-table-body">
									{[
										["SAMPLE-001", "Approved", "badge-success", "₹11,00,000", false],
										["SAMPLE-002", "In Progress", "badge-info", "₹5,64,566", true],
										["SAMPLE-003", "Pending", "badge-warning", "₹10,000", false],
									].map(([ref, status, badge, amount, selected]) => (
										<tr key={String(ref)} className={`data-table-row${selected ? " data-table-row-selected" : ""}`}>
											<td className="data-table-cell"><div className="data-table-cell-inner"><a href="#playground">{ref}</a></div></td>
											<td className="data-table-cell"><div className="data-table-cell-inner"><span className={`badge ${badge}`}>{status}</span></div></td>
											<td className="data-table-cell data-table-align-right"><div className="data-table-cell-inner data-table-money">{amount}</div></td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}
