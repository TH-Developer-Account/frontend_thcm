// crf/CrfForm.tsx
// CRF form rendered as one card: catalog in the body, actions in the card
// footer. No collapsible section.
//
// The category tabs act as steps:
//   Intermediate tabs → [Back] [Reset] [Save & Next]   (local only)
//   Last tab          → [Back] [Reset] [Save CRF]      (creates / updates CRF)
//
//   footer:  [footerStart…] Step 2 of 3 · Souvenirs      [Cancel] [Reset] [Back] [Save & Next]
//
// `footerStart` lets a host (the wizard) put its own buttons (Back to EPC,
// Skip CRF) in the same footer, so there is only one action bar per screen.

import type { ReactNode } from "react";
import {
	ArrowLeft,
	ArrowRight,
	LucideSave,
	RefreshCcw,
	Save,
	X,
} from "lucide-react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import CrfCatalog from "./crf.catalog";
import { useCrfForm, type CrfFormProps } from "./useCrfForm";

export type CrfFormCardProps = CrfFormProps & {
	/** Card title. Defaults to "Create CRF" / "Edit CRF". */
	title?: ReactNode;
	/** Rendered at the left of the footer (e.g. the wizard's Back / Skip). */
	footerStart?: ReactNode;
};

export default function CrfForm(props: CrfFormCardProps) {
	const { onCancel, submitLabel, title, footerStart } = props;

	const {
		costItems,
		setCostItems,
		options,
		errors,
		loading,
		submitting,
		isEditMode,
		steps,
		activeCategory,
		setActiveCategory,
		stepIndex,
		isFirstStep,
		isLastStep,
		handleBack,
		handleSaveAndNext,
		handleSubmit,
		handleReset,
	} = useCrfForm(props);

	const finalLabel = submitLabel ?? (isEditMode ? "Update CRF" : "Save CRF");
	const cardTitle = title ?? (isEditMode ? "Edit CRF" : "Create CRF");

	const footer = (
		<div className="flex w-full flex-wrap items-center justify-between gap-2">
			<div className="flex flex-wrap items-center gap-3">
				{footerStart}

				<span className="text-sm text-[var(--color-text-muted)]">
					Step {stepIndex + 1} of {steps.length} ·{" "}
					<strong className="font-semibold text-[var(--color-text-primary)]">
						{steps[stepIndex]?.title}
					</strong>
				</span>
			</div>

			<div className="flex flex-wrap items-center justify-end gap-2">
				{onCancel && (
					<Button
						type="button"
						onClick={onCancel}
						text="Cancel"
						size="sm"
						Icon={X}
						appearance="standard"
						variant="outline"
						disabled={submitting}
					/>
				)}

				<Button
					type="button"
					onClick={handleReset}
					size="sm"
					text="Reset"
					Icon={RefreshCcw}
					appearance="standard"
					variant="outline"
					disabled={submitting || loading}
				/>

				{!isFirstStep && (
					<Button
						type="button"
						onClick={handleBack}
						size="sm"
						text="Back"
						Icon={ArrowLeft}
						appearance="standard"
						variant="outline"
						disabled={submitting}
					/>
				)}

				{isLastStep ? (
					<Button
						type="button"
						onClick={() => void handleSubmit()}
						text={submitting ? "Saving..." : finalLabel}
						size="sm"
						Icon={isEditMode ? Save : LucideSave}
						appearance="standard"
						variant="brand"
						disabled={submitting || loading}
					/>
				) : (
					<Button
						type="button"
						onClick={handleSaveAndNext}
						text="Save & Next"
						size="sm"
						Icon={ArrowRight}
						appearance="standard"
						variant="brand"
						disabled={submitting || loading}
					/>
				)}
			</div>
		</div>
	);

	return (
		<Card title={cardTitle} footer={footer} loading={loading} padding="none">
			<CrfCatalog
				options={options}
				items={costItems}
				onChange={setCostItems}
				errors={errors}
				readOnly={submitting}
				categories={steps}
				activeCategory={activeCategory}
				onCategoryChange={setActiveCategory}
			/>
		</Card>
	);
}
