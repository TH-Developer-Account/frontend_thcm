// handouts/handouts.mockMode.ts
// MOCK-LAYER (delete this file when the real API is live)
//
// Tiny runtime switch for the Handouts mock data. The "Use mock data" checkbox
// (HandoutMockToggle) flips it; the choice is remembered in localStorage so a
// page refresh keeps you on the same side. VITE_HANDOUTS_MOCK=true still works
// as the first-visit default.

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "handouts:use-mock-data";
const listeners = new Set<() => void>();

const readInitial = (): boolean => {
	try {
		const saved = window.localStorage.getItem(STORAGE_KEY);
		if (saved !== null) return saved === "true";
	} catch {
		// localStorage blocked, fall through to the env default.
	}
	return import.meta.env.VITE_HANDOUTS_MOCK === "true";
};

let enabled = readInitial();

export const isHandoutMockEnabled = () => enabled;

export const setHandoutMockEnabled = (next: boolean) => {
	enabled = next;
	try {
		window.localStorage.setItem(STORAGE_KEY, String(next));
	} catch {
		// ignore: the in-memory value still applies for this session.
	}
	listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

/** [isMock, setMock]. Components using it re-render when the checkbox flips. */
export function useHandoutMockMode() {
	const isMock = useSyncExternalStore(
		subscribe,
		isHandoutMockEnabled,
		isHandoutMockEnabled,
	);
	return [isMock, setHandoutMockEnabled] as const;
}
