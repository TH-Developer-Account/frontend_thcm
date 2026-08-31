import { type ChangeEvent } from "react";
import {
	ArrowLeft,
	BadgeIndianRupee,
	CheckCircle2,
	FileDown,
	FilePenLine,
	FileSpreadsheet,
	GitBranch,
	MessageSquareText,
	RefreshCcw,
	Save,
	Stethoscope,
	UserRound,
} from "lucide-react";

import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card, { type CardSection } from "../../../components/common/Card";
import DatePickerInput from "../../../components/common/DatePickerInput";
import Checkbox from "../../../components/forms/Checkbox";
import FormInput from "../../../components/forms/FormInput";
import Radio from "../../../components/forms/Radio";
import SelectInput from "../../../components/forms/SelectInput";
import { ReasonActionModal } from "../../../components/ui/ReasonActionModal";
import {
	COVERAGE_OPTIONS,
	GRADE_OPTIONS,
	ReimbursementClaimFormContext,
	currencyFormatter,
	toDatePickerValue,
	toDateString,
	useReimbursementClaimForm,
	useReimbursementClaimFormContext,
	type UseReimbursementClaimFormArgs,
} from "../hooks/useReimbursementClaimForm";
import ClaimHeadEntryTable from "./ClaimHeadEntryTable";
import NavigateButton from "../../../components/common/NavigateButton";
import type { ActionMenuItem } from "../../../components/common/ActionMenu";
import ActionMenu from "../../../components/common/ActionMenu";

export type ReimbursementClaimFormProps = UseReimbursementClaimFormArgs & {
	claimId?: string;
	isExportingExcel?: boolean;
	handleExport?: () => void | Promise<void>;
	isPreparingPdf?: boolean;
	isDownloadingPdf?: boolean;
	handleViewPdf?: () => void | Promise<void>;
	handleDownloadPdf?: () => void | Promise<void>;
};

type ReimbursementClaimFormContentProps = {
	claimId?: string;
	isExportingExcel?: boolean;
	handleExport?: () => void | Promise<void>;
	isPreparingPdf?: boolean;
	isDownloadingPdf?: boolean;
	handleViewPdf?: () => void | Promise<void>;
	handleDownloadPdf?: () => void | Promise<void>;
};

const ReimbursementClaimFormContent = ({
	claimId,
	isExportingExcel,
	handleExport,
	isPreparingPdf,
	isDownloadingPdf,
	handleDownloadPdf,
}: ReimbursementClaimFormContentProps) => {
	const {
		values,
		errors,
		referenceNumber,
		isLoading,
		isSubmitting,
		isSavingDraft,
		selectedGrade,
		resolvedEligibleAmount,
		lineItemsTotal,
		isReadOnly,
		canEditClaimForm,
		fieldMode,
		claimStatusLabel,
		canCompleteStage,
		mode,
		canApprove,
		canClarify,
		isExternalApprover,
		approvalActionLoading,
		onBack,
		submittedMessage,
		actionText,
		commentsSection,
		auditSection,
		workflowSection,
		hasSubmitAction,
		hasSaveDraftAction,
		hasApproveStageAction,
		hasClarifyStageAction,
		handleChange,
		handleSubmit,
		handleSaveDraft,
		handleReset,
		clarifyModalOpen,
		clarifyLoading,
		setClarifyModalOpen,
		buildClarifyReasonPrefix,
		handleClarifyConfirm,
		handleApproveStage,
	} = useReimbursementClaimFormContext();

	const sections: CardSection[] = [
		{
			id: "employee-details",
			title: "Employee and Patient Details",
			// subtitle: "Employee information and annual claim eligibility.",
			Icon: UserRound,
			defaultExpanded: true,
			children: (
				<div className="grid grid-cols-1 gap-3 px-4.5 items-center sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-5">
					<FormInput
						mode={fieldMode}
						name="ticketNumber"
						label="Ticket Number"
						value={values.ticketNumber}
						error={errors.ticketNumber}
						// disabled={isReadOnly}
						helperText="Ticket Number from grade."
						required
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							handleChange("ticketNumber", event.target.value)
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
							selectedGrade
								? { label: selectedGrade.label, value: selectedGrade.value }
								: null
						}
						error={errors.grade}
						onChange={(option) => handleChange("grade", option?.value ?? "")}
					/>
					<FormInput
						mode={fieldMode}
						name="totalAmountEligible"
						label="Total Amount Eligible"
						value={currencyFormatter.format(resolvedEligibleAmount)}
						helperText="Calculated automatically from grade."
					/>
					<FormInput
						mode={fieldMode}
						name="companySettledAmount"
						label="Amount Settled This Year"
						value={currencyFormatter.format(
							Number(values.companySettledAmount || 0),
						)}
						helperText="Read-only — pulled from records."
					/>
					<FormInput
						mode={fieldMode}
						name="companyRemainingAmount"
						label="Amount Remaining This Year"
						value={currencyFormatter.format(
							Number(values.companySettledAmount || 0),
						)}
						helperText="Read-only — pulled from records."
					/>
				</div>
			),
		},
		{
			id: "coverage-type",
			title: "Coverage Type",
			// subtitle: "Select the patient covered by this claim.",
			Icon: UserRound,
			defaultExpanded: true,
			children: (
				<div className="grid grid-cols-1 items-center gap-3 px-4.5 sm:grid-cols-2 xl:grid-cols-4">
					<Radio
						groupLabel="Coverage Type"
						name="coverageType"
						options={COVERAGE_OPTIONS}
						selectedValue={values.coverageType}
						disabled={isReadOnly}
						error={errors.coverageType}
						required
						onChange={(value) =>
							handleChange(
								"coverageType",
								value as (typeof COVERAGE_OPTIONS)[number]["value"],
							)
						}
					/>
					<FormInput
						mode={fieldMode}
						name="employeeName"
						label="Name of Employee"
						value={values.employeeName}
						required
						error={errors.employeeName}
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							handleChange("employeeName", event.target.value)
						}
					/>
					{values.coverageType === "SPOUSE" ||
					values.coverageType === "BOTH" ? (
						<FormInput
							mode={fieldMode}
							name="spouseName"
							label="Spouse Name"
							value={values.spouseName}
							required
							error={errors.spouseName}
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								handleChange("spouseName", event.target.value)
							}
						/>
					) : null}
					<FormInput
						mode={fieldMode}
						name="location"
						label="Location"
						value={values.location}
						required
						error={errors.location}
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							handleChange("location", event.target.value)
						}
					/>
				</div>
			),
		},
		{
			id: "claim-heads",
			title: "Claim Heads",
			// subtitle: "Add and review the bills included in this claim.",
			Icon: Stethoscope,
			actions: (
				<span className="text-sm font-semibold text-iron-dark">
					Claimed total: {currencyFormatter.format(lineItemsTotal)}
				</span>
			),
			defaultExpanded: true,
			children: <ClaimHeadEntryTable />,
		},
		...(mode === "edit"
			? [
					{
						id: "declaration-signature",
						title: "Declaration and Signature",
						Icon: BadgeIndianRupee,
						defaultExpanded: true,
						children: (
							<div className="flex flex-col gap-3 px-4.5">
								<p className="text-sm leading-6 text-iron">
									I confirm that I have kept the Company informed in writing of
									all changes in the status of my dependants covered under the
									Health Scheme. I declare that the information provided in this
									claim is true and complete in every respect.
								</p>
								<Checkbox
									name="declarationAccepted"
									className="shrink-0"
									checked={values.declarationAccepted}
									disabled={isReadOnly || isLoading}
									onChange={(checked) =>
										handleChange("declarationAccepted", checked)
									}
									label="I confirm and accept the declaration above."
									error={errors.declarationAccepted}
								/>
								<div className="relative grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
									<DatePickerInput
										label="Date"
										mode="single"
										value={toDatePickerValue(values.claimDate)}
										onChange={(nextValue) => {
											if (nextValue instanceof Date) {
												handleChange("claimDate", toDateString(nextValue));
											}
										}}
										error={errors.claimDate}
										placeholder="Date"
										disabled={isReadOnly}
										toDate={new Date()}
									/>
								</div>
							</div>
						),
					},
				]
			: []),
		...(workflowSection
			? [
					{
						id: "approval-workflow",
						title: "Approval Workflow",
						Icon: GitBranch,
						defaultExpanded: true,
						children: workflowSection,
					},
				]
			: []),
		...(commentsSection
			? [
					{
						id: "chat",
						title: "Chat Section",
						Icon: MessageSquareText,
						defaultExpanded: true,
						children: commentsSection,
					},
				]
			: []),
		...(auditSection
			? [
					{
						id: "audit",
						title: "Audit Messages",
						Icon: MessageSquareText,
						defaultExpanded: true,
						children: auditSection,
					},
				]
			: []),
	];
	const showButtons = canEditClaimForm || canApprove || canClarify;
	const claimActions: ActionMenuItem<string>[] = [
		{
			id: "download-pdf",
			label: isDownloadingPdf ? "Downloading…" : "PDF",
			Icon: FileDown,
			onClick: () => void handleDownloadPdf?.(),
			disabled: isDownloadingPdf || isPreparingPdf,
		},
		{
			id: "export-excel",
			label: isExportingExcel ? "Exporting…" : "Excel",
			Icon: FileSpreadsheet,
			onClick: () => void handleExport?.(),
			disabled: isExportingExcel || !handleExport,
		},
	];
	return (
		<>
			<form
				className="flex flex-col gap-5"
				noValidate
				onSubmit={(event) => event.preventDefault()}
			>
				<Card
					title={
						<div className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight text-iron-dark">
							<NavigateButton direction="back" />
							<span>Medical Claim Form </span>
							{referenceNumber ? <span>/ {referenceNumber} /</span> : null}
							<Badge status={claimStatusLabel} />
						</div>
					}
					actions={
						claimId ? (
							<ActionMenu
								size="xs"
								row={claimId}
								actions={claimActions}
								ariaLabel="Reimbursement claim actions"
								triggerLabel="Export"
								triggerVariant="brand"
							/>
						) : null
					}
					footer={
						showButtons && (
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

								{canEditClaimForm ? (
									<div className="flex flex-col gap-2 sm:flex-row">
										<Button
											type="button"
											text="Reset"
											Icon={RefreshCcw}
											size="sm"
											appearance="standard"
											variant="outline"
											disabled={isLoading}
											onClick={handleReset}
										/>
										{hasSaveDraftAction ? (
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
										{hasSubmitAction ? (
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
								) : null}

								{canApprove || canClarify ? (
									<div className="flex flex-col gap-2 sm:flex-row">
										{canClarify && hasClarifyStageAction ? (
											<Button
												type="button"
												text="Send for Clarification"
												size="sm"
												appearance="standard"
												variant="outline"
												disabled={approvalActionLoading}
												onClick={() => setClarifyModalOpen(true)}
											/>
										) : null}
										{canApprove && hasApproveStageAction ? (
											<Button
												type="button"
												text={isExternalApprover ? "OK and Close" : "Approve"}
												size="sm"
												appearance="standard"
												variant="brand"
												isTooltip="Please approve all line items to approve this form"
												disabled={approvalActionLoading || !canCompleteStage}
												onClick={() => void handleApproveStage?.()}
											/>
										) : null}
									</div>
								) : null}
							</div>
						)
					}
					secondaryHeader={
						submittedMessage ? (
							<div
								className="flex items-start gap-2 rounded-md border border-border bg-page p-3 text-sm text-iron"
								role="status"
							>
								<CheckCircle2
									aria-hidden="true"
									className="shrink-0"
									size={18}
								/>
								<span>{submittedMessage}</span>
							</div>
						) : null
					}
					sections={sections}
					padding="none"
				/>
			</form>

			<ReasonActionModal
				open={clarifyModalOpen}
				mode="clarify-workflow"
				loading={clarifyLoading}
				defaultReason={buildClarifyReasonPrefix()}
				onClose={() => setClarifyModalOpen(false)}
				onConfirm={handleClarifyConfirm}
			/>
		</>
	);
};

const ReimbursementClaimForm = (props: ReimbursementClaimFormProps) => {
	const {
		claimId,
		isExportingExcel,
		handleExport,
		isPreparingPdf,
		isDownloadingPdf,
		handleViewPdf,
		handleDownloadPdf,
		...formArgs
	} = props;

	const controller = useReimbursementClaimForm(formArgs);

	return (
		<ReimbursementClaimFormContext.Provider value={controller}>
			<ReimbursementClaimFormContent
				claimId={claimId}
				isExportingExcel={isExportingExcel}
				handleExport={handleExport}
				isPreparingPdf={isPreparingPdf}
				isDownloadingPdf={isDownloadingPdf}
				handleViewPdf={handleViewPdf}
				handleDownloadPdf={handleDownloadPdf}
			/>
		</ReimbursementClaimFormContext.Provider>
	);
};

export default ReimbursementClaimForm;
