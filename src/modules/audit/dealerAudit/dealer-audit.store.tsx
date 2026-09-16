import React, { createContext, useContext, useMemo, useState } from "react";
import { CHECKLIST_LIBRARY } from "./data/checklistLibrary";
import type {
	DealerAuditChecklist,
	UpdateChecklistItemPayload,
} from "./dealer-audit.types";

const cloneChecklist = (): DealerAuditChecklist =>
	structuredClone(CHECKLIST_LIBRARY);

type ContextValue = {
	checklist: DealerAuditChecklist;
	updateItem: (itemId: string, payload: UpdateChecklistItemPayload) => void;
};

const DealerAuditContext = createContext<ContextValue | null>(null);

export function DealerAuditProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [checklist, setChecklist] = useState(cloneChecklist);

	const updateItem = (itemId: string, payload: UpdateChecklistItemPayload) => {
		setChecklist((current) => ({
			...current,
			categories: current.categories.map((category) => ({
				...category,
				items: category.items.map((item) =>
					item.id === itemId ? { ...item, ...payload } : item,
				),
			})),
		}));
	};

	const value = useMemo(() => ({ checklist, updateItem }), [checklist]);
	return (
		<DealerAuditContext.Provider value={value}>
			{children}
		</DealerAuditContext.Provider>
	);
}

export default function useDealerAudit() {
	const value = useContext(DealerAuditContext);
	if (!value)
		throw new Error("useDealerAudit must be used inside DealerAuditProvider");
	return value;
}
