// handouts/NewHandoutPage.tsx
// "New handout request" as a stepper wizard (same pattern as the EPC / vendor
// forms: StepProgress + one Card per step with a Back / Next footer).
//
//   1  Handout Details  : purpose, required by, contact, deliver to, remarks
//   2  CRF Items        : souvenir catalog + "Request list" sidebar
//   3  Review & Submit  : read-only summary + approval workflow, then submit
//
// Each Next validates its own step (useHandoutForm.validateDetails /
// validateItemsStep). Submit re-validates everything, refreshes stock and
// posts; if anything fails the wizard jumps back to the step with the error.

import { useEffect, useState, type ReactNode } from "react";
import {
	ArrowLeft,
	ArrowRight,
	ClipboardList,
	Send,
	Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { SearchInput } from "../../../components/forms/SearchInput";
import FormHeader from "../../../components/ui/FormHeader";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StepProgress } from "../../../components/ui/StepProgress";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { CRF_CATEGORIES, CrfCatalog, crfSearchPlaceholder } from "../crf";

import { HANDOUTS_BASE_PATH } from "./handouts.constants";
import HandoutDetailsFields from "./HandoutDetailsFields";
import type { HandoutItem } from "./handouts.types";
import HandoutItemsTable from "./HandoutItemsTable";
import HandoutMockToggle from "./HandoutMockToggle"; // MOCK-LAYER
import HandoutRequestList from "./HandoutRequestList";
import { useHandoutForm } from "./useHandoutForm";
import { useHandoutPermissions } from "./useHandoutPermissions";
import "./handouts.css";

// Handouts are souvenirs only — no printed material or artwork tabs.
const SOUVENIR_ONLY = CRF_CATEGORIES.filter(
	(category) => category.value === "SOUVENIR",
);

const STEP = { DETAILS: 1, ITEMS: 2, REVIEW: 3 } as const;
type Step = (typeof STEP)[keyof typeof STEP];

const STEPS = [
	{ id: STEP.DETAILS, label: "Handout Details" },
	{ id: STEP.ITEMS, label: "CRF Items" },
	{ id: STEP.REVIEW, label: "Review & Submit" },
];

const toNumber = (value: unknown) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

/** Footer layout: left group · right group (same as the EPC wizard). */
const StepFooter = ({ start, end }: { start?: ReactNode; end?: ReactNode }) => (
	<div className="flex w-full flex-wrap items-center justify-between gap-2">
		<div className="flex flex-wrap items-center gap-2">{start}</div>
		<div className="flex flex-wrap items-center justify-end gap-2">{end}</div>
	</div>
);

export default function NewHandoutPage() {
	const navigate = useNavigate();
	const form = useHandoutForm();
	const { canRequest } = useHandoutPermissions();
	const [step, setStep] = useState<Step>(STEP.DETAILS);
	const [search, setSearch] = useState("");

	const { values, errors, setField, itemErrors } = form;

	// Any failed validation (Next or Submit) lands on the step that holds it.
	useEffect(() => {
		if (Object.values(errors).some(Boolean)) {
			setStep(STEP.DETAILS);
		} else if (itemErrors.form || Object.keys(itemErrors.items).length > 0) {
			setStep(STEP.ITEMS);
		}
	}, [errors, itemErrors]);

	const backButton = (
		<Button
			type="button"
			text="Back"
			Icon={ArrowLeft}
			size="sm"
			appearance="standard"
			variant="outline"
			disabled={form.submitting}
			onClick={() => setStep((current) => (current - 1) as Step)}
		/>
	);

	const nextButton = (onClick: () => void) => (
		<Button
			type="button"
			text="Next"
			Icon={ArrowRight}
			iconPosition="right"
			size="sm"
			appearance="standard"
			variant="brand"
			onClick={onClick}
		/>
	);

	/* ------------------------------ Step bodies ----------------------------- */

	const renderDetails = () => (
		<Card
			title="Handout Details"
			subtitle="Requested by, designation and department are taken from your profile."
			footer={
				<StepFooter
					start={
						<Button
							type="button"
							text="Cancel"
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={() => navigate(HANDOUTS_BASE_PATH)}
						/>
					}
					end={nextButton(() => {
						if (form.validateDetails()) setStep(STEP.ITEMS);
					})}
				/>
			}
		>
			<HandoutDetailsFields
				mode="edit"
				values={values}
				errors={errors}
				setField={setField}
			/>
		</Card>
	);

	const renderItems = () => (
		<div className="handout-split">
			<Card
				padding="compact"
				title="CRF Items"
				actions={
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder={crfSearchPlaceholder("SOUVENIR")}
					/>
				}
			>
				{/* The Request list replaces CrfCatalog's own cart, which
				    handouts.css hides inside .handout-catalog. */}
				<div className="handout-catalog">
					<CrfCatalog
						options={[]}
						categories={SOUVENIR_ONLY}
						defaultCategory="SOUVENIR"
						items={form.items}
						onChange={form.setItems}
						errors={itemErrors}
						search={search}
						onSearchChange={setSearch}
						hideToolbar
					/>
				</div>
			</Card>

			<HandoutRequestList
				items={form.items}
				onChange={form.setItems}
				errors={itemErrors}
				footer={
					<StepFooter
						start={backButton}
						end={nextButton(() => {
							if (form.validateItemsStep()) setStep(STEP.REVIEW);
						})}
					/>
				}
			/>
		</div>
	);

	const renderReview = () => {
		// The cart → the table the approver sees, so the review matches it.
		const reviewItems: HandoutItem[] = form.items.map((line, index) => ({
			id: line.id ?? `${line.sku ?? line.value}-${index}`,
			sku: line.sku ?? "",
			title: line.label || line.sku || "Item",
			variantTitle: line.variantTitle ?? null,
			imageUrl: line.imageUrl ?? null,
			quantity: toNumber(line.quantity),
			rate: toNumber(line.rate),
			amount: toNumber(line.quantity) * toNumber(line.rate),
		}));

		return (
			<Card
				title="Review & Submit"
				subtitle="Check the details below. Submit sends the request for approval."
				footer={
					<StepFooter
						start={backButton}
						end={
							<Button
								type="button"
								text={form.submitting ? "Submitting..." : "Submit for approval"}
								Icon={Send}
								size="sm"
								appearance="standard"
								variant="brand"
								disabled={form.submitting}
								onClick={() => void form.submit()}
							/>
						}
					/>
				}
			>
				<div className="flex min-w-0 flex-col gap-4">
					<section className="min-w-0">
						<FormHeader title="Handout Details" Icon={ClipboardList} />
						<div className="px-3">
							<HandoutDetailsFields mode="view" values={values} />
						</div>
					</section>

					<section className="min-w-0">
						<FormHeader title="CRF Items" Icon={ClipboardList} />
						<HandoutItemsTable items={reviewItems} />
					</section>

					<section className="min-w-0">
						<FormHeader title="Approval Workflow" Icon={Truck} />
						{/* Handouts have a fixed two-stage flow (no workflow-engine
						    template), so it is shown as is. */}
						<ol className="handout-timeline px-3">
							<li>
								<span className="handout-timeline-dot" aria-hidden="true" />
								<div>
									<strong>1. Approval</strong> by the Marketing Head
									<small>
										Single step. The request is approved or rejected.
									</small>
								</div>
							</li>
							<li>
								<span className="handout-timeline-dot" aria-hidden="true" />
								<div>
									<strong>2. Hand delivery</strong> by the delivery team
									<small>
										Items are verified and handed over, then the request closes.
									</small>
								</div>
							</li>
						</ol>
					</section>
				</div>
			</Card>
		);
	};

	if (!canRequest) {
		return (
			<PageSectionLayout>
				<PageHeader
					headerText="New handout request"
					subtitleText="You do not have access to raise handout requests."
				/>
			</PageSectionLayout>
		);
	}

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="New handout request"
				subtitleText="Request souvenirs for premises use. One approver, then hand delivery by the delivery team."
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "New handout page location",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{
							label: "EPC Listing",
							href: "/marketing/activity-planner/listing",
						},
						{ label: "Handouts", href: HANDOUTS_BASE_PATH },
						{ label: "New request" },
					],
					separator: "›",
				}}
			>
				<HandoutMockToggle /> {/* MOCK-LAYER */}
			</PageHeader>

			<StepProgress
				steps={STEPS}
				currentStep={step}
				ariaLabel="New handout progress"
				className="workflow-create-step-progress"
			/>

			{step === STEP.DETAILS
				? renderDetails()
				: step === STEP.ITEMS
					? renderItems()
					: renderReview()}
		</PageSectionLayout>
	);
}
