import type { ChangeEvent } from "react";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "../../../components/common/Badge";
import Card from "../../../components/common/Card";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";
import {
	COVERAGE_OPTIONS,
	useReimbursementClaimFormContext,
} from "../hooks/useReimbursementClaimForm";
import ClaimActions, {
	useHasClaimActions,
	type ClaimActionsVariant,
} from "./ClaimActions";

type ClaimEmployeeCardProps = {
	/** Show the claimant action buttons in this card's footer (tabbed view). */
	actionsVariant?: Extract<ClaimActionsVariant, "claimant" | "none">;
};

/** Avatar header (name + HR-set chips) and the fields the claimant fills. */
export const ClaimEmployeeCard = ({
	actionsVariant = "none",
}: ClaimEmployeeCardProps) => {
	const {
		values,
		errors,
		gradeOptions,
		selectedGrade,
		isGradeLocked,
		isReadOnly,
		canEditClaimForm,
		fieldMode,
		submittedMessage,
		handleChange,
	} = useReimbursementClaimFormContext();

	const hasActions = useHasClaimActions(actionsVariant);

	const showSpouse =
		values.coverageType === "SPOUSE" || values.coverageType === "BOTH";

	const employeeName = values.employeeName.trim();
	const avatarInitial = (employeeName[0] ?? "?").toUpperCase();
	const gradeLabel = selectedGrade?.label ?? values.grade;
	// Grade comes from HR when on record; only a claim without one can pick it.
	const showGradeSelect = !isGradeLocked && canEditClaimForm;

	return (
		<Card
			title={
				<div className="flex items-center gap-4 px-5 py-4">
					<div
						aria-hidden="true"
						className="grid size-12 shrink-0 place-items-center rounded-full bg-slate-800 text-lg font-semibold text-white"
					>
						{avatarInitial}
					</div>

					<div className="min-w-0">
						<h3
							className="truncate text-lg font-semibold leading-tight text-iron-dark"
							title={employeeName || undefined}
						>
							{employeeName || "--"}
						</h3>

						{errors.employeeName ? (
							<p role="alert" className="mt-0.5 text-xs text-red-600">
								{errors.employeeName}
							</p>
						) : null}

						<div className="mt-1.5 flex flex-wrap items-center gap-2">
							<Badge variant={"pending"}>
								Ticket {values.ticketNumber || "--"}
							</Badge>

							{gradeLabel && !showGradeSelect ? (
								<Badge variant={"success"}>Grade {gradeLabel}</Badge>
							) : null}
							{values.ticketNumber || isGradeLocked ? (
								<Badge variant={"danger"}> Set by HR</Badge>
							) : null}
						</div>
					</div>
				</div>
			}
			padding="none"
			footer={
				hasActions ? <ClaimActions variant="claimant" /> : undefined
			}
		>
			<div className="flex flex-col gap-4 p-4">
				{submittedMessage ? (
					<div
						className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-iron"
						role="status"
					>
						<CheckCircle2 aria-hidden="true" className="shrink-0" size={18} />
						<span>{submittedMessage}</span>
					</div>
				) : null}

				<section aria-label="Employee details" className="min-w-0">
					<div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
						{showGradeSelect ? (
							<SelectInput
								mode={fieldMode}
								name="grade"
								label="Grade"
								placeholder="Select grade"
								options={gradeOptions.map(({ label, value }) => ({
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
						) : (
							// Grade already on record (set by HR): read-only input.
							<FormInput
								mode="view"
								name="grade"
								label="Grade"
								value={gradeLabel || "--"}
								onChange={() => undefined}
							/>
						)}

						<FormInput
							mode={fieldMode}
							name="location"
							label="Location"
							value={values.location}
							required={canEditClaimForm}
							maxLength={100}
							error={errors.location}
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								handleChange("location", event.target.value)
							}
						/>

						{/* Coverage type: segmented control */}
						<div className="flex flex-col gap-1.5">
							<span
								id="coverage-type-label"
								className="text-sm font-medium text-iron-dark"
							>
								Coverage type
								{canEditClaimForm ? (
									<span className="text-red-500"> *</span>
								) : null}
							</span>
							<div
								role="radiogroup"
								aria-labelledby="coverage-type-label"
								aria-invalid={Boolean(errors.coverageType)}
								className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1"
							>
								{COVERAGE_OPTIONS.map((option) => {
									const selected = values.coverageType === option.value;
									return (
										<button
											key={option.value}
											type="button"
											role="radio"
											aria-checked={selected}
											disabled={isReadOnly}
											onClick={() => handleChange("coverageType", option.value)}
											className={`rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed ${
												selected
													? "bg-white font-semibold text-orange-600 shadow-sm"
													: "font-medium text-slate-500 hover:text-iron-dark"
											} ${isReadOnly && !selected ? "opacity-60" : ""}`}
										>
											{option.label}
										</button>
									);
								})}
							</div>
							{errors.coverageType ? (
								<p role="alert" className="text-xs text-red-600">
									{errors.coverageType}
								</p>
							) : null}
						</div>

						{showSpouse ? (
							<FormInput
								mode={fieldMode}
								name="spouseName"
								label="Spouse Name"
								value={values.spouseName}
								required={canEditClaimForm}
								maxLength={100}
								error={errors.spouseName}
								onChange={(event: ChangeEvent<HTMLInputElement>) =>
									handleChange("spouseName", event.target.value)
								}
							/>
						) : null}
					</div>
				</section>
			</div>
		</Card>
	);
};

export default ClaimEmployeeCard;
