// pages/CppRequestCreatePage.tsx — "Create new CPP request" stepper wizard.
//   Step 1  Basic details       (routing fields, request details, justification)
//   Step 2  Purchasing details  (suppliers, purchasing Excel, approval values)
//   Step 3  Master data
//   Step 4  Other data
//   Step 5  Review & workflow   → Submit
// "Next" validates the current step; "Submit" validates everything and jumps to
// the first step with an error.
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
import BasicDetailsTab from "../tabs/BasicDetailsTab";
import MasterDataTab from "../tabs/MasterDataTab";
import OtherDataTab from "../tabs/OtherDataTab";
import PurchasingDetailsTab from "../tabs/PurchasingDetailsTab";
import WorkflowTab from "../tabs/WorkflowTab";
import type { CppStepKey } from "../types/cpp.types";
import { CPP_STEPS } from "../utils/cpp.utils";
import AttachmentsTab from "../tabs/AttachmentsTab";

const STEP_BODY: Record<CppStepKey, ComponentType> = {
	basic: BasicDetailsTab,
	purchasing: PurchasingDetailsTab,
	master: MasterDataTab,
	other: OtherDataTab,
	attachments: AttachmentsTab,
	workflow: WorkflowTab,
};

const CppRequestCreatePage = () => {
	const {
		form,
		step,
		isFirst,
		isLast,
		busy,
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
				headerText="Create new CPP request"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Create CPP request page location",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{ label: "CPP requests", href: CPP_LISTING_PATH },
						{ label: "New request" },
					],
					separator: "›",
				}}
			/>

			<FormProvider {...form}>
				{/* div, not <form>: Enter / step buttons must never trigger submit. */}
				<div className="flex flex-col gap-4 mt-4">
					<StepProgress
						steps={CPP_STEPS}
						currentStep={step.id}
						ariaLabel="CPP request steps"
					/>

					<div role="region" aria-label={step.label}>
						<ActiveStep />
					</div>

					<div>
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
				</div>
			</FormProvider>
		</PageSectionLayout>
	);
};

export default CppRequestCreatePage;
