import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationsContext } from "../../../../../context/Notification/NotificationsProvider";
import { useToast } from "../../../../../context/Auth/AuthContext";
import { eventReportKeys } from "./useEventReportQueries";

export function useReportGenerationWatcher(epcId: string | undefined) {
	const { notifications, markAsRead } = useNotificationsContext();
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	const handledIdsRef = React.useRef<Set<string>>(new Set());
	const seededRef = React.useRef(false);

	React.useEffect(() => {
		if (!epcId) return;

		const expectedLink = `/report/${epcId}`;
		const relevant = notifications.filter(
			(n) => n.type === "REPORT_STATUS" && n.link === expectedLink,
		);

		// First pass after mount: everything already in the list is old news.
		if (!seededRef.current) {
			relevant.forEach((n) => handledIdsRef.current.add(n.id));
			seededRef.current = true;
			return;
		}

		const match = relevant.find(
			(n) => !n.isRead && !handledIdsRef.current.has(n.id),
		);
		if (!match) return;

		handledIdsRef.current.add(match.id);
		queryClient.invalidateQueries({ queryKey: eventReportKeys.byEpc(epcId) });

		showToast({
			type: "success",
			title: match.title,
			description: match.body,
		});

		void markAsRead(match.id);
	}, [notifications, epcId, queryClient, showToast, markAsRead]);
}
