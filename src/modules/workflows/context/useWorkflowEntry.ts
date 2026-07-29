import { useCallback, useState } from "react";
import type {
	EntryMode,
	SaveMode,
	WorkflowFilter,
} from "../types/workflow.types";

/**
 * Pure UI state for the entry section: which top-level mode is picked
 * (fetch / create), which filter chip is active, which row's inline
 * editor is open, and what save mode each row has chosen. The workflow
 * data itself (fetched list, attach/edit mutations) stays owned by
 * whatever page renders WorkflowEntrySection.
 */
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
