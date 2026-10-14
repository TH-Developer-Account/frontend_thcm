// modules/audit/shared/execution/hooks/useSwipeNavigation.ts
//
// Horizontal swipe between checklist items. Safe by construction:
//   • ignores gestures that start inside interactive controls
//   • ignores events bubbled up through React portals (modals, selects)
//   • needs a minimum distance AND a clearly horizontal direction
//   • Previous / Next buttons always remain the accessible alternative

import { useCallback, useRef, type TouchEvent } from "react";
import { AUDIT_EXECUTION_RULES } from "../audit-execution.config";

export type SwipeDirection = "next" | "previous";

/** Pure decision function — unit-tested. */
export function resolveSwipeDirection(
	deltaX: number,
	deltaY: number,
	config: { minDistancePx: number; directionRatio: number } = AUDIT_EXECUTION_RULES.swipe,
): SwipeDirection | null {
	if (Math.abs(deltaX) < config.minDistancePx) return null;
	if (Math.abs(deltaX) < Math.abs(deltaY) * config.directionRatio) return null;
	return deltaX < 0 ? "next" : "previous";
}

const INTERACTIVE_SELECTOR = [
	"input",
	"textarea",
	"select",
	"button",
	"a[href]",
	"label",
	"img",
	"[role='radio']",
	"[role='radiogroup']",
	"[role='dialog']",
	"[role='listbox']",
	"[contenteditable='true']",
	"[data-no-swipe]",
].join(",");

export const isSwipeBlockedTarget = (target: EventTarget | null): boolean =>
	target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null;

interface UseSwipeNavigationOptions {
	onNext: () => void;
	onPrevious: () => void;
	disabled?: boolean;
}

export function useSwipeNavigation({
	onNext,
	onPrevious,
	disabled = false,
}: UseSwipeNavigationOptions) {
	const start = useRef<{ x: number; y: number } | null>(null);

	const onTouchStart = useCallback(
		(event: TouchEvent<HTMLElement>) => {
			start.current = null;
			if (disabled) return;
			// Portal content bubbles through React, but is not inside this DOM node.
			if (!event.currentTarget.contains(event.target as Node)) return;
			if (isSwipeBlockedTarget(event.target)) return;
			if (event.touches.length !== 1) return;
			const touch = event.touches[0];
			start.current = { x: touch.clientX, y: touch.clientY };
		},
		[disabled],
	);

	const onTouchEnd = useCallback(
		(event: TouchEvent<HTMLElement>) => {
			const origin = start.current;
			start.current = null;
			if (!origin || disabled) return;
			const touch = event.changedTouches[0];
			const direction = resolveSwipeDirection(
				touch.clientX - origin.x,
				touch.clientY - origin.y,
			);
			if (direction === "next") onNext();
			else if (direction === "previous") onPrevious();
		},
		[disabled, onNext, onPrevious],
	);

	const onTouchCancel = useCallback(() => {
		start.current = null;
	}, []);

	return { onTouchStart, onTouchEnd, onTouchCancel };
}
