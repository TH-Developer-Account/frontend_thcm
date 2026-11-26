// modules/audit/dealerAudit/pages/CreateAuditCyclePage.tsx
//
// Four-step wizard that launches an audit cycle:
//   1 Cycle details → 2 Select dealers (all business partners, eligibility
//   from the server) → 3 Assign reviewers → 4 Confirm & launch.
//
// State is one local draft (cross-step, not server state). Each "Next"
// validates only the current step; "Launch" re-validates everything and
// jumps back to the first broken step. The backend re-checks every rule.

import { ArrowLeft, ArrowRight, Rocket } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert } from "../../../../components/common/Alert";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import { StepProgress } from "../../../../components/ui/StepProgress";
import PageNavigation from "../../../../components/ui/PageNavigation/PageNavigation";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import {
	CycleConfirmStep,
	CycleDealersStep,
	CycleDetailsStep,
	CycleReviewersStep,
} from "../cycle/components/CycleWizardSteps";
import {
	dealerCycleContent as content,
	formatCycleMessage as format,
} from "../cycle/dealer-cycle.content";
import { autoAssignReviewers } from "../cycle/dealer-cycle.logic";
import {
	findFirstInvalidStep,
	validateCycleDealers,
	validateCycleDetails,
	validateCycleReviewers,
	type CycleStepErrors,
} from "../cycle/dealer-cycle.schemas";
import type {
	CreateAuditCycleFormValues,
	CycleWizardStepId,
	ReviewerAssignSource,
} from "../cycle/dealer-cycle.types";
import {
	useDealerCandidates,
	useLaunchAuditCycle,
	useReviewerWorkload,
} from "../cycle/hooks/useDealerCycle";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { getPeriodOf } from "../dealer-audit.sla";
import { useDealerChecklistTemplates } from "../hooks/useDealerChecklistTemplates";

const text = content.wizard;

const STEP_ORDER: readonly CycleWizardStepId[] = [
	"DETAILS",
	"DEALERS",
	"REVIEWERS",
	"CONFIRM",
];
const STEPS = STEP_ORDER.map((id, index) => ({
	id: index + 1,
	label: text.steps[id].label,
}));

// Module-level so the template query key stays stable between renders.
const PUBLISHED_TEMPLATES = {
	page: 1,
	pageSize: 100,
	search: "",
	statuses: ["PUBLISHED"],
	facilityTypes: [],
	sortBy: "name",
	sortOrder: "asc",
} as const;

const createInitialValues = (): CreateAuditCycleFormValues => {
	const period = getPeriodOf(new Date(), "QUARTERLY");
	return {
		name: "",
		templateId: "",
		periodType: "QUARTERLY",
		year: period.year,
		quarter: period.quarter,
		dueDate: "",
		dealerIds: [],
		reviewerByDealer: {},
		fallbackReviewerId: "",
	};
};

export default function CreateAuditCyclePage() {
	const navigate = useNavigate();
	const [values, setValues] =
		useState<CreateAuditCycleFormValues>(createInitialValues);
	const [stepIndex, setStepIndex] = useState(0);
	const [errors, setErrors] = useState<CycleStepErrors>({});
	// How each reviewer was chosen (Auto / Manual). Display only, never sent.
	const [sourceByDealer, setSourceByDealer] = useState<
		Record<string, ReviewerAssignSource>
	>({});
	const [isDirty, setIsDirty] = useState(false);
	const step = STEP_ORDER[stepIndex];

	const templates = useDealerChecklistTemplates({
		...PUBLISHED_TEMPLATES,
		statuses: [...PUBLISHED_TEMPLATES.statuses],
		facilityTypes: [],
	});
	const workload = useReviewerWorkload(stepIndex >= 2);
	const launch = useLaunchAuditCycle();

	const template = templates.rows.find((row) => row.id === values.templateId);
	const period = useMemo(
		() => ({
			type: values.periodType,
			year: values.year,
			quarter: values.periodType === "YEARLY" ? null : values.quarter,
		}),
		[values.periodType, values.year, values.quarter],
	);
	const periodShort =
		values.periodType === "YEARLY"
			? `FY ${values.year}`
			: `Q${values.quarter ?? ""}`;

	const candidates = useDealerCandidates({
		enabled: stepIndex >= 1,
		templateId: values.templateId,
		period,
	});
	const dealerList = candidates.dealers;
	const zoneByDealer = useMemo(
		() =>
			Object.fromEntries(dealerList.map((dealer) => [dealer.id, dealer.zone])),
		[dealerList],
	);

	const ineligibleIds = useMemo(
		() =>
			new Set(
				candidates.eligibility
					.filter((e) => !e.isEligible)
					.map((e) => e.dealerId),
			),
		[candidates.eligibility],
	);

	// A dealer that became ineligible (period / checklist changed after it was
	// ticked) is dropped here, not left as a silent blocker.
	const effectiveValues = useMemo<CreateAuditCycleFormValues>(
		() => ({
			...values,
			dealerIds: values.dealerIds.filter((id) => !ineligibleIds.has(id)),
		}),
		[values, ineligibleIds],
	);

	const templateOptions = useMemo(
		() =>
			templates.rows.map((row) => ({
				value: row.id,
				label: `${row.name} · v${row.version}`,
			})),
		[templates.rows],
	);

	// Warn before a refresh / tab close throws away the user's choices.
	useEffect(() => {
		if (!isDirty || launch.isPending) return;
		const handler = (event: BeforeUnloadEvent): void => {
			event.preventDefault();
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [isDirty, launch.isPending]);

	const patch = useCallback(
		(change: Partial<CreateAuditCycleFormValues>): void => {
			setValues((current) => ({ ...current, ...change }));
			setIsDirty(true);
			setErrors({});
		},
		[],
	);

	const validateStep = (id: CycleWizardStepId): CycleStepErrors => {
		switch (id) {
			case "DETAILS":
				return validateCycleDetails(effectiveValues);
			case "DEALERS":
				return validateCycleDealers(effectiveValues, ineligibleIds);
			case "REVIEWERS":
				return validateCycleReviewers(effectiveValues);
			case "CONFIRM":
				return {};
		}
	};

	const goTo = (id: CycleWizardStepId): void => {
		setErrors({});
		setStepIndex(STEP_ORDER.indexOf(id));
	};

	const handleNext = (): void => {
		const found = validateStep(step);
		if (Object.keys(found).length > 0) {
			setErrors(found);
			return;
		}
		// Make sure every selected dealer starts with a sensible reviewer.
		setErrors({});
		setStepIndex((index) => Math.min(index + 1, STEP_ORDER.length - 1));
	};

	const handleBack = (): void => {
		if (stepIndex === 0) {
			navigate(DEALER_AUDIT_ROUTES.tracker);
			return;
		}
		setErrors({});
		setStepIndex((index) => index - 1);
	};

	/** Zone-aware, load-balanced. Hand-picked reviewers are left alone. */
	const handleAutoAssign = (): void => {
		const manual = Object.fromEntries(
			effectiveValues.dealerIds.flatMap((id) => {
				const reviewerId = values.reviewerByDealer[id];
				return reviewerId && sourceByDealer[id] !== "AUTO"
					? [[id, reviewerId]]
					: [];
			}),
		);
		const assigned = autoAssignReviewers({
			dealerIds: effectiveValues.dealerIds,
			reviewers: workload.reviewers,
			dealerZones: zoneByDealer,
			keep: manual,
		});
		setSourceByDealer((current) => ({
			...current,
			...Object.fromEntries(
				Object.keys(assigned).map((id) => [
					id,
					id in manual ? "MANUAL" : "AUTO",
				]),
			),
		}));
		patch({ reviewerByDealer: assigned });
	};

	const setReviewers = (
		dealerIds: readonly string[],
		reviewerId: string,
	): void => {
		const next = { ...values.reviewerByDealer };
		for (const id of dealerIds) {
			if (reviewerId) next[id] = reviewerId;
			else delete next[id];
		}
		setSourceByDealer((current) => ({
			...current,
			...Object.fromEntries(dealerIds.map((id) => [id, "MANUAL" as const])),
		}));
		patch({ reviewerByDealer: next });
	};

	const handleLaunch = async (): Promise<void> => {
		launch.reset();
		const firstInvalid = findFirstInvalidStep(effectiveValues, ineligibleIds);
		if (firstInvalid) {
			setErrors(validateStep(firstInvalid));
			setStepIndex(STEP_ORDER.indexOf(firstInvalid));
			return;
		}
		try {
			await launch.mutateAsync(effectiveValues);
			setIsDirty(false);
			navigate(DEALER_AUDIT_ROUTES.tracker);
		} catch {
			// Shown through `launch.error`; the draft stays exactly as typed.
		}
	};

	const isLast = step === "CONFIRM";
	const hasMasterError =
		templates.isError || candidates.isError || workload.isError;

	return (
		<PageSectionLayout className="audit-page">
			<header className="flex items-start gap-3">
				<PageNavigation
					variant="button"
					direction="back"
					ariaLabel={text.cancel}
					to={DEALER_AUDIT_ROUTES.tracker}
				/>
				<div>
					<p className="text-xs font-semibold tracking-wide text-(--color-text-secondary)">
						{text.eyebrow}
					</p>
					<h1 className="text-lg font-semibold text-(--color-text-primary)">
						{text.title}
					</h1>
					<p className="text-sm text-(--color-text-secondary)">
						{text.subtitle}
					</p>
				</div>
			</header>

			<div className="audit-stack">
				{hasMasterError ? (
					<Alert
						variant="error"
						type="banner"
						title={content.common.loadError}
						primaryAction={{
							label: content.common.retry,
							onClick: () => {
								void templates.refetch();
								void candidates.refetch();
								void workload.refetch();
							},
						}}
					/>
				) : null}

				<Card
					variant="default"
					padding="default"
					title={
						<StepProgress
							steps={STEPS}
							currentStep={stepIndex + 1}
							ariaLabel={text.title}
						/>
					}
					headerClassName="border-none"
					footer={
						<div className="flex flex-wrap items-center justify-between gap-2">
							<Button
								type="button"
								text={stepIndex === 0 ? text.cancel : text.back}
								Icon={ArrowLeft}
								appearance="standard"
								variant="outline"
								size="lg"
								disabled={launch.isPending}
								onClick={handleBack}
							/>
							{step === "DEALERS" ? (
								<p
									className="text-sm text-(--color-text-secondary)"
									aria-live="polite"
								>
									{format(text.dealers.footerSelected, {
										count: effectiveValues.dealerIds.length,
									})}
								</p>
							) : null}
							{isLast ? (
								<Button
									type="button"
									text={launch.isPending ? text.launching : text.launch}
									Icon={Rocket}
									appearance="standard"
									variant="brand"
									size="lg"
									loading={launch.isPending}
									onClick={() => void handleLaunch()}
								/>
							) : (
								<Button
									type="button"
									text={text.nextLabels[step]}
									Icon={ArrowRight}
									iconPosition="right"
									appearance="standard"
									variant="brand"
									size="lg"
									onClick={handleNext}
								/>
							)}
						</div>
					}
				>
					<div className="space-y-4">
						<div aria-live="polite">
							<p className="text-xs font-medium text-(--color-text-secondary)">
								{format(text.stepOf, {
									current: stepIndex + 1,
									total: STEP_ORDER.length,
								})}
							</p>
							<p className="text-sm text-(--color-text-primary)">
								{text.steps[step].help}
							</p>
						</div>

						{step === "DETAILS" ? (
							<CycleDetailsStep
								values={values}
								errors={errors}
								templateOptions={templateOptions}
								isLoadingTemplates={templates.isLoading}
								isDisabled={launch.isPending}
								onChange={patch}
							/>
						) : null}

						{step === "DEALERS" ? (
							<CycleDealersStep
								dealers={dealerList}
								eligibility={candidates.eligibility}
								selectedIds={effectiveValues.dealerIds}
								error={errors.dealerIds}
								isLoading={candidates.isLoading}
								isDisabled={launch.isPending}
								periodType={values.periodType}
								periodShort={periodShort}
								onChange={(dealerIds) => patch({ dealerIds })}
							/>
						) : null}

						{step === "REVIEWERS" ? (
							<CycleReviewersStep
								dealers={dealerList}
								reviewers={workload.reviewers}
								selectedIds={effectiveValues.dealerIds}
								reviewerByDealer={values.reviewerByDealer}
								sourceByDealer={sourceByDealer}
								fallbackReviewerId={values.fallbackReviewerId}
								error={errors.reviewerByDealer}
								isDisabled={launch.isPending || workload.isLoading}
								onAutoAssign={handleAutoAssign}
								onChange={(dealerId, reviewerId) =>
									setReviewers([dealerId], reviewerId)
								}
								onBulkChange={setReviewers}
								onFallbackChange={(fallbackReviewerId) =>
									patch({ fallbackReviewerId })
								}
							/>
						) : null}

						{step === "CONFIRM" ? (
							<CycleConfirmStep
								values={effectiveValues}
								templateLabel={
									template ? `${template.name} · v${template.version}` : "—"
								}
								reviewers={workload.reviewers}
								onEditStep={goTo}
							/>
						) : null}

						{launch.error ? (
							<Alert
								type="banner"
								variant="error"
								title={text.error}
								description={getAuditActionErrorMessage(
									launch.error,
									"audit cycle",
								)}
							/>
						) : null}
					</div>
				</Card>
			</div>
		</PageSectionLayout>
	);
}
