import { useMemo } from "react";
import { useCurrentDealerAuditRole } from "./useCurrentDealerAuditRole";
import {
	getDealerAuditPermissions,
	type DealerAuditPermissions,
} from "../dealer-audit.permissions";

export function useDealerAuditAccess(): DealerAuditPermissions {
	const role = useCurrentDealerAuditRole();
	return useMemo(() => getDealerAuditPermissions(role), [role]);
}
