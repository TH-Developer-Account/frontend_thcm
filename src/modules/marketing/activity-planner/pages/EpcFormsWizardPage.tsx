// pages/EpcFormsWizardPage.tsx
// Stepper wizard opened from the EPC listing (EPC No / "Add CRF" / "Add EPF").
//
//   Step 1 — EPC Details : ActivityDetailsSection (same read-only layout as the EPC view)
//   Step 2 — CRF         : create CRF (optional, can be skipped) or read-only
//   Step 3 — EPF & Submit: ONE click does  preview workflow → save EPF → assign workflow.
//                          No workflow for the budget → Submit is disabled and a
//                          small "Request workflow" button sends the user to the listing.
//
// Entry point (?start=) decides the step the wizard opens on:
//   epc → EPC Details · crf → CRF · epf → EPF (CRF skipped)
// A saved-but-unsubmitted EPC ("Continue to submit") opens straight on the EPF
// step, pre-filled and editable, so the user can fix anything and submit.
import React from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
	useLocation,
	useNavigate,
	useParams,
	useSearchParams,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { Alert } from "../../../../components/common/Alert";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import Loader from "../../../../components/ui/Loader";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { StepProgress } from "../../../../components/ui/StepProgress";
import PageSectionLayout from "../../../../layout/PageSectionLayout";

import EpfForm from "../forms/EPF/EpfForm";
import EpfSection from "../forms/EPF/EpfSection";
import { useActivityPermissions } from "../hooks/useActivityPlanner";
import { epcKeys, useEpcDetailQuery } from "../queries/epc.queries";
import { EPC_LISTING_PATH, type EpcWizardIntent } from "../utils/constant";
import { CrfForm } from "../../crf";
import CrfSection from "../../crf/core/CrfSection";
import { clearStoredEpcInfo } from "../utils/common";
import { isEpcSubmitted } from "../forms/EPC/epc.utils";
import EpcForm from "../forms/EPC/EpcForm";
const STEP = { EPC: 1, CRF: 2, EPF: 3 } as const;
type WizardStep = (typeof STEP)[keyof typeof STEP];

const WIZARD_STEPS = [
	{ id: STEP.EPC, label: "EPC Details" },
	{ id: STEP.CRF, label: "CRF" },
	{ id: STEP.EPF, label: "EPF & Submit" },
];

/** Which step each entry point opens the wizard on. */
const INTENT_START_STEP: Record<EpcWizardIntent, WizardStep> = {
	epc: STEP.EPC,
	crf: STEP.CRF,
	epf: STEP.EPF, // skips CRF
};

const noop = () => {};
const asyncNoop = async () => {};

/** Router state other screens can pass when opening the stepper. */
export type EpcWizardLocationState = { startAt?: "review"; mode?: "edit" };

const getIntent = (value: string | null): EpcWizardIntent =>
	value === "epf" ? "epf" : value === "epc" ? "epc" : "crf";

/** Shared footer layout: left group · right group. */
const StepFooter = ({
	start,
	end,
}: {
	start?: React.ReactNode;
	end?: React.ReactNode;
}) => (
	<div className="flex w-full flex-wrap items-center justify-between gap-2">
		<div className="flex flex-wrap items-center gap-2">{start}</div>
		<div className="flex flex-wrap items-center justify-end gap-2">{end}</div>
	</div>
);

const EpcFormsWizardPage = () => {
	const { id } = useParams<{ id: string }>();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const location = useLocation();
	const queryClient = useQueryClient();

	const intent = getIntent(searchParams.get("start"));
	// Old "open on Review" entry points now land on the EPF & Submit step.
	const startAtReview =
		(location.state as EpcWizardLocationState | null)?.startAt === "review";
	const [step, setStep] = React.useState<WizardStep>(
		startAtReview ? STEP.EPF : INTENT_START_STEP[intent],
	);

	const { data: epcData, isLoading, isError } = useEpcDetailQuery(id);
	const permissions = useActivityPermissions({ epcData: epcData ?? null });

	React.useEffect(() => {
		clearStoredEpcInfo();
	}, []);

	const hasCrf = Boolean(epcData?.crf);
	const hasEpf = Boolean(epcData?.epf);
	const workflowStarted = isEpcSubmitted(epcData);

	/** EPF saved earlier but never submitted (no workflow attached yet). */
	const needsFinalSubmit =
		hasEpf && !workflowStarted && Boolean(permissions.isProposer);

	const isEligible =
		permissions.canCreateCrf || permissions.canCreateEpf || needsFinalSubmit;

	const wasEligibleRef = React.useRef(false);
	if (isEligible) wasEligibleRef.current = true;
	const isBlocked = !isEligible && !wasEligibleRef.current;

	/* ------------------------------ Navigation ------------------------------ */

	const goToListing = React.useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: epcKeys.lists() });
		navigate(EPC_LISTING_PATH);
	}, [navigate, queryClient]);

	const goBack = React.useCallback(() => {
		setStep((current) => Math.max(STEP.EPC, current - 1) as WizardStep);
	}, []);

	const goNext = React.useCallback(() => {
		setStep((current) => Math.min(STEP.EPF, current + 1) as WizardStep);
	}, []);

	const handleCrfSaved = React.useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: epcKeys.detail(id) });
		setStep(STEP.EPF);
	}, [id, queryClient]);

	/* -------------------------------- States -------------------------------- */

	if (isLoading) return <Loader />;

	const intentLabel =
		intent === "epc" ? "Continue to submit" : `Add ${intent.toUpperCase()}`;

	const pageTitle = `${intentLabel}${
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
					{ label: intentLabel },
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

	/* ------------------------------ Shared buttons -------------------------- */

	const backButton = (
		<Button
			type="button"
			text="Back"
			Icon={ArrowLeft}
			size="sm"
			appearance="standard"
			variant="outline"
			onClick={goBack}
		/>
	);

	const nextButton = (
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
	);

	const finishButton = (
		<Button
			type="button"
			text="Finish"
			Icon={Check}
			size="sm"
			appearance="standard"
			variant="brand"
			onClick={() => void goToListing()}
		/>
	);

	/* ------------------------------ Step body ------------------------------- */

	const renderStep = () => {
		switch (step) {
			case STEP.EPC:
				// Edit mode: the EPC form only. The read-only view stays on view pages.
				return (
					<EpcForm
						key={epcData.id}
						mode="edit"
						epcId={epcData.id}
						initialData={epcData}
						onCancel={() => navigate(EPC_LISTING_PATH)}
						onSuccess={async () => {
							await queryClient.invalidateQueries({
								queryKey: epcKeys.detail(id),
							});
							goNext();
						}}
					/>
				);

			case STEP.CRF:
				return hasCrf ? (
					<Card footer={<StepFooter start={backButton} end={nextButton} />}>
						<CrfSection
							epcData={epcData}
							isEditing={false}
							onCancel={noop}
							onSuccess={asyncNoop}
						/>
					</Card>
				) : (
					<CrfForm
						epcId={epcData.id}
						submitLabel="Save & Next"
						onSuccess={handleCrfSaved}
						// One Back (previous tab; on the first tab → EPC details) and a
						// quiet "Skip CRF" link replace the old two-button footerStart.
						onBackFromFirstStep={goBack}
						onSkip={goNext}
					/>
				);

			case STEP.EPF:
				// Already submitted → read-only, nothing left to do but leave.
				if (workflowStarted) {
					return (
						<Card footer={<StepFooter start={backButton} end={finishButton} />}>
							{hasEpf ? (
								<EpfSection
									epcData={epcData}
									isEditing={false}
									onCancel={noop}
									onSuccess={asyncNoop}
								/>
							) : (
								<p className="text-sm text-[var(--color-text-muted)]">
									This EPC has been submitted and its approval workflow is
									running.
								</p>
							)}
						</Card>
					);
				}

				// New EPF, or a saved-but-unsubmitted one (edit + submit).
				// `key` remounts the form with fresh server data when the EPF changes.
				return (
					<EpfForm
						key={epcData.epf?.id ?? "new-epf"}
						mode={hasEpf ? "edit" : "create"}
						epcId={epcData.id}
						epfId={epcData.epf?.id ?? null}
						initialData={hasEpf ? epcData.epf : null}
						crfId={epcData.crf?.id ?? null}
						crfData={epcData.crf}
						budgetMasterId={epcData.budget_master_id}
						submitLabel="Submit"
						submitWithWorkflow
						footerStart={backButton}
						onSuccess={goToListing}
						onRequestWorkflow={goToListing}
					/>
				);
		}
	};

	return (
		<PageSectionLayout>
			{header}

			<StepProgress
				steps={WIZARD_STEPS}
				currentStep={step}
				ariaLabel="Add forms progress"
				className="workflow-create-step-progress"
			/>

			{renderStep()}
		</PageSectionLayout>
	);
};

export default EpcFormsWizardPage;
