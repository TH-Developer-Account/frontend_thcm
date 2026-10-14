// modules/audit/shared/execution/components/ChecklistItemList.tsx
//
// Section-grouped parameter list. Presentational: routing is injected via
// getItemHref so this component knows nothing about the router.

import { CircleCheck, CircleDashed, MessageSquareWarning } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { auditExecutionContent as content } from "../audit-execution.content";
import type {
	AuditChecklistItem,
	AuditChecklistSection,
} from "../audit-execution.types";
import {
	formatScore,
	getItemWorkState,
	getSectionProgress,
	type ItemWorkState,
} from "../audit-execution.utils";

const text = content.itemList;

const STATE_ICON: Record<
	ItemWorkState,
	ComponentType<{ className?: string }>
> = {
	CLARIFICATION_OPEN: MessageSquareWarning,
	CLARIFICATION_RESPONDED: CircleCheck,
	COMPLETE: CircleCheck,
	PENDING: CircleDashed,
};

const STATE_CLASS: Record<ItemWorkState, string> = {
	CLARIFICATION_OPEN: "text-orange-700",
	CLARIFICATION_RESPONDED: "text-blue-700",
	COMPLETE: "text-green-700",
	PENDING: "text-slate-500",
};

interface ChecklistItemListProps {
	sections: readonly AuditChecklistSection[];
	/** Show the reviewer's score/decision beside the self-assessed one. */
	showReviewer: boolean;
	highlightedItemIds?: ReadonlySet<string>;
	/** Renders a router link; keeps this component router-agnostic. */
	renderLink: (
		item: AuditChecklistItem,
		className: string,
		children: ReactNode,
	) => ReactNode;
}

export default function ChecklistItemList({
	sections,
	showReviewer,
	highlightedItemIds,
	renderLink,
}: ChecklistItemListProps) {
	return (
		<div className="space-y-5">
			{sections.map((section) => {
				const progress = getSectionProgress(section);
				return (
					<section key={section.id} aria-labelledby={`section-${section.id}`}>
						<header className="mb-2 flex items-baseline justify-between gap-2">
							<h3
								id={`section-${section.id}`}
								className="text-sm font-semibold text-(--color-text-primary)"
							>
								{section.name}
							</h3>
							<span className="shrink-0 text-xs text-(--color-text-secondary)">
								{progress.completed}/{progress.total}
							</span>
						</header>
						<ul className="divide-y divide-(--color-border-default) overflow-hidden rounded-lg border border-(--color-border-default)">
							{section.items.map((item) => {
								const state = getItemWorkState(item);
								const StateIcon = STATE_ICON[state];
								const isHighlighted = highlightedItemIds?.has(item.id) ?? false;
								return (
									<li key={item.id}>
										{renderLink(
											item,
											`flex min-h-14 items-center gap-3 px-3 py-2 hover:bg-(--color-bg-muted) focus-visible:outline-2 ${
												isHighlighted ? "bg-red-50" : ""
											}`,
											<>
												<StateIcon
													className={`size-5 shrink-0 ${STATE_CLASS[state]}`}
												/>
												<span className="min-w-0 flex-1">
													<span className="block break-words text-sm font-medium text-(--color-text-primary)">
														{item.sequence}. {item.title}
													</span>
													<span className="block text-xs text-(--color-text-secondary)">
														{text.states[state]}
														{showReviewer &&
														item.review &&
														item.review.decision !== "PENDING"
															? ` · ${content.review.decisions[item.review.decision]}`
															: ""}
													</span>
												</span>
												{item.isScored ? (
													<span className="shrink-0 text-right text-xs tabular-nums">
														<span className="block font-semibold text-(--color-text-primary)">
															{formatScore(item.self.score, item.maxScore)}
														</span>
														{showReviewer &&
														item.review?.score !== undefined &&
														item.review?.score !== null ? (
															<span className="block text-(--color-text-secondary)">
																{text.reviewerScorePrefix}{" "}
																{formatScore(item.review.score, item.maxScore)}
															</span>
														) : null}
													</span>
												) : null}
											</>,
										)}
									</li>
								);
							})}
						</ul>
					</section>
				);
			})}
		</div>
	);
}
