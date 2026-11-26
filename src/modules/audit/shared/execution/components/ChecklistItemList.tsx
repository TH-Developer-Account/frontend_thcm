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
	CLARIFICATION_OPEN: "text-caution-text",
	CLARIFICATION_RESPONDED: "text-notice-text",
	COMPLETE: "text-positive-text",
	PENDING: "text-fg-muted",
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
								className="text-sm font-semibold text-fg"
							>
								{section.name}
							</h3>
							<span className="shrink-0 text-xs font-medium tabular-nums text-fg-secondary">
								{progress.completed}/{progress.total}
							</span>
						</header>
						<ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
							{section.items.map((item) => {
								const state = getItemWorkState(item);
								const StateIcon = STATE_ICON[state];
								const isHighlighted = highlightedItemIds?.has(item.id) ?? false;
								return (
									<li key={item.id}>
										{renderLink(
											item,
											`flex min-h-14 items-center gap-3 px-3 py-2 hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus ${
												isHighlighted ? "bg-danger-bg" : ""
											}`,
											<>
												<StateIcon
													className={`size-5 shrink-0 ${STATE_CLASS[state]}`}
												/>
												<span className="min-w-0 flex-1">
													<span className="block break-words text-sm font-medium text-fg">
														{item.sequence}. {item.title}
													</span>
													<span className="block text-xs text-fg-secondary">
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
														<span className="block text-sm font-semibold text-fg">
															{formatScore(item.self.score, item.maxScore)}
														</span>
														{showReviewer &&
														item.review?.score !== undefined &&
														item.review?.score !== null ? (
															<span className="block text-fg-secondary">
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
