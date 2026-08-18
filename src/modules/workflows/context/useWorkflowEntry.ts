import { useCallback, useState } from "react";

import type { EntryMode, SaveMode, WorkflowFilter } from "../types/types";

export function useWorkflowEntry() {
	const [mode, setMode] = useState<EntryMode>("idle");
	const [filter, setFilter] = useState<WorkflowFilter>("created");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [saveModeById, setSaveModeById] = useState<Record<string, SaveMode>>(
		{},
	);

	const toggleEdit = useCallback((id: string) => {
		setEditingId((current) => (current === id ? null : id));
	}, []);

	const setSaveMode = useCallback((id: string, value: SaveMode) => {
		setSaveModeById((current) => ({ ...current, [id]: value }));
	}, []);

	const getSaveMode = useCallback(
		(id: string): SaveMode => saveModeById[id] ?? "once",
		[saveModeById],
	);

	return {
		mode,
		setMode,
		filter,
		setFilter,
		editingId,
		toggleEdit,
		setSaveMode,
		getSaveMode,
	};
}
