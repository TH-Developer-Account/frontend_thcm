// modules/audit/shared/execution/components/ItemClarificationPanel.tsx
//
// Shows a clarification raised on one parameter. The assessed party (when
// allowed) answers it here; everyone else sees it read-only. Presentational:
// the module supplies the submit handler and any error text.
//
// NOTE: whoever must answer needs to see what is being asked, so the
// clarification request text is shown to them even where other comments are
// hidden — confirm with product.

import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquareWarning } from "lucide-react";
import { useForm } from "react-hook-form";

import Button from "../../../../../components/common/Button";
import TextareaInput from "../../../../../components/forms/TextareaInput";
import { AUDIT_EXECUTION_RULES } from "../audit-execution.config";
import { auditExecutionContent as content } from "../audit-execution.content";
import { formatAuditDateTime } from "../audit-execution.format";
import {
	clarificationResponseSchema,
	type ClarificationResponseFormValues,
} from "../audit-execution.validation";
import type { AuditChecklistItem } from "../audit-execution.types";

const text = content.clarification;

interface ItemClarificationPanelProps {
	item: AuditChecklistItem;
	/** permissions.canRespondToClarification */
	canRespond: boolean;
	isSubmitting: boolean;
	/** Already user-facing text (the module maps its API errors). */
	errorMessage: string | null;
	onRespond: (response: string) => Promise<void>;
	onResetError: () => void;
}

export default function ItemClarificationPanel({
	item,
	canRespond,
	isSubmitting: isPending,
	errorMessage,
	onRespond,
	onResetError,
}: ItemClarificationPanelProps) {
	const clarification = item.clarification;
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ClarificationResponseFormValues>({
		resolver: zodResolver(clarificationResponseSchema),
		defaultValues: { response: "" },
	});

	if (!clarification) return null;

	const isOpen = clarification.status === "OPEN";

	const handleRespond = handleSubmit(async (values) => {
		onResetError();
		await onRespond(values.response); // errors surface through errorMessage
	});

	return (
		<section
			aria-label={text.heading}
			className="space-y-3 rounded-lg border border-orange-200 bg-orange-50 p-3"
		>
			<h3 className="flex items-center gap-2 text-sm font-semibold text-orange-900">
				<MessageSquareWarning className="size-4" aria-hidden="true" />
				{isOpen ? text.openHeading : text.respondedHeading}
			</h3>

			<div className="text-sm text-slate-800">
				<p className="whitespace-pre-wrap break-words">{clarification.remarks}</p>
				<p className="mt-1 text-xs text-slate-600">
					{formatAuditDateTime(clarification.raisedAt)}
					{clarification.dueAt
						? ` · ${text.dueLabel} ${formatAuditDateTime(clarification.dueAt)}`
						: ""}
				</p>
			</div>

			{clarification.response ? (
				<div className="rounded-md bg-white p-2 text-sm">
					<p className="text-xs font-medium text-slate-600">
						{text.yourResponse}
					</p>
					<p className="whitespace-pre-wrap break-words">
						{clarification.response}
					</p>
				</div>
			) : null}

			{isOpen && canRespond ? (
				<form noValidate onSubmit={(event) => void handleRespond(event)} data-no-swipe>
					<TextareaInput
						label={text.responseLabel}
						placeholder={text.responsePlaceholder}
						rows={3}
						maxLength={AUDIT_EXECUTION_RULES.text.clarificationMaxLength}
						error={errors.response?.message}
						disabled={isPending}
						{...register("response")}
					/>
					{errorMessage ? (
						<p className="form-error-text mt-2" role="alert">
							{errorMessage}
						</p>
					) : null}
					<div className="mt-3 flex justify-end">
						<Button
							type="submit"
							text={isPending ? text.sending : text.send}
							appearance="standard"
							variant="brand"
							size="sm"
							disabled={isPending}
							loading={isPending}
						/>
					</div>
				</form>
			) : null}
		</section>
	);
}
