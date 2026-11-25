// pages/CppRequestCreatePage.tsx — "Create new CPP request" stepper wizard.
//   Step  Basic details       (routing fields, request details, justification)
//   Step  Purchasing details  (suppliers, summary sheet, approval values)
//   Step  Amortisation        (only when pricing condition = PB50)
//   Step  Volumes & impact    (volumes, per machine impact, material cost tracker — optional)
//   Step  Master data         (plant / spares details for the selected plant)
//   Step  Other data
//   Step  Attachments
//   Step  Review & workflow   → Submit
// "Next" validates the current step and focuses its first invalid field.
// "Submit" validates everything, opens the step with the FIRST invalid field and
// focuses it. Which step owns which field: utils/cpp.steps.ts (one map).
import type { ComponentType } from "react";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { FormProvider } from "react-hook-form";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormValidationSummary from "../../../components/forms/FormValidationSummary";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StepProgress } from "../../../components/ui/StepProgress";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import {
	CPP_LISTING_PATH,
	useCppRequestForm,
} from "../hooks/useCppRequestForm";
import AmortisationTab from "../tabs/AmortisationTab";
import AttachmentsTab from "../tabs/AttachmentsTab";
import BasicDetailsTab from "../tabs/BasicDetailsTab";
import MasterDataTab from "../tabs/MasterDataTab";
import OtherDataTab from "../tabs/OtherDataTab";
import PurchasingDetailsTab from "../tabs/PurchasingDetailsTab";
import VolumesImpactTab from "../tabs/VolumesImpactTab";
import WorkflowTab from "../tabs/WorkflowTab";
import type { CppStepKey } from "../types/cpp.types";
import { errorsOfStep, stepsWithErrors } from "../utils/cpp.steps";

const STEP_BODY: Record<CppStepKey, ComponentType> = {
	basic: BasicDetailsTab,
	purchasing: PurchasingDetailsTab,
	amortisation: AmortisationTab,
	volumes: VolumesImpactTab,
	master: MasterDataTab,
	other: OtherDataTab,
	attachments: AttachmentsTab,
	workflow: WorkflowTab,
};

/** Readable names for the summary; anything else uses its path. */
const SUMMARY_FIELDS = [
	{ name: "category", label: "Category" },
	{ name: "plant", label: "Plant" },
	{ name: "condition", label: "Conditions" },
	{ name: "materialType", label: "Material type" },
	{ name: "reason", label: "Reason for price update" },
	{ name: "workflow.models", label: "Models" },
	{ name: "priceType", label: "Price type" },
	{ name: "workflow.pricingCondition", label: "Pricing condition" },
	{ name: "justification", label: "Justification" },
	{ name: "suppliers.existing.name", label: "Existing supplier name" },
	{ name: "suppliers.recommended.name", label: "Recommended supplier name" },
	{ name: "suppliers.recommended.code", label: "Recommended vendor code" },
	{ name: "attachments.partSummary", label: "Summary sheet (part info)" },
	{
		name: "approvalValues.partValuePart",
		label: "Part for highest part value",
	},
	{ name: "approvalValues.partValue", label: "Highest part value" },
	{ name: "approvalValues.variationPct", label: "Variation %" },
	{ name: "approvalValues.amountPart", label: "Part for the amount" },
	{ name: "approvalValues.amount", label: "Amount" },
];

const CppRequestCreatePage = () => {
	const {
		form,
		steps,
		step,
		isFirst,
		isLast,
		busy,
		isEditing,
		isResubmit,
		isLoading,
		loadError,
		referenceNumber,
		goNext,
		goBack,
		saveDraft,
		submit,
		cancel,
	} = useCppRequestForm();

	const ActiveStep = STEP_BODY[step.key];

	/* Steps that still hold an error are marked in the stepper; the current
	   step shows its own errors inline and in the summary. */
	const { errors, submitCount } = form.formState;
	const invalidSteps = stepsWithErrors(errors);
	const stepsWithStatus = steps.map((item) =>
		invalidSteps.has(item.key) && item.id !== step.id
			? { ...item, status: "invalid" as const }
			: item,
	);
	const currentStepErrors = errorsOfStep(errors, step.key);

	return (
		<PageSectionLayout>
			<PageHeader
				headerText={
					isEditing
						? `Edit CPP request${referenceNumber ? ` · ${referenceNumber}` : ""}`
						: "Create new CPP request"
				}
				subtitleText={`Step ${steps.findIndex((item) => item.id === step.id) + 1} of ${steps.length} · ${step.label}`}
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Create CPP request page location",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{ label: "CPP requests", href: CPP_LISTING_PATH },
						{ label: isEditing ? "Edit request" : "New request" },
					],
					separator: "›",
				}}
			/>

			{loadError ? (
				<Alert
					variant="error"
					title="Unable to load this request"
					description={loadError}
				/>
			) : isLoading ? (
				<p
					role="status"
					className="px-4 py-10 text-center text-sm text-fg-muted"
				>
					Loading request…
				</p>
			) : null}

			<FormProvider {...form}>
				{/* div, not <form>: Enter / step buttons must never trigger submit. */}
				<Card
					title={
						<StepProgress
							steps={stepsWithStatus}
							currentStep={step.id}
							ariaLabel="CPP request steps"
						/>
					}
					headerClassName="border-none pb-1"
					padding="spacious"
					footer={
						<div className="bottom-buttons-bar-between">
							<div className="flex flex-wrap items-center gap-2">
								<Button
									type="button"
									text="Cancel"
									size="sm"
									appearance="standard"
									variant="outline"
									disabled={busy}
									onClick={cancel}
								/>
								{!isFirst ? (
									<Button
										type="button"
										text="Back"
										Icon={ArrowLeft}
										size="sm"
										appearance="standard"
										variant="outline"
										disabled={busy}
										onClick={goBack}
									/>
								) : null}
							</div>

							<div className="flex flex-wrap items-center justify-end gap-2">
								<Button
									type="button"
									text="Save draft"
									Icon={Save}
									size="sm"
									appearance="standard"
									variant="outline"
									disabled={busy}
									onClick={saveDraft}
								/>
								{isLast ? (
									<Button
										type="button"
										text={isResubmit ? "Resubmit" : "Submit for approval"}
										Icon={Check}
										size="sm"
										appearance="standard"
										variant="brand"
										disabled={busy}
										onClick={() => submit()}
									/>
								) : (
									<Button
										type="button"
										text="Next"
										Icon={ArrowRight}
										size="sm"
										appearance="standard"
										variant="brand"
										disabled={busy}
										onClick={goNext}
									/>
								)}
							</div>
						</div>
					}
				>
					<div
						className={`flex flex-col gap-3 ${isLoading || loadError ? "pointer-events-none opacity-40" : ""}`}
					>
						{/* Only this step's problems; other steps are marked in the stepper. */}
						<FormValidationSummary
							errors={currentStepErrors}
							fields={SUMMARY_FIELDS}
							title="Please fix these before continuing"
							focusKey={submitCount}
						/>

						<div role="region" aria-label={step.label}>
							<ActiveStep />
						</div>
					</div>
				</Card>
			</FormProvider>
		</PageSectionLayout>
	);
};

export default CppRequestCreatePage;
