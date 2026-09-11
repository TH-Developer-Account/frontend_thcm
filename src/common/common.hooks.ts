// hooks/useBulkAction.ts
import { useEffect, useState } from "react";

export type BulkActionResult<T> = {
	succeeded: T[];
	failed: Array<{ item: T; error: unknown }>;
};
export const getFailedItems = <T>(result: BulkActionResult<T>): T[] =>
	result.failed.map(({ item }) => item);
/**
 * Runs `action` across `items` with Promise.allSettled instead of
 * Promise.all — one failure no longer hides the outcome of the rest of the
 * batch. Returns which items succeeded/failed so the caller can render
 * per-row state or a "8 updated, 2 failed" summary instead of a single
 * generic error toast.
 */
export function useBulkAction<T>() {
	const [isRunning, setIsRunning] = useState(false);

	const run = async (
		items: T[],
		action: (item: T) => Promise<unknown>,
	): Promise<BulkActionResult<T>> => {
		setIsRunning(true);
		try {
			const settled = await Promise.allSettled(items.map(action));

			const succeeded: T[] = [];
			const failed: Array<{ item: T; error: unknown }> = [];

			settled.forEach((result, index) => {
				if (result.status === "fulfilled") {
					succeeded.push(items[index]);
				} else {
					failed.push({ item: items[index], error: result.reason });
				}
			});

			return { succeeded, failed };
		} finally {
			setIsRunning(false);
		}
	};

	return { run, isRunning };
}

// hooks/useDebouncedValue.ts

/**
 * Returns `value`, but only updates after `delay`ms of no further changes.
 * Standard debounce for search/filter inputs — see convention #9
 * ("Debounce standard") in the project conventions doc.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timeout = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timeout);
	}, [value, delay]);

	return debounced;
}
