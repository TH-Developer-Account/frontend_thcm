// modules/audit/shared/execution/components/AuditSubmissionSummary.tsx
//
// Shown when whole-audit validation fails: how many parameters block the
// action and a direct jump to each one.

import { TriangleAlert } from "lucide-react";

import {
	auditExecutionContent as content,
	formatAuditMessage as format,
} from "../audit-execution.content";
import type { AuditValidationResult } from "../audit-execution.validation";

const text = content.submissionSummary;

interface AuditSubmissionSummaryProps {
	result: AuditValidationResult;
	heading: string;
	onJumpToItem: (itemId: string) => void;
}

export default function AuditSubmissionSummary({
	result,
	heading,
	onJumpToItem,
}: AuditSubmissionSummaryProps) {
	if (result.valid) return null;

	return (
		<section
			role="alert"
			aria-label={heading}
			className="rounded-lg border border-danger-line bg-danger-bg p-3"
		>
			<h3 className="flex items-center gap-2 text-sm font-semibold text-danger-text">
				<TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
				{heading}
			</h3>
			<p className="mt-1 text-xs text-danger-text">
				{format(text.count, { count: result.incompleteCount })}
			</p>
			<ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
				{result.issues.map((issue) => (
					<li key={issue.itemId}>
						<button
							type="button"
							onClick={() => onJumpToItem(issue.itemId)}
							className="flex min-h-9 w-full flex-col items-start rounded-md px-2 py-1 text-left text-sm hover:bg-danger-line/40 focus-visible:outline-2 focus-visible:outline-focus"
						>
							<span className="font-medium text-fg">
								{issue.sequence}. {issue.title}
							</span>
							<span className="text-xs text-danger-text">
								{issue.messages.join(" ")}
							</span>
						</button>
					</li>
				))}
			</ul>
		</section>
	);
}
