import type { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useGuestAuth } from "../context/Auth/useGuestAuth";
import { buildGuestLoginUrl, isTokenUsable, readGuestToken } from "../context/Auth/guestSession";
import FullScreenLoader from "./FullScreenLoader";

type GuestProtectedRouteProps = {
	children: JSX.Element;
};

/**
 * Guest-only pages. A missing OR expired token sends the guest to login,
 * remembering where they were so they land back on the same claim.
 */
export default function GuestProtectedRoute({ children }: GuestProtectedRouteProps) {
	const { isLoading, isAuthenticated } = useGuestAuth();
	const location = useLocation();

	if (isLoading) return <FullScreenLoader />;

	if (!isAuthenticated || !isTokenUsable(readGuestToken())) {
		const hadToken = Boolean(readGuestToken());
		return (
			<Navigate
				to={buildGuestLoginUrl(
					`${location.pathname}${location.search}`,
					hadToken ? "expired" : undefined,
				)}
				replace
			/>
		);
	}

	return children;
}
