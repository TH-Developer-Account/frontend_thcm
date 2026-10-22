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
	/* Step navigator: Back | progress dots + "Step n of N" | quiet actions |
	   primary action that names the next tab. Layout and breakpoints are in
	   crfFooter.css (≥1025 one row, ≤1024 icon-only Back/Reset/Cancel,
	   ≤768 short primary label, ≤640 two rows). */

	const showBack = !isFirstStep || Boolean(onBackFromFirstStep);
	const currentTitle = steps[stepIndex]?.title;
	const nextTitle = steps[stepIndex + 1]?.title;
	const busy = submitting || loading;

	const footer = (
		<div className={showBack ? "crf-nav" : "crf-nav crf-nav--no-back"}>
			{footerStart || showBack ? (
				<div className="crf-nav-start">
					{footerStart}

					{showBack ? (
						<button
							type="button"
							className="crf-nav-btn crf-nav-btn--outline"
							onClick={isFirstStep ? onBackFromFirstStep : handleBack}
							disabled={submitting}
						>
							<ArrowLeft aria-hidden="true" />
							{/* Visually hidden (not removed) when the footer is icon-only. */}
							<span className="crf-nav-text">Back</span>
						</button>
					) : null}
				</div>
			) : null}

			<div className="crf-nav-progress" aria-live="polite">
				<span className="crf-nav-dots" aria-hidden="true">
					{steps.map((step, index) => (
						<span
							key={step.title}
							className={
								index === stepIndex
									? "crf-nav-dot crf-nav-dot--active"
									: index < stepIndex
										? "crf-nav-dot crf-nav-dot--done"
										: "crf-nav-dot"
							}
						/>
					))}
				</span>
				<span className="crf-nav-step">
					Step {stepIndex + 1} of {steps.length}
					<span className="crf-nav-step-title"> · {currentTitle}</span>
				</span>
			</div>

			<div className="crf-nav-secondary">
				{onCancel ? (
					<button
						type="button"
						className="crf-nav-btn crf-nav-btn--ghost"
						onClick={onCancel}
						disabled={submitting}
					>
						<X aria-hidden="true" />
						<span className="crf-nav-text">Cancel</span>
					</button>
				) : null}

				<button
					type="button"
					className="crf-nav-btn crf-nav-btn--ghost"
					onClick={handleReset}
					disabled={busy}
					title="Reset this tab to its saved items"
				>
					<RefreshCcw aria-hidden="true" />
					<span className="crf-nav-text">Reset</span>
				</button>

				{onSkip ? (
					<button
						type="button"
						className="crf-nav-btn crf-nav-btn--ghost"
						onClick={onSkip}
						disabled={submitting}
						title="Continue without adding a CRF"
					>
						<SkipForward aria-hidden="true" />
						Skip CRF
					</button>
				) : null}
			</div>

			{isLastStep ? (
				<button
					type="button"
					className="crf-nav-btn crf-nav-btn--primary crf-nav-primary"
					onClick={() => void handleSubmit()}
					disabled={busy}
				>
					{isEditMode ? (
						<Save aria-hidden="true" />
					) : (
						<LucideSave aria-hidden="true" />
					)}
					{submitting ? "Saving..." : finalLabel}
				</button>
			) : (
				<button
					type="button"
					className="crf-nav-btn crf-nav-btn--primary crf-nav-primary"
					onClick={handleSaveAndNext}
					disabled={busy}
				>
					{/* Long label on wide screens, short one on phones (CSS swaps them). */}
					<span className="crf-nav-label-long">
						{nextTitle ? `Save & Next: ${nextTitle}` : "Save & Next"}
					</span>
					<span className="crf-nav-label-short">
						{nextTitle ? `Next: ${nextTitle}` : "Next"}
					</span>
					<ArrowRight aria-hidden="true" />
				</button>
			)}
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
