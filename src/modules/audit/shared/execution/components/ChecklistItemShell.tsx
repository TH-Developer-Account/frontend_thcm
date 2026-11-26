// modules/audit/shared/execution/components/ChecklistItemShell.tsx
//
// Chrome around one parameter: header, Previous/Next, progress, swipe, the
// parameter description and a bottom action bar. Presentational — it does
// not know about drafts, saving or routing. The workspace decides whether
// leaving is allowed (onNavigate) so unsaved work is never lost.

import { ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import Button from "../../../../../components/common/Button";
import Card from "../../../../../components/common/Card";
import PageSectionLayout from "../../../../../layout/PageSectionLayout";
import {
	auditExecutionContent as content,
	formatAuditMessage as format,
} from "../audit-execution.content";
import type { AuditChecklistItem } from "../audit-execution.types";
import type { ChecklistProgress } from "../audit-execution.utils";
import { useSwipeNavigation } from "../hooks/useSwipeNavigation";
import AuditProgressSummary from "./AuditProgressSummary";

const text = content.itemShell;

export type ItemNavigationTarget = "previous" | "next" | "list";

interface ChecklistItemShellProps {
	/** Whose audit this is, e.g. dealer name; the module decides. */
	heading: string;
	/** e.g. audit number · location */
	subheading: string;
	item: AuditChecklistItem;
	index: number;
	total: number;
	hasPrevious: boolean;
	hasNext: boolean;
	progress: ChecklistProgress;
	progressLabel: string;
	/** true while saving/uploading: swipe is ignored so nothing is lost. */
	isBusy: boolean;
	onNavigate: (target: ItemNavigationTarget) => void;
	/** Save / upload status, shown above the action bar. */
	statusSlot?: ReactNode;
	/** Primary actions (Save & Next …), right side of the bar. */
	footerActions?: ReactNode;
	children: ReactNode;
}

export default function ChecklistItemShell({
	heading,
	subheading,
	item,
	index,
	total,
	hasPrevious,
	hasNext,
	progress,
	progressLabel,
	isBusy,
	onNavigate,
	statusSlot,
	footerActions,
	children,
}: ChecklistItemShellProps) {
	const headingRef = useRef<HTMLHeadingElement>(null);

	// The workspace is remounted for every parameter, so this runs on each
	// move: start at the top with focus on the heading, which keeps keyboard
	// and screen-reader users oriented.
	useEffect(() => {
		window.scrollTo({ top: 0 });
		headingRef.current?.focus({ preventScroll: true });
	}, []);

	const swipe = useSwipeNavigation({
		disabled: isBusy,
		onNext: () => {
			if (hasNext) onNavigate("next");
		},
		onPrevious: () => {
			if (hasPrevious) onNavigate("previous");
		},
	});

	const position = format(text.position, { index: index + 1, total });

	const navigationButtons = (
		<div className="flex items-center gap-1">
			<Button
				type="button"
				appearance="icon"
				variant="transparent"
				Icon={ChevronLeft}
				aria-label={text.previous}
				disabled={!hasPrevious || isBusy}
				onClick={() => onNavigate("previous")}
			/>
			<span className="min-w-20 text-center text-xs tabular-nums text-(--color-text-secondary)">
				{position}
			</span>
			<Button
				type="button"
				appearance="icon"
				variant="transparent"
				Icon={ChevronRight}
				aria-label={text.next}
				disabled={!hasNext || isBusy}
				onClick={() => onNavigate("next")}
			/>
		</div>
	);

	const footer = (
		<>
			{statusSlot}
			<div className="flex items-center justify-between gap-2">
				<Button
					type="button"
					text={text.previous}
					Icon={ChevronLeft}
					appearance="standard"
					variant="outline"
					disabled={!hasPrevious || isBusy}
					onClick={() => onNavigate("previous")}
				/>
				<div className="flex items-center gap-2">{footerActions}</div>
			</div>
		</>
	);

	return (
		<PageSectionLayout className="audit-page audit-page-narrow audit-item-page">
			{/* Announces the active parameter to assistive technology. */}
			<p className="sr-only" role="status" aria-live="polite">
				{position}: {item.title}
			</p>

			<div
				className="audit-stack audit-stack-pad-footer sm:pb-0"
				{...swipe}
			>
				<header className="flex items-center gap-2">
					<Button
						type="button"
						appearance="icon"
						variant="secondary"
						Icon={ListChecks}
						aria-label={text.backToList}
						disabled={isBusy}
						onClick={() => onNavigate("list")}
					/>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-semibold text-(--color-text-primary)">
							{heading}
						</p>
						<p className="truncate text-xs text-(--color-text-secondary)">
							{subheading}
						</p>
					</div>
					{navigationButtons}
				</header>

				<AuditProgressSummary label={progressLabel} progress={progress} />

				<Card variant="outlined" padding="default">
					<p className="text-xs font-medium text-(--color-text-secondary)">
						{item.sectionName}
					</p>
					<h2
						ref={headingRef}
						tabIndex={-1}
						className="mt-1 break-words text-base font-semibold text-(--color-text-primary) outline-none"
					>
						{item.sequence}. {item.title}
					</h2>
					{item.guidance ? (
						<p className="mt-2 whitespace-pre-wrap break-words text-sm text-(--color-text-secondary)">
							{item.guidance}
						</p>
					) : null}
					{item.criteria.length > 0 ? (
						<div className="mt-3">
							<h3 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
								{text.criteria}
							</h3>
							<ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-(--color-text-primary)">
								{item.criteria.map((criterion) => (
									<li key={criterion} className="break-words">
										{criterion}
									</li>
								))}
							</ul>
						</div>
					) : null}
					<p className="mt-3 text-xs text-(--color-text-secondary)">
						{item.isScored
							? format(text.maxScore, { max: item.maxScore })
							: text.notScored}
					</p>
				</Card>

				{children}
			</div>

			<div className="audit-sticky-footer sm:hidden">
				<div className="audit-sticky-footer-inner flex-col">{footer}</div>
			</div>
			<div className="audit-inline-footer hidden flex-col sm:flex">
				{footer}
			</div>
		</PageSectionLayout>
	);
}
