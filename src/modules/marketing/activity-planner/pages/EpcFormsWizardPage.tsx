// pages/EpcFormsWizardPage.tsx
// Stepper wizard opened from the EPC listing action menu ("Add CRF" / "Add EPF").
//
//   Step 1 — EPC Details   : EpcForm in view mode (read-only fields)
//   Step 2 — CRF           : create CRF (optional, can be skipped) or read-only if it exists
//   Step 3 — EPF & Submit  : create + submit EPF (assigns the approval workflow)
//                            or read-only if it exists → Finish
//
// This page owns ONLY the step progress, the step body and the Back/Next bar.
// Titles / headings belong to each step's component.
// On finish the user lands back on the EPC listing.
import React from "react";
import { ArrowLeft, ArrowRight, Check, SkipForward, X } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { Alert } from "../../../../components/common/Alert";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import Loader from "../../../../components/ui/Loader";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { StepProgress } from "../../../../components/ui/StepProgress";
import PageSectionLayout from "../../../../layout/PageSectionLayout";

import EpcForm from "../forms/EPC/EpcForm";
import EpfForm from "../forms/EPF/EpfForm";
import EpfSection from "../forms/EPF/EpfSection";
import { useActivityPermissions } from "../hooks/useActivityPlanner";
import { epcKeys, useEpcDetailQuery } from "../queries/epc.queries";
import { EPC_LISTING_PATH, type EpcWizardIntent } from "../utils/constant";
import { CrfForm } from "../../crf";
import CrfSection from "../../crf/CrfSection";
import { clearStoredEpcInfo } from "../utils/common";

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

const STEP = { EPC: 1, CRF: 2, EPF: 3 } as const;
type WizardStep = (typeof STEP)[keyof typeof STEP];

const WIZARD_STEPS = [
	{ id: STEP.EPC, label: "EPC Details" },
	{ id: STEP.CRF, label: "CRF" },
	{ id: STEP.EPF, label: "EPF & Submit" },
];

// CrfSection / EpfSection require edit callbacks; they are never in edit
// mode inside the wizard, so these are no-ops.
const noop = () => {};
const asyncNoop = async () => {};

const getIntent = (value: string | null): EpcWizardIntent =>
	value === "epf" ? "epf" : "crf";

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

const EpcFormsWizardPage = () => {
	const { id } = useParams<{ id: string }>();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const intent = getIntent(searchParams.get("start"));
	const [step, setStep] = React.useState<WizardStep>(STEP.EPC);

	const { data: epcData, isLoading, isError, refetch } = useEpcDetailQuery(id);
	const permissions = useActivityPermissions({ epcData: epcData ?? null });

	// useCrfForm / useEpfForm fall back to ids stored in localStorage when no
	// id prop is given. Clear any stale value so the wizard can never update
	// another EPC's CRF/EPF by accident.
	React.useEffect(() => {
		clearStoredEpcInfo();
	}, []);

	const hasCrf = Boolean(epcData?.crf);
	const hasEpf = Boolean(epcData?.epf);
	const isEligible = permissions.canCreateCrf || permissions.canCreateEpf;

	// Latch: once the user was allowed in, keep the wizard open even after
	// CRF/EPF creation flips canCreate* to false (avoids an error flash right
	// before we navigate away on finish).
	const wasEligibleRef = React.useRef(false);
	if (isEligible) wasEligibleRef.current = true;
	const isBlocked = !isEligible && !wasEligibleRef.current;

	/* ------------------------------ Navigation ------------------------------ */

	const goToListing = React.useCallback(async () => {
		// CRF/EPF mutations only invalidate the detail query; refresh the
		// listing so the row's menu reflects the newly added forms.
		await queryClient.invalidateQueries({ queryKey: epcKeys.lists() });
		navigate(EPC_LISTING_PATH);
	}, [navigate, queryClient]);

	const goBack = React.useCallback(() => {
		setStep((current) => Math.max(STEP.EPC, current - 1) as WizardStep);
	}, []);

	const goNext = React.useCallback(() => {
		setStep((current) => Math.min(STEP.EPF, current + 1) as WizardStep);
	}, []);

	/** CRF saved → reload EPC so the EPF step receives the CRF total. */
	const handleCrfSaved = React.useCallback(async () => {
		await refetch();
		setStep(STEP.EPF);
	}, [refetch]);

	/** EPF submitted (workflow assigned inside useEpfForm) → back to listing. */
	const handleEpfSubmitted = React.useCallback(async () => {
		await goToListing();
	}, [goToListing]);

	/* -------------------------------- States -------------------------------- */

	if (isLoading) return <Loader />;

	const pageTitle = `Add ${intent.toUpperCase()}${
		epcData?.proposal_number ? ` · ${epcData.proposal_number}` : ""
	}`;

	const header = (
		<PageHeader
			headerText={pageTitle}
			navigation={{
				variant: "breadcrumbs",
				ariaLabel: "EPC wizard location",
				breadcrumbs: [
					{ label: "Home Screen", href: "/" },
					{ label: "EPC Listing", href: EPC_LISTING_PATH },
					{ label: `Add ${intent.toUpperCase()}` },
				],
				separator: "›",
			}}
		/>
	);

	if (isError || !epcData || isBlocked) {
		return (
			<PageSectionLayout>
				{header}
				<Alert
					type="banner"
					variant="error"
					title={!epcData ? "EPC not found" : "Nothing to add"}
					description={
						!epcData
							? "This EPC could not be loaded. It may have been removed."
							: "CRF and EPF have already been added for this EPC, or you don't have permission to add them."
					}
					primaryAction={{
						label: "Back to listing",
						onClick: () => navigate(EPC_LISTING_PATH),
					}}
				/>
			</PageSectionLayout>
		);
	}

	/* ------------------------------ Step body ------------------------------- */

	const renderStepBody = () => {
		switch (step) {
			case STEP.EPC:
				return <EpcForm mode="view" initialData={epcData} />;

			case STEP.CRF:
				// Already created (earlier, or just now and user came Back) → read-only.
				return hasCrf ? (
					<CrfSection
						epcData={epcData}
						isEditing={false}
						onCancel={noop}
						onSuccess={asyncNoop}
					/>
				) : (
					<CrfForm
						epcId={epcData.id}
						submitLabel="Save & Next"
						onSuccess={handleCrfSaved}
					/>
				);

			case STEP.EPF:
				return hasEpf ? (
					<EpfSection
						epcData={epcData}
						isEditing={false}
						onCancel={noop}
						onSuccess={asyncNoop}
					/>
				) : (
					<EpfForm
						mode="create"
						epcId={epcData.id}
						crfId={epcData.crf?.id ?? null}
						crfData={epcData.crf}
						// Passed explicitly so budget info loads even when no CRF exists.
						budgetMasterId={epcData.budget_master_id}
						onSuccess={handleEpfSubmitted}
					/>
				);
		}
	};

	/* ----------------------------- Step footer ------------------------------ */

	// The CRF/EPF forms render their own Save/Submit buttons; this bar only
	// moves between steps.
	const renderFooter = () => (
		<div className="flex w-full flex-wrap items-center justify-between gap-2">
			{step === STEP.EPC ? (
				<Button
					type="button"
					text="Cancel"
					Icon={X}
					size="sm"
					appearance="standard"
					variant="outline"
					onClick={() => navigate(EPC_LISTING_PATH)}
				/>
			) : (
				<Button
					type="button"
					text="Back"
					Icon={ArrowLeft}
					size="sm"
					appearance="standard"
					variant="outline"
					onClick={goBack}
				/>
			)}

			<div className="flex items-center gap-2">
				{step === STEP.EPC && (
					<Button
						type="button"
						text="Next"
						Icon={ArrowRight}
						iconPosition="right"
						size="sm"
						appearance="standard"
						variant="brand"
						onClick={goNext}
					/>
				)}

				{step === STEP.CRF && (
					<Button
						type="button"
						text={hasCrf ? "Next" : "Skip CRF"}
						Icon={hasCrf ? ArrowRight : SkipForward}
						iconPosition="right"
						size="sm"
						appearance="standard"
						variant={hasCrf ? "brand" : "outline"}
						onClick={goNext}
					/>
				)}

				{step === STEP.EPF && hasEpf && (
					<Button
						type="button"
						text="Finish"
						Icon={Check}
						size="sm"
						appearance="standard"
						variant="brand"
						onClick={() => void goToListing()}
					/>
				)}
			</div>
		</div>
	);

	return (
		<PageSectionLayout>
			{header}

			<StepProgress
				steps={WIZARD_STEPS}
				currentStep={step}
				ariaLabel="Add forms progress"
				className="workflow-create-step-progress"
			/>

			<Card title={WIZARD_STEPS[step - 1].label} footer={renderFooter()}>
				{renderStepBody()}
			</Card>
		</PageSectionLayout>
	);
};

export default EpcFormsWizardPage;
