import { useState, type ReactNode } from "react";
import {
	ArrowLeft,
	ArrowRight,
	LucideSave,
	RefreshCcw,
	Save,
	SkipForward,
	X,
} from "lucide-react";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import { SearchInput } from "../../../../components/forms/SearchInput";
import CrfCatalog, {
	CrfCategoryTabs,
	crfSearchPlaceholder,
} from "./CrfCatalog";
import { useCrfForm, type CrfFormProps } from "./useCrfForm";
import type { CrfCategory } from "./types";

export type CrfFormCardProps = CrfFormProps & {
	/**
	 * Card title. When omitted (default) the category tabs + search take the
	 * header instead of a "Create CRF" / "Edit CRF" title.
	 */
	title?: ReactNode;
	/** Extra content at the left of the footer. */
	footerStart?: ReactNode;
	/** Back on the FIRST tab (e.g. the wizard's previous step). Omit to hide Back there. */
	onBackFromFirstStep?: () => void;
	/** Shows a quiet "Skip CRF" action (wizard only). */
	onSkip?: () => void;
};

export default function CrfForm(props: CrfFormCardProps) {
	const {
		onCancel,
		submitLabel,
		title,
		footerStart,
		onBackFromFirstStep,
		onSkip,
	} = props;

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

	/* ------------------------- Header: tabs + search ----------------------- */

	const hostsToolbar = !title;

	// Search belongs to one tab: it starts empty again when the tab changes
	// (Save & Next / Back change the tab inside the hook, hence the key check).
	const [searchState, setSearchState] = useState<{
		category: CrfCategory;
		text: string;
	}>({ category: activeCategory, text: "" });
	const search =
		searchState.category === activeCategory ? searchState.text : "";

	const finalLabel = submitLabel ?? (isEditMode ? "Update CRF" : "Save CRF");

	const headerTitle = hostsToolbar ? (
		<CrfCategoryTabs
			categories={steps}
			items={costItems}
			active={activeCategory}
			onChange={setActiveCategory}
		/>
	) : (
		title
	);

	const headerActions = hostsToolbar ? (
		<SearchInput
			value={search}
			onChange={(text) => setSearchState({ category: activeCategory, text })}
			placeholder={crfSearchPlaceholder(activeCategory)}
		/>
	) : undefined;

	/* -------------------------------- Footer ------------------------------- */

	const showBack = !isFirstStep || Boolean(onBackFromFirstStep);

	const footer = (
		<div className="crf-footer">
			<div className="crf-footer-start">
				{footerStart}

				{showBack ? (
					<Button
						type="button"
						onClick={isFirstStep ? onBackFromFirstStep : handleBack}
						size="sm"
						text="Back"
						Icon={ArrowLeft}
						appearance="standard"
						variant="outline"
						disabled={submitting}
					/>
				) : null}

				<span className="crf-footer-step">
					Step {stepIndex + 1} of {steps.length}
					<span className="sr-only"> · {steps[stepIndex]?.title}</span>
				</span>
			</div>

			<div className="crf-footer-end">
				{onCancel ? (
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
				) : null}

				<button
					type="button"
					className="crf-footer-link"
					onClick={handleReset}
					disabled={submitting || loading}
					title="Reset this tab to its saved items"
				>
					<RefreshCcw aria-hidden="true" />
					Reset
				</button>

				{onSkip ? (
					<button
						type="button"
						className="crf-footer-link"
						onClick={onSkip}
						disabled={submitting}
						title="Continue without adding a CRF"
					>
						<SkipForward aria-hidden="true" />
						Skip CRF
					</button>
				) : null}

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
						iconPosition="right"
						appearance="standard"
						variant="brand"
						disabled={submitting || loading}
					/>
				)}
			</div>
		</div>
	);

	return (
		<Card
			title={headerTitle}
			actions={headerActions}
			headerClassName={hostsToolbar ? "crf-card-header" : undefined}
			footer={footer}
			loading={loading}
			padding="none"
		>
			<CrfCatalog
				options={options}
				items={costItems}
				onChange={setCostItems}
				errors={errors}
				readOnly={submitting}
				categories={steps}
				activeCategory={activeCategory}
				onCategoryChange={setActiveCategory}
				hideToolbar={hostsToolbar}
				search={hostsToolbar ? search : undefined}
				onSearchChange={
					hostsToolbar
						? (text) => setSearchState({ category: activeCategory, text })
						: undefined
				}
			/>
		</Card>
	);
}
