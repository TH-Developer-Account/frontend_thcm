import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { dealerAuditContent as content } from "../dealer-audit.content";
import type { DealerAuditPermissions } from "../dealer-audit.permissions";
import { useDealerAuditSession } from "../hooks/useDealerAuditAccess";

const text = content.ui.guard;

type Props = {
	/** Permission key(s) required to render children. ANY match passes. */
	require: keyof DealerAuditPermissions | Array<keyof DealerAuditPermissions>;
	children: ReactNode;
	/** Where to send the user if denied. Defaults to showing an inline state. */
	redirectTo?: string;
};

/**
 * Role-level gate. It waits for the session before deciding, so a refresh
 * never flashes "access restricted". The backend still enforces access per
 * audit; this only improves usability.
 */
export default function DealerAuditGuard({
	require,
	children,
	redirectTo,
}: Props) {
	const { permissions, isLoading } = useDealerAuditSession();
	const location = useLocation();
	const required = Array.isArray(require) ? require : [require];
	const allowed = required.some((key) => permissions[key]);

	if (isLoading) {
		return (
			<div
				className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-600"
				role="status"
			>
				{text.loading}
			</div>
		);
	}

	if (!allowed) {
		if (redirectTo) {
			return <Navigate to={redirectTo} replace state={{ from: location }} />;
		}
		return (
			<div
				className="mx-auto flex max-w-md flex-col items-center gap-2 px-4 py-16 text-center"
				role="alert"
			>
				<h2 className="text-base font-semibold text-slate-900">
					{text.deniedTitle}
				</h2>
				<p className="text-sm text-slate-600">{text.deniedDescription}</p>
			</div>
		);
	}

	return <>{children}</>;
}
