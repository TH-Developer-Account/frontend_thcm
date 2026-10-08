// pages/EpcFormsWizardPage.tsx
// Stepper wizard opened from the EPC listing action menu ("Add CRF" / "Add EPF").
//
//   Step 1 — EPC Details     : EpcForm in view mode (read-only fields)
//   Step 2 — CRF             : create CRF (optional, can be skipped) or read-only
//   Step 3 — EPF             : create EPF (saved, NOT submitted) or read-only
//   Step 4 — Review & Submit : read-only summary + approval-workflow preview
//                              (loads on landing) → Final Submit starts the
//                              workflow → back to the listing
//
// Opened with router state `{ startAt: "review" }` (the view's "Continue to
// submit" banner) it starts on Review & Submit instead of step 1.
//
// Every step is ONE card with ONE footer. Form steps (CRF / EPF) render their
// own card; the wizard's navigation (Back / Skip) is passed in as
// `footerStart` so it sits in the same footer as the form's Save button.
import React from "react";
import { ArrowLeft, ArrowRight, Check, SkipForward, X } from "lucide-react";
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
import { useAuth } from "../../../../context/Auth/useAuth";
import PageSectionLayout from "../../../../layout/PageSectionLayout";

import EpcForm from "../forms/EPC/EpcForm";
import EpfForm from "../forms/EPF/EpfForm";
import EpfSection from "../forms/EPF/EpfSection";
import EpcReviewSubmit from "../forms/EPF/EpcReviewSubmit";
import { useActivityPermissions } from "../hooks/useActivityPlanner";
import { epcKeys, useEpcDetailQuery } from "../queries/epc.queries";
import { EPC_LISTING_PATH, type EpcWizardIntent } from "../utils/constant";
import { CrfForm } from "../../crf";
import CrfSection from "../../crf/CrfSection";
import { clearStoredEpcInfo, getStoredAppId } from "../utils/common";
import { isEpcSubmitted } from "../forms/EPC/epc.utils";

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

const STEP = { EPC: 1, CRF: 2, EPF: 3, REVIEW: 4 } as const;
type WizardStep = (typeof STEP)[keyof typeof STEP];

const WIZARD_STEPS = [
	{ id: STEP.EPC, label: "EPC Details" },
	{ id: STEP.CRF, label: "CRF" },
	{ id: STEP.EPF, label: "EPF" },
	{ id: STEP.REVIEW, label: "Review & Submit" },
];

// CrfSection / EpfSection require edit callbacks; they are never in edit
// mode inside the wizard, so these are no-ops.
const noop = () => {};
const asyncNoop = async () => {};

/** Router state other screens can pass when opening the stepper. */
export type EpcWizardLocationState = { startAt?: "review" };

const getIntent = (value: string | null): EpcWizardIntent =>
	value === "epf" ? "epf" : "crf";

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

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

const EpcFormsWizardPage = () => {
	const { id } = useParams<{ id: string }>();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const location = useLocation();
	const queryClient = useQueryClient();
	const { workspaceId } = useAuth();
	const appId = React.useMemo(() => getStoredAppId(), []);

	const intent = getIntent(searchParams.get("start"));
	const startAtReview =
		(location.state as EpcWizardLocationState | null)?.startAt === "review";
	const [step, setStep] = React.useState<WizardStep>(
		startAtReview ? STEP.REVIEW : STEP.EPC,
	);

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
	const workflowStarted = isEpcSubmitted(epcData);

	/** EPF saved earlier but never submitted → only the Review step is left. */
	const needsFinalSubmit =
		hasEpf && !workflowStarted && Boolean(permissions.isProposer);

	const isEligible =
		permissions.canCreateCrf || permissions.canCreateEpf || needsFinalSubmit;

	// Latch: once the user was allowed in, keep the wizard open even after
	// CRF/EPF creation flips canCreate* to false (avoids an error flash right
	// before we navigate away on finish).
	const wasEligibleRef = React.useRef(false);
	if (isEligible) wasEligibleRef.current = true;
	const isBlocked = !isEligible && !wasEligibleRef.current;

	/* ------------------------------ Navigation ------------------------------ */

	const goToListing = React.useCallback(async () => {
		// Refresh the listing so the row's menu reflects the newly added forms.
		await queryClient.invalidateQueries({ queryKey: epcKeys.lists() });
		navigate(EPC_LISTING_PATH);
	}, [navigate, queryClient]);

	const goBack = React.useCallback(() => {
		setStep((current) => Math.max(STEP.EPC, current - 1) as WizardStep);
	}, []);

	const goNext = React.useCallback(() => {
		setStep((current) => Math.min(STEP.REVIEW, current + 1) as WizardStep);
	}, []);

	/** CRF saved → reload EPC so the EPF step receives the CRF total. */
	const handleCrfSaved = React.useCallback(async () => {
		await refetch();
		setStep(STEP.EPF);
	}, [refetch]);

	/** EPF saved (workflow NOT started yet) → reload, then review. */
	const handleEpfSaved = React.useCallback(async () => {
		await refetch();
		setStep(STEP.REVIEW);
	}, [refetch]);

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

	/* ------------------------------ Step body ------------------------------- */

	const renderStep = () => {
		switch (step) {
			case STEP.EPC:
				return (
					<Card
						title="EPC Details"
						footer={
							<StepFooter
								start={
									<Button
										type="button"
										text="Cancel"
										Icon={X}
										size="sm"
										appearance="standard"
										variant="outline"
										onClick={() => navigate(EPC_LISTING_PATH)}
									/>
								}
								end={nextButton}
							/>
						}
					>
						<EpcForm mode="view" initialData={epcData} />
					</Card>
				);

			case STEP.CRF:
				// Already created (earlier, or just now and user came Back) → read-only.
				return hasCrf ? (
					<Card
						title="CRF"
						footer={<StepFooter start={backButton} end={nextButton} />}
					>
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
						footerStart={
							<>
								{backButton}
								<Button
									type="button"
									text="Skip CRF"
									Icon={SkipForward}
									size="sm"
									appearance="standard"
									variant="outline"
									onClick={goNext}
								/>
							</>
						}
					/>
				);

			case STEP.EPF:
				return hasEpf ? (
					<Card
						title="EPF"
						footer={<StepFooter start={backButton} end={nextButton} />}
					>
						<EpfSection
							epcData={epcData}
							isEditing={false}
							onCancel={noop}
							onSuccess={asyncNoop}
						/>
					</Card>
				) : (
					<EpfForm
						mode="create"
						epcId={epcData.id}
						crfId={epcData.crf?.id ?? null}
						crfData={epcData.crf}
						// Passed explicitly so budget info loads even when no CRF exists.
						budgetMasterId={epcData.budget_master_id}
						submitLabel="Save & Review"
						footerStart={backButton}
						onSuccess={handleEpfSaved}
					/>
				);

			case STEP.REVIEW:
				// Reached Review without an EPF (e.g. skipped forward) → send them back.
				if (!hasEpf) {
					return (
						<Card
							title="Review & Submit"
							footer={<StepFooter start={backButton} />}
						>
							<p className="text-sm text-[var(--color-text-muted)]">
								Save the EPF first. The approval workflow can only start once
								the EPF is complete.
							</p>
						</Card>
					);
				}

				return workflowStarted ? (
					<Card
						title="Submitted"
						footer={
							<StepFooter
								end={
									<Button
										type="button"
										text="Finish"
										Icon={Check}
										size="sm"
										appearance="standard"
										variant="brand"
										onClick={() => void goToListing()}
									/>
								}
							/>
						}
					>
						<p className="text-sm text-[var(--color-text-muted)]">
							This EPC has been submitted and its approval workflow is running.
						</p>
					</Card>
				) : (
					<EpcReviewSubmit
						epcData={epcData}
						workspaceId={workspaceId}
						appId={appId}
						footerStart={backButton}
						onSubmitted={goToListing}
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
