// modules/audit/dealerAudit/components/DealerClarificationPanel.tsx
//
// Connects the shared clarification panel to the Dealer Audit API: the
// respond mutation and the user-facing error text.

import ItemClarificationPanel from "../../shared/execution/components/ItemClarificationPanel";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import type { DealerAuditChecklistItem } from "../dealer-audit.types";
import { useRespondToClarification } from "../hooks/useDealerAuditMutations";

interface DealerClarificationPanelProps {
	auditId: string;
	item: DealerAuditChecklistItem;
	/** permissions.canRespondToClarification */
	canRespond: boolean;
}

export default function DealerClarificationPanel({
	auditId,
	item,
	canRespond,
}: DealerClarificationPanelProps) {
	const {
		mutateAsync: respond,
		isPending,
		error,
		reset: resetError,
	} = useRespondToClarification();

	return (
		<ItemClarificationPanel
			item={item}
			canRespond={canRespond}
			isSubmitting={isPending}
			errorMessage={
				error ? getAuditActionErrorMessage(error, "clarification") : null
			}
			onResetError={resetError}
			onRespond={async (response) => {
				await respond({ auditId, itemId: item.id, response }).catch(
					() => undefined,
				);
			}}
		/>
	);
}
