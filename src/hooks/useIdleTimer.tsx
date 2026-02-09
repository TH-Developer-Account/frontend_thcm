import { useEffect, useRef, useCallback } from "react";

interface UseIdleTimerOptions {
	idleTime?: number;
	onIdle: () => void;
	onActive?: () => void;
	paused?: boolean;
}

export function useIdleTimer({
	idleTime = 60_000,
	onIdle,
	onActive,
	paused = false,
}: UseIdleTimerOptions) {
	const timerRef = useRef<number | null>(null);
	const isIdleRef = useRef(false);

	const clearTimer = useCallback(() => {
		if (timerRef.current !== null) {
			window.clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const startTimer = useCallback(() => {
		clearTimer();
		timerRef.current = window.setTimeout(() => {
			isIdleRef.current = true;
			onIdle();
		}, idleTime);
	}, [clearTimer, idleTime, onIdle]);

	const handleActivity = useCallback(() => {
		if (paused) return;

		if (isIdleRef.current) {
			isIdleRef.current = false;
			onActive?.();
		}

		startTimer();
	}, [paused, onActive, startTimer]);

	useEffect(() => {
		if (paused) {
			clearTimer();
			return;
		}

		const events: (keyof WindowEventMap)[] = ["keydown", "scroll", "click"];

		events.forEach((event) => window.addEventListener(event, handleActivity));

		startTimer();

		return () => {
			clearTimer();
			events.forEach((event) =>
				window.removeEventListener(event, handleActivity),
			);
		};
	}, [paused, handleActivity, startTimer, clearTimer]);
}
