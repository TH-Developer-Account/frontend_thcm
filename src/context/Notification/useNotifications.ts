import { useCallback, useEffect, useRef, useState } from "react";
import { ServerAxios, API_BASE_URL } from "../../services/ServerAxios"; // adjust relative path to match this hook's folder
import { useAuth } from "../../context/Auth/useAuth"; // adjust relative path to match this hook's folder
import { onTokenRefreshed } from "../../services/tokenEvents"; // adjust relative path to match this hook's folder

// ─────────────────────────────────────────────────────────────────────────────
// useNotifications.ts
//
// Owns: notification list state, unread count, SSE connection lifecycle,
// and the read/mark-as-read API calls. NotificationBell.tsx is a pure
// consumer of what this hook returns — no fetch/EventSource logic in the
// component itself (separation of concerns).
//
// ── AUTH NOTE (not an assumption — confirmed from AuthProvider.tsx /
// ServerAxios.ts) ────────────────────────────────────────────────────────
// This app uses a Bearer token stored in localStorage ("authToken"),
// attached by ServerAxios's request interceptor for normal API calls.
// EventSource has no mechanism to attach custom headers, so it CANNOT carry
// that Bearer token the way ServerAxios does. The only way to authenticate
// the SSE connection is to pass the token as a query param on this one
// endpoint.
//
// This requires a matching backend change: the /notifications/stream route's
// auth middleware must also accept the token from `req.query.token` (SSE
// only — every other route keeps using the Authorization header as-is).
// Flagging this explicitly so it isn't missed during backend wiring.
//
// Token expiry mid-connection is handled two ways below: (1) reactively,
// via tokenEvents.ts — when ServerAxios's interceptor refreshes the token,
// this hook reopens the SSE connection with the new one; (2) defensively,
// if the browser's native EventSource retry ever fully gives up
// (readyState CLOSED), we reconnect once with whatever token is currently
// stored, rather than leaving the stream dead for the rest of the session.
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType =
	| "APPROVAL_PENDING"
	| "APPROVAL_DECISION"
	| "REPORT_STATUS"
	| "GENERIC";

export type Notification = {
	id: string;
	type: string;
	title: string;
	body: string;
	link: string | null;
	metadata: { appKey?: string; [key: string]: unknown } | null;
	isRead: boolean;
	createdAt: string;
};

// Relative path — used with ServerAxios, whose baseURL already includes /api/v1
const NOTIFICATIONS_PATH = "/notifications";

export function useNotifications() {
	const { user } = useAuth();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isConnected, setIsConnected] = useState(false);
	const eventSourceRef = useRef<EventSource | null>(null);

	// ── Initial load ────────────────────────────────────────────────────────
	const fetchNotifications = useCallback(async () => {
		const { data } = await ServerAxios.get(NOTIFICATIONS_PATH);
		setNotifications(data.data);
	}, []);

	const fetchUnreadCount = useCallback(async () => {
		const { data } = await ServerAxios.get(
			`${NOTIFICATIONS_PATH}/unread-count`,
		);
		setUnreadCount(data.data.count);
	}, []);

	const downloadExportFile = useCallback(async (logId: string) => {
		const { data } = await ServerAxios.get(`/import-export-logs/${logId}/file`);
		const link = document.createElement("a");
		link.href = data.url;
		link.click();
	}, []);

	useEffect(() => {
		if (!user?.id) return;
		fetchNotifications();
		fetchUnreadCount();
	}, [user?.id, fetchNotifications, fetchUnreadCount]);

	// ── SSE connection ──────────────────────────────────────────────────────
	// connect() is a stable ref-held function (not re-created per render) so
	// both the mount effect and the token-refresh subscription can call the
	// exact same connection logic without duplicating it (DRY).
	const connectRef = useRef<() => void>(() => {});

	useEffect(() => {
		if (!user?.id) return;

		function openConnection() {
			const token = localStorage.getItem("authToken");
			if (!token) return;

			// Tear down any existing connection before opening a new one —
			// matters when this runs from the token-refresh path, where an old
			// (soon-to-be-stale) connection may still be open.
			eventSourceRef.current?.close();

			// Token in query string — EventSource has no header API, so this is
			// the only way to authenticate this connection. Full API_BASE_URL is
			// required here (unlike ServerAxios calls elsewhere) — EventSource
			// has no baseURL concept.
			const source = new EventSource(
				`${API_BASE_URL}${NOTIFICATIONS_PATH}/stream?token=${encodeURIComponent(token)}`,
			);
			eventSourceRef.current = source;

			source.onopen = () => setIsConnected(true);

			source.onmessage = (event) => {
				const incoming: Notification = JSON.parse(event.data);
				console.log("[SSE] Incoming notification:", incoming);
				setNotifications((prev) => [incoming, ...prev]);
				setUnreadCount((prev) => prev + 1);
			};

			source.onerror = () => {
				setIsConnected(false);
				// readyState 2 (CLOSED) means the browser gave up retrying —
				// typically after repeated failures, e.g. an expired token that
				// never got refreshed via the token-refresh path. Reconnect once
				// with whatever token is currently in localStorage rather than
				// leaving the stream dead for the rest of the session.
				if (source.readyState === EventSource.CLOSED) {
					openConnection();
				}
				// readyState 0 (CONNECTING) means the browser is already retrying
				// on its own — no action needed.
			};
		}

		connectRef.current = openConnection;
		openConnection();

		return () => {
			eventSourceRef.current?.close();
			eventSourceRef.current = null;
		};
	}, [user?.id]);

	// Reopen the connection with a fresh token whenever ServerAxios's
	// interceptor successfully refreshes it — closes the fix for the stale-
	// token-on-reconnect gap described in tokenEvents.ts.
	useEffect(() => {
		return onTokenRefreshed(() => {
			connectRef.current();
		});
	}, []);

	// ── Mutations ───────────────────────────────────────────────────────────
	const markAsRead = useCallback(async (notificationId: string) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
		);
		setUnreadCount((prev) => Math.max(0, prev - 1));

		await ServerAxios.patch(`${NOTIFICATIONS_PATH}/${notificationId}/read`);
	}, []);

	const markAllAsRead = useCallback(async () => {
		setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
		setUnreadCount(0);

		await ServerAxios.patch(`${NOTIFICATIONS_PATH}/read-all`);
	}, []);

	return {
		notifications,
		unreadCount,
		isConnected,
		markAsRead,
		markAllAsRead,
		downloadExportFile,
		refetch: fetchNotifications,
	};
}
