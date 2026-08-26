import React, { type ChangeEvent } from "react";
import {
	ArrowLeft,
	BadgeIndianRupee,
	CheckCircle2,
	FilePenLine,
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

export type ReimbursementClaimFormProps = UseReimbursementClaimFormArgs;

const ReimbursementClaimFormContent = () => {
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
				<div className="grid grid-cols-1 gap-3 px-4.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
					<FormInput
						mode={fieldMode}
						name="ticketNumber"
						label="Ticket Number"
						value={values.ticketNumber}
						error={errors.ticketNumber}
						disabled={isReadOnly}
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
						mode="view"
						name="totalAmountEligible"
						label="Total Amount Eligible"
						value={currencyFormatter.format(resolvedEligibleAmount)}
						helperText="Calculated automatically from grade."
					/>
					<FormInput
						mode="view"
						name="companySettledAmount"
						label="Amount Settled This Year"
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
					<div className="flex flex-col gap-2">
						<div className="flex flex-wrap gap-4 px-2.5">
							{COVERAGE_OPTIONS.map((option) => (
								<FormInput
									key={option.value}
									id={`coverage-${option.value}`}
									type="radio"
									label={option.label}
									name="coverageType"
									value={option.value}
									checked={values.coverageType === option.value}
									disabled={isReadOnly}
									onChange={() => handleChange("coverageType", option.value)}
									invalidRadio={errors.coverageType}
								/>
							))}
						</div>
						{errors.coverageType ? (
							<p className="form-error-text">{errors.coverageType}</p>
						) : null}
					</div>
					<FormInput
						mode={fieldMode}
						name="employeeName"
						label="Name of Employee"
						value={values.employeeName}
						disabled
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
		...(commentsSection
			? [
					{
						id: "comments",
						title: "Comments",
						Icon: MessageSquareText,
						defaultExpanded: true,
						children: commentsSection,
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
							<span>Medical Claim Form</span>
							<span>/ {referenceNumber} /</span>
							<Badge status={claimStatusLabel} />
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
	const controller = useReimbursementClaimForm(props);

	return (
		<ReimbursementClaimFormContext.Provider value={controller}>
			<ReimbursementClaimFormContent />
		</ReimbursementClaimFormContext.Provider>
	);
};

export default ReimbursementClaimForm;
