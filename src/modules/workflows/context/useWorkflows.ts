import { useContext } from "react";

import { WorkflowContext, type WorkflowContextValue } from "./workflow.context";

export function useWorkflow(): WorkflowContextValue {
	const context = useContext(WorkflowContext);

	if (!context) {
		throw new Error("useWorkflow must be used inside WorkflowProvider");
	}

	return context;
}
