// pages/CppRequestCreatePage.tsx — "Create new CPP request" stepper wizard.
//   Step  Basic details       (routing fields, request details, justification)
//   Step  Purchasing details  (suppliers, purchasing Excel, approval values)
//   Step  Amortisation        (only when pricing condition = PB50)
//   Step  Volumes & impact    (volumes, per machine impact, material cost tracker — optional)
//   Step  Master data         (plant / spares details for the selected plant)
//   Step  Other data
//   Step  Attachments
//   Step  Review & workflow   → Submit
// "Next" validates the current step; "Submit" validates everything and jumps to
// the first step with an error. Step numbers are recalculated when Amortisation
// comes or goes.
import type { ComponentType } from "react";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { FormProvider } from "react-hook-form";

import Button from "../../../components/common/Button";
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
import Card from "../../../components/common/Card";

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

const CppRequestCreatePage = () => {
	const {
		form,
		steps,
		step,
		isFirst,
		isLast,
		busy,
		isEditing,
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

	return (
		<PageSectionLayout>
			<PageHeader
				headerText={
					isEditing
						? `Edit CPP request${referenceNumber ? ` · ${referenceNumber}` : ""}`
						: "Create new CPP request"
				}
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
				<div
					role="alert"
					className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
				>
					{loadError}
				</div>
			) : isLoading ? (
				<div className="px-4 py-10 text-center text-sm text-slate-500">
					Loading request…
				</div>
			) : null}

			<FormProvider {...form}>
				{/* div, not <form>: Enter / step buttons must never trigger submit. */}

				<Card
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
										text="Submit for approval"
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
						className={`flex flex-col gap-4 ${isLoading || loadError ? "pointer-events-none opacity-40" : ""}`}
					>
						<StepProgress
							steps={steps}
							currentStep={step.id}
							ariaLabel="CPP request steps"
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
