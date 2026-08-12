import {
	Activity,
	ArrowLeft,
	BadgeIndianRupee,
	Building2,
	CheckCircle2,
	Eye,
	HeartPulse,
	MessageCircleQuestion,
	ReceiptText,
	Stethoscope,
	UserRound,
	XCircle,
	Clock,
	Download,
	Printer,
} from "lucide-react";

import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import FormInput from "../../components/forms/FormInput";
import TextareaInput from "../../components/forms/TextareaInput";
import FormHeader from "../../components/ui/FormHeader";

import type {
	ApprovalActionType,
	ApprovalStage,
	ReimbursementClaimAttachments,
	ReimbursementClaimFormValues,
} from "./reimbursementClaim.types";
import { deriveClaimStatusLabel } from "./useReimbursementClaimForm";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 2,
});

// ---------------------------------------------------------------------------
// Sample / prefilled data — replace with the values fetched for a given claim
// ---------------------------------------------------------------------------

const prefilledValues: ReimbursementClaimFormValues & {
	ticketNumber?: string;
	grade?: string;
	totalAmountEligible?: number;
	coverageType?: "SELF" | "SPOUSE" | "BOTH" | "";
	spouseName?: string;
} = {
	ticketNumber: "E-4521",
	grade: "M2",
	totalAmountEligible: 35000,
	coverageType: "SPOUSE",
	spouseName: "Sunita Kulkarni",

	ticketNumberOrGrade: "E-4521 / M2",
	employeeName: "Ramesh Kulkarni",
	location: "Bengaluru",
	patientName: "Sunita Kulkarni",
	relationshipWithEmployee: "Spouse",

	medicalAdvanceAmount: "5000",
	companySettledAmount: "12000",
	descriptionOfIllness:
		"Recurring migraine with associated dizziness. Neurologist consultation, MRI investigation, and a two-week course of prescribed medication.",

	numberOfVisits: "3",
	visitFeePerVisit: "800",

	doctorMedicineAmount: "2450",
	injectionInvestigationAmount: "6200",
	ecgXrayOtherAmount: "0",

	lensCost: "0",
	frameCost: "0",

	patientAge: "52",
	lastHealthCheckupDate: "2025-11-14",
	healthCheckupAmount: "0",

	excessHospitalizationAmount: "0",

	declarationAccepted: true,
	employeeSignature: "Ramesh Kulkarni",
	claimDate: "2026-07-28",

	officeReference: "RC-2026-0742",
	officeVisitFeesAmount: "2400",
	officeMedicalAmount: "8650",
	officeOphthalmicAmount: "0",
	officeHealthCheckupAmount: "0",
	officeExcessHospitalizationAmount: "0",
	passedBy: "Priya Nair",
	passedAmount: "11050",
	passedDate: "2026-07-31",
};

const prefilledApprovalStages: ApprovalStage[] = [
	{
		id: "stage-1",
		name: "Reporting Manager",
		approverName: "Arvind Rao",
		status: "approved",
		comment: "Verified against team leave records. Approved.",
		actionedAt: "2026-07-29T10:15:00+05:30",
	} as ApprovalStage,
	{
		id: "stage-2",
		name: "HR Health Scheme Desk",
		approverName: "Priya Nair",
		status: "approved",
		comment:
			"Bills tallied with claim heads. Passed amount adjusted for visit fee cap.",
		actionedAt: "2026-07-31T14:40:00+05:30",
	} as ApprovalStage,
	{
		id: "stage-3",
		name: "Finance Controller",
		approverName: "Deepak Shenoy",
		status: "pending",
		comment: "",
		actionedAt: null,
	} as ApprovalStage,
];

// ---------------------------------------------------------------------------
// Approval table
// ---------------------------------------------------------------------------

const statusMeta: Record<
	string,
	{ label: string; icon: typeof CheckCircle2; className: string }
> = {
	approved: {
		label: "Approved",
		icon: CheckCircle2,
		className: "bg-green-50 text-green-700 border-green-200",
	},
	rejected: {
		label: "Rejected",
		icon: XCircle,
		className: "bg-red-50 text-rejected border-red-200",
	},
	clarify: {
		label: "Clarification Requested",
		icon: MessageCircleQuestion,
		className: "bg-amber-50 text-amber-700 border-amber-200",
	},
	pending: {
		label: "Pending",
		icon: Clock,
		className: "bg-page text-iron-dark border-border",
	},
};

const formatDateTime = (value: string | null) => {
	if (!value) return "—";
	return new Date(value).toLocaleString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

interface ApprovalTableProps {
	stages: ApprovalStage[];
	canApprove?: boolean;
	pendingStageId?: string | null;
	onAction?: (
		stageId: string,
		action: ApprovalActionType,
		comment: string,
	) => void | Promise<void>;
}

const ApprovalTable = ({
	stages,
	canApprove = false,
	pendingStageId,
	onAction,
}: ApprovalTableProps) => {
	return (
		<div className="flex flex-col gap-4">
			<div className="overflow-x-auto rounded-md border border-border">
				<table className="w-full min-w-[640px] text-left text-sm">
					<thead className="bg-page text-xs font-semibold uppercase tracking-wide text-iron-dark">
						<tr>
							<th className="px-4 py-3">Stage</th>
							<th className="px-4 py-3">Approver</th>
							<th className="px-4 py-3">Status</th>
							<th className="px-4 py-3">Comment</th>
							<th className="px-4 py-3">Actioned On</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{stages.map((stage) => {
							const meta =
								statusMeta[(stage as unknown as { status: string }).status] ??
								statusMeta.pending;
							const Icon = meta.icon;
							const s = stage as unknown as {
								id: string;
								name: string;
								approverName: string;
								comment: string;
								actionedAt: string | null;
							};

							return (
								<tr key={s.id} className="align-top">
									<td className="px-4 py-3 font-medium text-iron-dark">
										{s.name}
									</td>
									<td className="px-4 py-3 text-iron">{s.approverName}</td>
									<td className="px-4 py-3">
										<span
											className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
										>
											<Icon size={13} aria-hidden="true" />
											{meta.label}
										</span>
									</td>
									<td className="px-4 py-3 text-iron">
										{s.comment ? s.comment : "—"}
									</td>
									<td className="px-4 py-3 whitespace-nowrap text-muted">
										{formatDateTime(s.actionedAt)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{canApprove && pendingStageId ? (
				<div className="flex flex-col gap-2  p-3 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-sm text-iron">
						This claim is awaiting your action at the current stage.
					</p>
					<div className="flex gap-2">
						<Button
							type="button"
							text="Reject"
							Icon={XCircle}
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={() => onAction?.(pendingStageId, "reject", "")}
						/>
						<Button
							type="button"
							text="Clarify"
							Icon={MessageCircleQuestion}
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={() => onAction?.(pendingStageId, "clarify", "")}
						/>
						<Button
							type="button"
							text="Approve"
							Icon={CheckCircle2}
							size="sm"
							appearance="standard"
							variant="brand"
							onClick={() => onAction?.(pendingStageId, "approve", "")}
						/>
					</div>
				</div>
			) : null}
		</div>
	);
};

// ---------------------------------------------------------------------------
// View component
// ---------------------------------------------------------------------------

interface ReimbursementClaimViewProps {
	values?: typeof prefilledValues;
	attachments?: ReimbursementClaimAttachments;
	approvalStages?: ApprovalStage[];
	canApprove?: boolean;
	onApprovalAction?: (
		stageId: string,
		action: ApprovalActionType,
		comment: string,
	) => void | Promise<void>;
	onBack?: () => void;
	onDownload?: () => void;
	onPrint?: () => void;
}

const ReimbursementClaimView = ({
	values = prefilledValues,
	approvalStages = prefilledApprovalStages,
	canApprove = true,
	onApprovalAction,
	onBack,
	onDownload,
	onPrint,
}: ReimbursementClaimViewProps) => {
	const visitFeesTotal =
		Number(values.numberOfVisits || 0) * Number(values.visitFeePerVisit || 0);
	const medicalTotal =
		Number(values.doctorMedicineAmount || 0) +
		Number(values.injectionInvestigationAmount || 0) +
		Number(values.ecgXrayOtherAmount || 0);
	const ophthalmicTotal =
		Number(values.lensCost || 0) + Number(values.frameCost || 0);
	const claimedTotal =
		visitFeesTotal +
		medicalTotal +
		ophthalmicTotal +
		Number(values.healthCheckupAmount || 0) +
		Number(values.excessHospitalizationAmount || 0);

	const claimStatusLabel = deriveClaimStatusLabel(approvalStages);
	const pendingStage = approvalStages.find(
		(stage) => (stage as unknown as { status: string }).status === "pending",
	) as unknown as { id: string } | undefined;

	const coverageLabel: Record<string, string> = {
		SELF: "Self",
		SPOUSE: "Spouse",
		BOTH: "Self and Spouse",
	};

	return (
		<Card
			title={
				<div className="flex items-center justify-between gap-3">
					<p className="text-xs font-bold uppercase tracking-widest text-brand">
						Tata Hitachi Construction Machinery Company Private Limited
					</p>
					<span className="shrink-0 rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-iron-dark">
						{claimStatusLabel}
					</span>
				</div>
			}
			secondaryHeader={
				<div>
					<h1 className="mt-1 text-xl font-semibold tracking-tight text-iron-dark">
						Non-Hospitalisation Claim Form
					</h1>
					<p className="mt-1 text-sm text-muted">
						Read-only view. Reference{" "}
						<span className="font-medium text-iron-dark">
							{values.officeReference}
						</span>{" "}
						for {values.employeeName}.
					</p>
				</div>
			}
			footer={
				<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						{onBack ? (
							<Button
								type="button"
								text="Back"
								Icon={ArrowLeft}
								size="sm"
								appearance="standard"
								variant="outline"
								onClick={onBack}
							/>
						) : null}
					</div>

					<div className="flex flex-col gap-2 sm:flex-row">
						{onPrint ? (
							<Button
								type="button"
								text="Print"
								Icon={Printer}
								size="sm"
								appearance="standard"
								variant="outline"
								onClick={onPrint}
							/>
						) : null}
						{onDownload ? (
							<Button
								type="button"
								text="Download"
								Icon={Download}
								size="sm"
								appearance="standard"
								variant="brand"
								onClick={onDownload}
							/>
						) : null}
					</div>
				</div>
			}
		>
			<div className="flex flex-col gap-5">
				<FormHeader title="Employee and Patient Details" Icon={UserRound} />

				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
					<FormInput
						mode="view"
						name="ticketNumber"
						label="Ticket Number"
						value={values.ticketNumber}
					/>
					<FormInput
						mode="view"
						name="grade"
						label="Grade"
						value={values.grade}
					/>
					<FormInput
						mode="view"
						name="totalAmountEligible"
						label="Total Amount Eligible"
						value={currencyFormatter.format(
							Number(values.totalAmountEligible || 0),
						)}
					/>
					<FormInput
						mode="view"
						name="employeeName"
						label="Name of Employee"
						value={values.employeeName}
					/>
					<FormInput
						mode="view"
						name="location"
						label="Location"
						value={values.location}
					/>
					<FormInput
						mode="view"
						name="patientName"
						label="Name of Patient"
						value={values.patientName}
					/>
					<FormInput
						mode="view"
						name="coverageType"
						label="Claim Covers"
						value={
							values.coverageType ? coverageLabel[values.coverageType] : "—"
						}
					/>
					{values.coverageType === "SPOUSE" ||
					values.coverageType === "BOTH" ? (
						<FormInput
							mode="view"
							name="spouseName"
							label="Spouse Name"
							value={values.spouseName}
						/>
					) : null}
				</div>

				<FormHeader title="Domiciliary Details" Icon={Building2} />

				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					<FormInput
						mode="view"
						name="medicalAdvanceAmount"
						label="Medical Advance Taken"
						value={currencyFormatter.format(
							Number(values.medicalAdvanceAmount || 0),
						)}
					/>
					<FormInput
						mode="view"
						name="companySettledAmount"
						label="Amount Already Settled This Calendar Year"
						value={currencyFormatter.format(
							Number(values.companySettledAmount || 0),
						)}
					/>
				</div>

				<TextareaInput
					mode="view"
					name="descriptionOfIllness"
					label="Description of Illness / Treatment"
					value={values.descriptionOfIllness}
					rows={4}
				/>

				<FormHeader title="Claim Heads" Icon={Stethoscope} />

				<Card
					title={
						<div className="flex items-center gap-2">
							<Stethoscope
								size={18}
								className="text-brand"
								aria-hidden="true"
							/>
							<span>A. Visit Fees</span>
						</div>
					}
					secondaryHeader={
						<p className="text-sm text-muted">
							Claimed amount:{" "}
							<span className="font-semibold text-iron-dark">
								{currencyFormatter.format(visitFeesTotal)}
							</span>
						</p>
					}
				>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
						<FormInput
							mode="view"
							name="numberOfVisits"
							label="Number of Visits"
							value={values.numberOfVisits}
						/>
						<FormInput
							mode="view"
							name="visitFeePerVisit"
							label="Fee per Visit"
							value={currencyFormatter.format(
								Number(values.visitFeePerVisit || 0),
							)}
						/>
						<FormInput
							mode="view"
							name="visitFeesClaimedTotal"
							label="Amount Claimed"
							value={currencyFormatter.format(visitFeesTotal)}
						/>
					</div>
				</Card>

				<Card
					title={
						<div className="flex items-center gap-2">
							<Activity size={18} className="text-brand" aria-hidden="true" />
							<span>B. Medicines and Investigations</span>
						</div>
					}
					secondaryHeader={
						<p className="text-sm text-muted">
							Claimed amount:{" "}
							<span className="font-semibold text-iron-dark">
								{currencyFormatter.format(medicalTotal)}
							</span>
						</p>
					}
				>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
						<FormInput
							mode="view"
							name="doctorMedicineAmount"
							label="Medicines Prescribed by Doctor"
							value={currencyFormatter.format(
								Number(values.doctorMedicineAmount || 0),
							)}
						/>
						<FormInput
							mode="view"
							name="injectionInvestigationAmount"
							label="Injections / Investigations"
							value={currencyFormatter.format(
								Number(values.injectionInvestigationAmount || 0),
							)}
						/>
						<FormInput
							mode="view"
							name="ecgXrayOtherAmount"
							label="ECG / X-Ray / Other"
							value={currencyFormatter.format(
								Number(values.ecgXrayOtherAmount || 0),
							)}
						/>
						<FormInput
							mode="view"
							name="medicalClaimedTotal"
							label="Amount Claimed"
							value={currencyFormatter.format(medicalTotal)}
						/>
					</div>
				</Card>

				<Card
					title={
						<div className="flex items-center gap-2">
							<Eye size={18} className="text-brand" aria-hidden="true" />
							<span>C. Ophthalmic Treatment</span>
						</div>
					}
					secondaryHeader={
						<p className="text-sm text-muted">
							Claimed amount:{" "}
							<span className="font-semibold text-iron-dark">
								{currencyFormatter.format(ophthalmicTotal)}
							</span>
						</p>
					}
				>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
						<FormInput
							mode="view"
							name="lensCost"
							label="Cost of Lenses"
							value={currencyFormatter.format(Number(values.lensCost || 0))}
						/>
						<FormInput
							mode="view"
							name="frameCost"
							label="Cost of Frame"
							value={currencyFormatter.format(Number(values.frameCost || 0))}
						/>
						<FormInput
							mode="view"
							name="ophthalmicClaimedTotal"
							label="Amount Claimed"
							value={currencyFormatter.format(ophthalmicTotal)}
						/>
					</div>
				</Card>

				<Card
					title={
						<div className="flex items-center gap-2">
							<HeartPulse size={18} className="text-brand" aria-hidden="true" />
							<span>D. Executive Health Check-up</span>
						</div>
					}
				>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
						<FormInput
							mode="view"
							name="patientAge"
							label="Age"
							value={values.patientAge}
						/>
						<FormInput
							mode="view"
							name="healthCheckupAmount"
							label="Amount Claimed"
							value={currencyFormatter.format(
								Number(values.healthCheckupAmount || 0),
							)}
						/>
					</div>
				</Card>

				<Card
					title={
						<div className="flex items-center gap-2">
							<ReceiptText
								size={18}
								className="text-brand"
								aria-hidden="true"
							/>
							<span>E. Excess Hospitalisation Claims</span>
						</div>
					}
				>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<FormInput
							mode="view"
							name="excessHospitalizationAmount"
							label="Amount Claimed"
							value={currencyFormatter.format(
								Number(values.excessHospitalizationAmount || 0),
							)}
						/>
					</div>
				</Card>

				<Card>
					<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-xs font-bold uppercase tracking-widest text-brand">
								Total of A + B + C + D + E
							</p>
							<p className="text-sm text-muted">
								Calculated automatically from the amounts entered above.
							</p>
						</div>

						<output className="text-xl font-semibold text-iron-dark">
							{currencyFormatter.format(claimedTotal)}
						</output>
					</div>
				</Card>

				<hr />
				<FormHeader title="Declaration and Signature" Icon={BadgeIndianRupee} />

				<div className="flex flex-col gap-3">
					<p className="text-sm leading-6 text-iron">
						I confirm that I have kept the Company informed in writing of all
						changes in the status of my dependants covered under the Health
						Scheme. I declare that the information provided in this claim is
						true and complete in every respect.
					</p>

					<div className="flex items-start gap-2 text-sm text-iron my-2">
						<CheckCircle2
							size={16}
							className="mt-0.5 shrink-0 text-brand"
							aria-hidden="true"
						/>
						<span>Declaration confirmed and accepted by the employee.</span>
					</div>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<FormInput
							mode="view"
							name="employeeSignature"
							label="Signature of Employee"
							value={values.employeeSignature}
						/>
						<FormInput
							mode="view"
							type="date"
							name="claimDate"
							label="Date"
							value={values.claimDate}
						/>
					</div>
				</div>

				<fieldset className="min-w-0 ">
					<legend className="sr-only">Approval Status</legend>
					<FormHeader title="Approval Status" Icon={CheckCircle2} />
					<div className="mt-3">
						<ApprovalTable
							stages={approvalStages}
							canApprove={canApprove}
							pendingStageId={pendingStage?.id ?? null}
							onAction={onApprovalAction}
						/>
					</div>
				</fieldset>
			</div>
		</Card>
	);
};

export default ReimbursementClaimView;
