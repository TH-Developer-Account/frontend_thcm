import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
	ArrowLeft,
	BadgeIndianRupee,
	Building2,
	CheckCircle2,
	FilePenLine,
	Plus,
	RefreshCcw,
	Save,
	Stethoscope,
	Trash2,
	Upload,
	UserRound,
} from "lucide-react";

import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import FormInput from "../../components/forms/FormInput";
import SelectInput from "../../components/forms/SelectInput";
import TextareaInput from "../../components/forms/TextareaInput";
import FormHeader from "../../components/ui/FormHeader";

import ApprovalSection from "./ApprovalSection";
import {
	sanitizeAmountInput,
	sanitizeWholeNumberInput,
	useReimbursementClaimForm,
	deriveClaimStatusLabel,
} from "./useReimbursementClaimForm";
import type {
	ApprovalActionType,
	ApprovalStage,
	ReimbursementClaimAttachments,
	ReimbursementClaimFormMode,
	ReimbursementClaimFormValues,
	ReimbursementClaimSubmission,
} from "./reimbursementClaim.types";
import Checkbox from "../../components/forms/Checkbox";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/Auth/AuthContext";

type ClaimHead =
	| "VISIT_FEES"
	| "MEDICINES_INVESTIGATIONS"
	| "OPHTHALMIC_TREATMENT"
	| "EXECUTIVE_HEALTH_CHECKUP"
	| "EXCESS_HOSPITALISATION";

type ClaimLineItem = {
	id: string;
	claimHead: ClaimHead | "";
	billNumber: string;
	billName: string;
	name: string;
	billDate: string;
	amount: string;
	file: File | null;
};

type CoverageType = "SELF" | "SPOUSE" | "BOTH" | "";

const CLAIM_HEAD_OPTIONS: Array<{ label: string; value: ClaimHead }> = [
	{ label: "A. Visit Fees", value: "VISIT_FEES" },
	{
		label: "B. Medicines and Investigations",
		value: "MEDICINES_INVESTIGATIONS",
	},
	{ label: "C. Ophthalmic Treatment", value: "OPHTHALMIC_TREATMENT" },
	{
		label: "D. Executive Health Check-up",
		value: "EXECUTIVE_HEALTH_CHECKUP",
	},
	{
		label: "E. Excess Hospitalisation Claims",
		value: "EXCESS_HOSPITALISATION",
	},
];

// TODO: replace with the real grade → annual eligibility table.
const GRADE_OPTIONS: Array<{
	label: string;
	value: string;
	eligibility: number;
}> = [
	{ label: "M1", value: "M1", eligibility: 25000 },
	{ label: "M2", value: "M2", eligibility: 35000 },
	{ label: "M3", value: "M3", eligibility: 45000 },
	{ label: "M4", value: "M4", eligibility: 60000 },
	{ label: "M5", value: "M5", eligibility: 75000 },
	{ label: "E1", value: "E1", eligibility: 100000 },
	{ label: "E2", value: "E2", eligibility: 125000 },
	{ label: "E3", value: "E3", eligibility: 150000 },
];

const COVERAGE_OPTIONS: Array<{ label: string; value: CoverageType }> = [
	{ label: "Self", value: "SELF" },
	{ label: "Spouse", value: "SPOUSE" },
	{ label: "Both", value: "BOTH" },
];

const createLineItem = (): ClaimLineItem => ({
	id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
	claimHead: "",
	billNumber: "",
	billName: "",
	name: "",
	billDate: "",
	amount: "",
	file: null,
});

interface ReimbursementClaimFormProps {
	mode?: ReimbursementClaimFormMode;
	canEdit?: boolean;
	showOfficeUse?: boolean;
	canEditOfficeUse?: boolean;
	initialValues?: Partial<ReimbursementClaimFormValues>;
	initialAttachments?: Partial<ReimbursementClaimAttachments>;
	onSubmit?: (submission: ReimbursementClaimSubmission) => void | Promise<void>;
	onSaveDraft?: (
		submission: ReimbursementClaimSubmission,
	) => void | Promise<void>;
	onBack?: () => void;
	submittedMessage?: string;
	actionText?: string;
	/**
	 * Approval workflow is rendered here but owned by the parent page — pass
	 * the stages you've fetched (e.g. from the workflow module) and handle
	 * the callback the same way you already handle onSubmit/onSaveDraft.
	 */
	approvalStages?: ApprovalStage[];
	canApprove?: boolean;
	onApprovalAction?: (
		stageId: string,
		action: ApprovalActionType,
		comment: string,
	) => void | Promise<void>;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 2,
});

const ReimbursementClaimForm = ({
	mode = "edit",
	canEdit = true,
	showOfficeUse = false,
	canEditOfficeUse = false,
	initialValues,
	initialAttachments,
	onSubmit,
	onSaveDraft,
	onBack,
	submittedMessage,
	actionText = "Submit Claim",
	approvalStages = [],
	canApprove = false,
	onApprovalAction,
}: ReimbursementClaimFormProps) => {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const [lineItems, setLineItems] = useState<ClaimLineItem[]>([]);

	// --- New local fields (not yet part of the shared form hook/types) ---
	const [ticketNumber, setTicketNumber] = useState("");
	const [grade, setGrade] = useState("");
	const [coverageType, setCoverageType] = useState<CoverageType>("");
	const [spouseName, setSpouseName] = useState("");

	const selectedGrade = GRADE_OPTIONS.find((option) => option.value === grade);
	const totalAmountEligible = selectedGrade?.eligibility ?? 0;

	const lineItemsTotal = useMemo(
		() =>
			lineItems.reduce((total, item) => total + (Number(item.amount) || 0), 0),
		[lineItems],
	);

	const withLineItems = (submission: ReimbursementClaimSubmission) => ({
		...submission,
		ticketNumber,
		grade,
		coverageType,
		spouseName:
			coverageType === "SELF" || coverageType === "" ? "" : spouseName,
		totalAmountEligible,
		lineItems: lineItems.map((item) => ({
			...item,
			file: item.file,
			fileName: item.file?.name ?? null,
		})),
		lineItemsTotal,
	});

	const submitWithFeedback = async (
		action: "submit" | "draft",
		submission: ReimbursementClaimSubmission,
	) => {
		const payload = withLineItems(submission);
		console.log(`[Medical Claim] ${action} payload`, payload);

		try {
			if (action === "submit") await onSubmit?.(payload);
			else await onSaveDraft?.(payload);

			showToast({
				type: "success",
				title: "Success",
				description:
					action === "submit"
						? "Medical claim submitted successfully."
						: "Medical claim draft saved successfully.",
			});
		} catch (error) {
			console.error(`[Medical Claim] ${action} failed`, error, payload);
			showToast({
				type: "error",
				title: "Error",
				description:
					action === "submit"
						? "Unable to submit the medical claim. Please try again."
						: "Unable to save the medical claim draft. Please try again.",
			});
			throw error;
		}
	};

	const {
		values,
		attachments,
		errors,
		isLoading,
		isSubmitting,
		isSavingDraft,
		mutationError,
		handleChange,
		handleAttachmentsChange,
		handleSubmit,
		handleSaveDraft,
		handleReset,
	} = useReimbursementClaimForm({
		initialValues,
		initialAttachments,
		onSubmit: onSubmit
			? (submission) => submitWithFeedback("submit", submission)
			: undefined,
		onSaveDraft: onSaveDraft
			? (submission) => submitWithFeedback("draft", submission)
			: undefined,
	});

	useEffect(() => {
		const totalFor = (head: ClaimHead) =>
			lineItems
				.filter((item) => item.claimHead === head)
				.reduce((total, item) => total + (Number(item.amount) || 0), 0)
				.toFixed(2);

		handleChange(
			"numberOfVisits",
			lineItems.some((item) => item.claimHead === "VISIT_FEES") ? "1" : "",
		);
		handleChange("visitFeePerVisit", totalFor("VISIT_FEES"));
		handleChange("doctorMedicineAmount", totalFor("MEDICINES_INVESTIGATIONS"));
		handleChange("injectionInvestigationAmount", "0.00");
		handleChange("ecgXrayOtherAmount", "0.00");
		handleChange("lensCost", totalFor("OPHTHALMIC_TREATMENT"));
		handleChange("frameCost", "0.00");
		handleChange("healthCheckupAmount", totalFor("EXECUTIVE_HEALTH_CHECKUP"));
		handleChange(
			"excessHospitalizationAmount",
			totalFor("EXCESS_HOSPITALISATION"),
		);
	}, [lineItems]);

	const updateLineItem = <K extends keyof ClaimLineItem>(
		id: string,
		field: K,
		value: ClaimLineItem[K],
	) => {
		setLineItems((current) =>
			current.map((item) =>
				item.id === id ? { ...item, [field]: value } : item,
			),
		);
	};

	const handleApprovalWithFeedback = async (
		stageId: string,
		action: ApprovalActionType,
		comment: string,
	) => {
		const payload = { stageId, action, comment };
		console.log("[Medical Claim] approval action payload", payload);

		try {
			await onApprovalAction?.(stageId, action, comment);
			showToast({
				type: "success",
				title: "Success",
				description: "Approval action completed successfully.",
			});
		} catch (error) {
			console.error("[Medical Claim] approval action failed", error, payload);
			showToast({
				type: "error",
				title: "Error",
				description:
					"Unable to complete the approval action. Please try again.",
			});
			throw error;
		}
	};
	const isReadOnly = mode === "view" || !canEdit;
	const fieldMode: ReimbursementClaimFormMode = isReadOnly ? "view" : "edit";
	const officeFieldMode: ReimbursementClaimFormMode =
		mode === "view" || !canEditOfficeUse ? "view" : "edit";

	const wholeNumberChange =
		(field: keyof ReimbursementClaimFormValues) =>
		(event: ChangeEvent<HTMLInputElement>): void => {
			handleChange(field, sanitizeWholeNumberInput(event.target.value));
		};

	const amountChange =
		(field: keyof ReimbursementClaimFormValues) =>
		(event: ChangeEvent<HTMLInputElement>): void => {
			handleChange(field, sanitizeAmountInput(event.target.value));
		};

	const hasActions = !isReadOnly && Boolean(onSubmit || onSaveDraft || onBack);
	const claimStatusLabel = deriveClaimStatusLabel(approvalStages);

	const handleBackToView = () => {
		navigate("/medical-claim/form/view", {
			replace: true,
		});
	};

	const resetAll = () => {
		handleReset();
		setLineItems([]);
		setTicketNumber("");
		setGrade("");
		setCoverageType("");
		setSpouseName("");
	};

	const draftSubmitActions = (
		// !isReadOnly && (onSaveDraft || onSubmit) ? (
		<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
			{/* {onSaveDraft ? ( */}
			<Button
				type="button"
				text={isSavingDraft ? "Saving..." : "Save as Draft"}
				Icon={FilePenLine}
				size="sm"
				appearance="standard"
				variant="outline"
				disabled={isLoading}
				onClick={handleSaveDraft}
			/>
			{/* ) : null} */}
			{/* {onSubmit ? ( */}
			<Button
				type="button"
				text={isSubmitting ? "Submitting..." : actionText}
				Icon={Save}
				size="sm"
				appearance="standard"
				variant="brand"
				disabled={isLoading}
				onClick={handleSubmit}
			/>
			{/* ) : null} */}
		</div>
	);
	// ) : null;

	return (
		<Card
			title={
				<div className="flex items-center justify-between gap-3">
					<p className="text-xs font-bold uppercase tracking-widest text-brand">
						Tata Hitachi Construction Machinery Company Private Limited
					</p>
					{approvalStages.length > 0 ? (
						<span className="shrink-0 rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-iron-dark">
							{claimStatusLabel}
						</span>
					) : null}
				</div>
			}
			secondaryHeader={
				<>
					<div>
						<h1 className="mt-1 text-xl font-semibold tracking-tight text-iron-dark">
							Non-Hospitalisation Claim Form
						</h1>
						<p className="mt-1 text-sm text-muted text-wrap">
							Complete the employee and treatment details below, and attach
							supporting documents against each claim head. Fields marked
							required must be completed before submission.
						</p>
					</div>
					<Button
						onClick={handleBackToView}
						text="View Form"
						size="sm"
						appearance="standard"
						variant="outline"
					/>
				</>
			}
			footer={
				hasActions ? (
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
									disabled={isLoading}
									onClick={onBack}
								/>
							) : null}
						</div>

						<div className="flex flex-col gap-2 sm:flex-row">
							<Button
								type="button"
								text="Reset"
								Icon={RefreshCcw}
								size="sm"
								appearance="standard"
								variant="outline"
								disabled={isLoading}
								onClick={resetAll}
							/>

							{onSaveDraft ? (
								<Button
									type="button"
									text={isSavingDraft ? "Saving..." : "Save as Draft"}
									Icon={FilePenLine}
									size="sm"
									appearance="standard"
									variant="outline"
									disabled={isLoading}
									onClick={handleSaveDraft}
								/>
							) : null}

							{onSubmit ? (
								<Button
									type="button"
									text={isSubmitting ? "Submitting..." : actionText}
									Icon={Save}
									size="sm"
									appearance="standard"
									variant="brand"
									disabled={isLoading}
									onClick={handleSubmit}
								/>
							) : null}
						</div>
					</div>
				) : null
			}
		>
			<form
				className="flex flex-col gap-5"
				noValidate
				onSubmit={(event) => event.preventDefault()}
			>
				{submittedMessage ? (
					<div
						className="flex items-start gap-2 rounded-md border border-border bg-page p-3 text-sm text-iron"
						role="status"
					>
						<CheckCircle2 aria-hidden="true" className="shrink-0" size={18} />
						<span>{submittedMessage}</span>
					</div>
				) : null}

				{mutationError ? (
					<div
						className="rounded-md border border-border bg-page p-3 text-sm text-iron"
						role="alert"
					>
						{mutationError}
					</div>
				) : null}

				<FormHeader title="Employee and Patient Details" Icon={UserRound} />

				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
					<FormInput
						mode={fieldMode}
						name="ticketNumber"
						label="Ticket Number"
						value={ticketNumber}
						required
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							setTicketNumber(event.target.value)
						}
					/>

					<SelectInput
						mode={fieldMode}
						name="grade"
						label="Grade"
						placeholder="Select grade"
						options={GRADE_OPTIONS.map(({ label, value }) => ({
							label,
							value,
						}))}
						value={
							GRADE_OPTIONS.find((option) => option.value === grade)
								? { label: grade, value: grade }
								: null
						}
						onChange={(option) => setGrade((option?.value as string) ?? "")}
					/>

					<FormInput
						mode="view"
						name="totalAmountEligible"
						label="Total Amount Eligible"
						value={currencyFormatter.format(totalAmountEligible)}
						helperText="Calculated automatically from grade."
					/>

					<FormInput
						mode={fieldMode}
						name="employeeName"
						label="Name of Employee"
						value={values.employeeName}
						required
						error={errors.employeeName}
						autoComplete="name"
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							handleChange("employeeName", event.target.value)
						}
					/>

					<FormInput
						mode={fieldMode}
						name="location"
						label="Location"
						value={values.location}
						required
						error={errors.location}
						helperText="Employee work location."
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							handleChange("location", event.target.value)
						}
					/>

					<FormInput
						mode={fieldMode}
						name="patientName"
						label="Name of Patient"
						value={values.patientName}
						required
						error={errors.patientName}
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							handleChange("patientName", event.target.value)
						}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium text-iron-dark">
						Claim Covers
					</span>
					<div className="flex flex-wrap gap-4">
						{COVERAGE_OPTIONS.map((option) => (
							<label
								key={option.value}
								className="flex items-center gap-2 text-sm text-iron"
							>
								<input
									type="radio"
									name="coverageType"
									value={option.value}
									checked={coverageType === option.value}
									disabled={isReadOnly}
									onChange={() => setCoverageType(option.value)}
								/>
								{option.label}
							</label>
						))}
					</div>
				</div>

				{coverageType === "SPOUSE" || coverageType === "BOTH" ? (
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
						<FormInput
							mode={fieldMode}
							name="spouseName"
							label="Spouse Name"
							value={spouseName}
							required
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								setSpouseName(event.target.value)
							}
						/>
					</div>
				) : null}

				<FormHeader title="Domiciliary Details" Icon={Building2} />

				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					<FormInput
						mode="view"
						name="medicalAdvanceAmount"
						label="Medical Advance Taken"
						value={currencyFormatter.format(
							Number(values.medicalAdvanceAmount || 0),
						)}
						helperText="Read-only — pulled from records."
					/>

					<FormInput
						mode="view"
						name="companySettledAmount"
						label="Amount Already Settled This Calendar Year"
						value={currencyFormatter.format(
							Number(values.companySettledAmount || 0),
						)}
						helperText="Read-only — pulled from records."
					/>
				</div>

				<FormHeader title="Claim Heads" Icon={Stethoscope} />

				<section
					className="flex flex-col gap-3"
					aria-label="Claim bill entries"
				>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 className="text-sm font-semibold text-iron-dark">
								Bill line items
							</h2>
							<p className="text-xs text-muted">
								Add one entry for every receipt or bill being claimed.
							</p>
						</div>
						{!isReadOnly ? (
							<Button
								type="button"
								text="New Entry"
								Icon={Plus}
								size="sm"
								appearance="standard"
								variant="outline"
								onClick={() =>
									setLineItems((current) => [...current, createLineItem()])
								}
							/>
						) : null}
					</div>

					{lineItems.length === 0 ? (
						<div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
							No bill entries added. Select{" "}
							<span className="font-medium">New Entry</span> to begin.
						</div>
					) : (
						<div className="overflow-x-auto rounded-md">
							<div className="min-w-[1180px]">
								{lineItems.map((item, index) => (
									<div
										key={item.id}
										className="grid grid-cols-[210px_130px_190px_170px_150px_140px_170px_48px] items-center gap-3 border-b border-border px-3 py-3 last:border-b-0"
									>
										<SelectInput
											mode={fieldMode}
											name={`claimHead-${item.id}`}
											label={`Claim head ${index + 1}`}
											placeholder="Select head"
											options={CLAIM_HEAD_OPTIONS}
											value={
												CLAIM_HEAD_OPTIONS.find(
													(option) => option.value === item.claimHead,
												) ?? null
											}
											onChange={(option) =>
												updateLineItem(
													item.id,
													"claimHead",
													(option?.value as ClaimHead) ?? "",
												)
											}
										/>
										<FormInput
											mode={fieldMode}
											name={`billNumber-${item.id}`}
											label="Bill number"
											value={item.billNumber}
											placeholder="Bill no."
											onChange={(event: ChangeEvent<HTMLInputElement>) =>
												updateLineItem(
													item.id,
													"billNumber",
													event.target.value,
												)
											}
										/>
										<FormInput
											mode={fieldMode}
											name={`billName-${item.id}`}
											label="Receipt or bill name"
											value={item.billName}
											placeholder="Bill name"
											onChange={(event: ChangeEvent<HTMLInputElement>) =>
												updateLineItem(item.id, "billName", event.target.value)
											}
										/>
										<FormInput
											mode={fieldMode}
											name={`name-${item.id}`}
											label="Name"
											value={item.name}
											placeholder="Name"
											onChange={(event: ChangeEvent<HTMLInputElement>) =>
												updateLineItem(item.id, "name", event.target.value)
											}
										/>
										<FormInput
											mode={fieldMode}
											type="date"
											name={`billDate-${item.id}`}
											label="Bill date"
											value={item.billDate}
											onChange={(event: ChangeEvent<HTMLInputElement>) =>
												updateLineItem(item.id, "billDate", event.target.value)
											}
										/>
										<FormInput
											mode={fieldMode}
											name={`amount-${item.id}`}
											label="Amount"
											inputMode="decimal"
											value={item.amount}
											placeholder="0.00"
											onChange={(event: ChangeEvent<HTMLInputElement>) =>
												updateLineItem(
													item.id,
													"amount",
													sanitizeAmountInput(event.target.value),
												)
											}
										/>
										<div className="min-w-0">
											<input
												id={`bill-file-${item.id}`}
												className="sr-only"
												type="file"
												accept=".pdf,.png,.jpg,.jpeg"
												disabled={isReadOnly}
												onChange={(event) =>
													updateLineItem(
														item.id,
														"file",
														event.target.files?.[0] ?? null,
													)
												}
											/>
											<label
												htmlFor={`bill-file-${item.id}`}
												className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-xs text-iron hover:border-brand"
											>
												<Upload size={15} className="shrink-0" />
												<span className="truncate" title={item.file?.name}>
													{item.file?.name ?? "Upload bill"}
												</span>
											</label>
										</div>
										{!isReadOnly ? (
											<button
												type="button"
												className="flex h-10 w-10 items-center justify-center rounded-md text-rejected hover:bg-rejected/10"
												aria-label={`Remove bill entry ${index + 1}`}
												onClick={() =>
													setLineItems((current) =>
														current.filter((entry) => entry.id !== item.id),
													)
												}
											>
												<Trash2 size={17} />
											</button>
										) : (
											<span />
										)}
									</div>
								))}
							</div>
						</div>
					)}
				</section>
				{draftSubmitActions}
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
							{currencyFormatter.format(lineItemsTotal)}
						</output>
					</div>

					{errors.claimedTotal ? (
						<p className="mt-2 text-sm text-rejected" role="alert">
							{errors.claimedTotal}
						</p>
					) : null}
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

					<Checkbox
						name="declarationAccepted"
						className="shrink-0"
						checked={values.declarationAccepted}
						disabled={isReadOnly || isLoading}
						onChange={(event) =>
							handleChange("declarationAccepted", event?.valueOf() as boolean)
						}
						label="I confirm and accept the declaration above."
					/>

					{errors.declarationAccepted ? (
						<p className="text-sm text-rejected" role="alert">
							{errors.declarationAccepted}
						</p>
					) : null}

					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<FormInput
							mode={fieldMode}
							name="employeeSignature"
							label="Signature of Employee"
							value={values.employeeSignature}
							required
							error={errors.employeeSignature}
							helperText="Type your full name as your electronic signature."
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								handleChange("employeeSignature", event.target.value)
							}
						/>

						<FormInput
							mode={fieldMode}
							type="date"
							name="claimDate"
							label="Date"
							value={values.claimDate}
							required
							error={errors.claimDate}
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								handleChange("claimDate", event.target.value)
							}
						/>
					</div>
				</div>

				{approvalStages.length > 0 ? (
					<fieldset className="min-w-0 rounded-md border border-border p-4">
						<legend className="sr-only">Approval Status</legend>
						<ApprovalSection
							stages={approvalStages}
							canApprove={canApprove}
							onAction={
								onApprovalAction ? handleApprovalWithFeedback : undefined
							}
						/>
					</fieldset>
				) : null}

				{showOfficeUse ? (
					<fieldset className="min-w-0">
						<legend className="sr-only">For Office Use</legend>
						<FormHeader title="For Office Use" Icon={Building2} />

						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
							<FormInput
								mode={officeFieldMode}
								name="officeReference"
								label="Employee Reference"
								value={values.officeReference}
								onChange={(event: ChangeEvent<HTMLInputElement>) =>
									handleChange("officeReference", event.target.value)
								}
							/>

							<FormInput
								mode={officeFieldMode}
								name="officeVisitFeesAmount"
								label="A. Visit Fees Passed"
								value={values.officeVisitFeesAmount}
								inputMode="decimal"
								error={errors.officeVisitFeesAmount}
								onChange={amountChange("officeVisitFeesAmount")}
							/>

							<FormInput
								mode={officeFieldMode}
								name="officeMedicalAmount"
								label="B. Medical Passed"
								value={values.officeMedicalAmount}
								inputMode="decimal"
								error={errors.officeMedicalAmount}
								onChange={amountChange("officeMedicalAmount")}
							/>

							<FormInput
								mode={officeFieldMode}
								name="officeOphthalmicAmount"
								label="C. Ophthalmic Passed"
								value={values.officeOphthalmicAmount}
								inputMode="decimal"
								error={errors.officeOphthalmicAmount}
								onChange={amountChange("officeOphthalmicAmount")}
							/>

							<FormInput
								mode={officeFieldMode}
								name="officeHealthCheckupAmount"
								label="D. Health Check-up Passed"
								value={values.officeHealthCheckupAmount}
								inputMode="decimal"
								error={errors.officeHealthCheckupAmount}
								onChange={amountChange("officeHealthCheckupAmount")}
							/>

							<FormInput
								mode={officeFieldMode}
								name="officeExcessHospitalizationAmount"
								label="E. Excess Hospitalisation Passed"
								value={values.officeExcessHospitalizationAmount}
								inputMode="decimal"
								error={errors.officeExcessHospitalizationAmount}
								onChange={amountChange("officeExcessHospitalizationAmount")}
							/>

							<FormInput
								mode={officeFieldMode}
								name="passedBy"
								label="Passed By"
								value={values.passedBy}
								onChange={(event: ChangeEvent<HTMLInputElement>) =>
									handleChange("passedBy", event.target.value)
								}
							/>

							<FormInput
								mode={officeFieldMode}
								name="passedAmount"
								label="Passed Amount"
								value={values.passedAmount}
								inputMode="decimal"
								error={errors.passedAmount}
								onChange={amountChange("passedAmount")}
							/>

							<FormInput
								mode={officeFieldMode}
								type="date"
								name="passedDate"
								label="Passed Date"
								value={values.passedDate}
								onChange={(event: ChangeEvent<HTMLInputElement>) =>
									handleChange("passedDate", event.target.value)
								}
							/>
						</div>
					</fieldset>
				) : null}
			</form>
		</Card>
	);
};

export default ReimbursementClaimForm;
