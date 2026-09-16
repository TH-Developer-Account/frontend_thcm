import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useDealerAuditAccess } from "../hooks/useDealerAuditAccess";
import type { DealerAuditPermissions } from "../dealer-audit.permissions";

type Props = {
	/** Permission key(s) required to render children. ANY match passes. */
	require: keyof DealerAuditPermissions | Array<keyof DealerAuditPermissions>;
	children: ReactNode;
	/** Where to send the user if denied. Defaults to showing an inline state. */
	redirectTo?: string;
};

export default function DealerAuditGuard({
	require,
	children,
	redirectTo,
}: Props) {
	const permissions = useDealerAuditAccess();
	const location = useLocation();
	const required = Array.isArray(require) ? require : [require];
	const allowed = required.some((key) => permissions[key]);

	if (!allowed) {
		if (redirectTo) {
			return <Navigate to={redirectTo} replace state={{ from: location }} />;
		}
		// TODO: replace with your shared empty/error-state component once one exists.
		return (
			<div className="mx-auto flex max-w-md flex-col items-center gap-2 px-4 py-16 text-center">
				<h2 className="text-base font-semibold text-slate-900">
					Access restricted
				</h2>
				<p className="text-sm text-slate-600">
					You do not have permission to view this page.
				</p>
			</div>
		);
	}

	return <>{children}</>;
}
