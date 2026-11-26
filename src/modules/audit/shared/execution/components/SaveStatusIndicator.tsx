// modules/audit/shared/execution/components/SaveStatusIndicator.tsx
//
// Saving / Saved / Failed with a retry. Announced politely to screen readers.

import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";

import Button from "../../../../../components/common/Button";
import { auditExecutionContent as content } from "../audit-execution.content";
import type { SaveStatus } from "../audit-execution.types";

const text = content.save;

interface SaveStatusIndicatorProps {
	status: SaveStatus;
	error: string | null;
	isDirty: boolean;
	onRetry: () => void;
}

export default function SaveStatusIndicator({
	status,
	error,
	isDirty,
	onRetry,
}: SaveStatusIndicatorProps) {
	return (
		<div className="min-h-6 text-xs" aria-live="polite" role="status">
			{status === "saving" ? (
				<span className="inline-flex items-center gap-1.5 text-slate-600">
					<LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
					{text.saving}
				</span>
			) : status === "failed" ? (
				<span className="inline-flex flex-wrap items-center gap-2 text-red-700">
					<CircleAlert className="size-3.5" aria-hidden="true" />
					<span>{error ?? text.failed}</span>
					<Button
						type="button"
						text={text.retry}
						appearance="standard"
						variant="outline"
						size="sm"
						onClick={onRetry}
					/>
				</span>
			) : status === "saved" && !isDirty ? (
				<span className="inline-flex items-center gap-1.5 text-green-700">
					<CircleCheck className="size-3.5" aria-hidden="true" />
					{text.saved}
				</span>
			) : isDirty ? (
				<span className="text-slate-500">{text.unsaved}</span>
			) : null}
		</div>
	);
}
