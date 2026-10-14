// modules/audit/dealerAudit/components/AuditWorkflowDialogs.tsx
//
// Confirmation and data-entry dialogs for workflow actions. Each dialog:
//   • validates with the shared zod schemas and shows errors beside the field
//   • disables itself while the request runs (no duplicate submissions)
//   • keeps what the user typed when the request fails, and shows why
//   • only resets when it is (re)opened

import { zodResolver } from "@hookform/resolvers/zod";
import {
	useEffect,
	useMemo,
	useState,
	type FormEventHandler,
	type ReactNode,
} from "react";
import { Controller, useForm } from "react-hook-form";

import Button from "../../../../components/common/Button";
import { Modal } from "../../../../components/common/Modal";
import FormInput from "../../../../components/forms/FormInput";
import SelectInput from "../../../../components/forms/SelectInput";
import TextareaInput from "../../../../components/forms/TextareaInput";
import { DEALER_AUDIT_RULES } from "../dealer-audit.config";
import { dealerAuditContent as content } from "../dealer-audit.content";
import { toDateInputValue } from "../../shared/execution/audit-execution.format";
import {
	approveAuditSchema,
	raiseClarificationSchema,
	reAuditSchema,
	reassignReviewerSchema,
	rejectAuditSchema,
	type ApproveAuditFormValues,
	type RaiseClarificationFormValues,
	type ReAuditFormValues,
	type ReassignReviewerFormValues,
	type RejectAuditFormValues,
} from "../dealer-audit.schemas";
import type { DealerAuditChecklistItem } from "../dealer-audit.types";
import { useReviewerOptions } from "../hooks/useDealerAudits";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";

const text = content.ui.dialogs;

// ── Shared frame + submit state ───────────────────────────────────────

interface DialogBaseProps<TValues> {
	open: boolean;
	onClose: () => void;
	onSubmit: (values: TValues) => Promise<void>;
}

function useSubmitState(onClose: () => void) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const run = async (action: () => Promise<void>): Promise<void> => {
		if (isSubmitting) return; // no duplicate submissions
		setIsSubmitting(true);
		setErrorMessage(null);
		try {
			await action();
			onClose();
		} catch (error) {
			setErrorMessage(getAuditActionErrorMessage(error, "audit"));
		} finally {
			setIsSubmitting(false);
		}
	};

	const clear = (): void => setErrorMessage(null);
	return { isSubmitting, errorMessage, run, clear };
}

interface DialogFrameProps {
	open: boolean;
	title: string;
	description?: string;
	formId: string;
	submitText: string;
	submitVariant?: "brand" | "danger" | "success";
	isSubmitting: boolean;
	errorMessage: string | null;
	onClose: () => void;
	onSubmit: FormEventHandler<HTMLFormElement>;
	children?: ReactNode;
}

function DialogFrame({
	open,
	title,
	description,
	formId,
	submitText,
	submitVariant = "brand",
	isSubmitting,
	errorMessage,
	onClose,
	onSubmit,
	children,
}: DialogFrameProps) {
	const handleClose = (): void => {
		if (!isSubmitting) onClose();
	};

	return (
		<Modal
			open={open}
			title={title}
			size="md"
			onClose={handleClose}
			closeOnOverlayClick={false}
			footer_actions={
				<>
					<Button
						type="button"
						text={text.cancel}
						appearance="standard"
						variant="outline"
						size="sm"
						disabled={isSubmitting}
						onClick={handleClose}
					/>
					<Button
						type="submit"
						form={formId}
						text={submitText}
						appearance="standard"
						variant={submitVariant}
						size="sm"
						disabled={isSubmitting}
						loading={isSubmitting}
					/>
				</>
			}
		>
			<form
				id={formId}
				noValidate
				onSubmit={onSubmit}
				className="space-y-4"
			>
				{description ? (
					<p className="text-sm text-(--color-text-secondary)">{description}</p>
				) : null}
				{children}
				{errorMessage ? (
					<p className="form-error-text" role="alert">
						{errorMessage}
					</p>
				) : null}
			</form>
		</Modal>
	);
}

// ── Plain confirmation ────────────────────────────────────────────────

interface ConfirmActionDialogProps {
	open: boolean;
	title: string;
	description: string;
	confirmText: string;
	variant?: "brand" | "danger" | "success";
	onClose: () => void;
	onConfirm: () => Promise<void>;
}

export function ConfirmActionDialog({
	open,
	title,
	description,
	confirmText,
	variant = "brand",
	onClose,
	onConfirm,
}: ConfirmActionDialogProps) {
	const { isSubmitting, errorMessage, run, clear } = useSubmitState(onClose);

	useEffect(() => {
		if (open) clear();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	return (
		<DialogFrame
			open={open}
			title={title}
			description={description}
			formId="confirm-action-form"
			submitText={confirmText}
			submitVariant={variant}
			isSubmitting={isSubmitting}
			errorMessage={errorMessage}
			onClose={onClose}
			onSubmit={(event) => {
				event.preventDefault();
				void run(onConfirm);
			}}
		/>
	);
}

// ── Approve ───────────────────────────────────────────────────────────

export function ApproveAuditDialog({
	open,
	onClose,
	onSubmit,
}: DialogBaseProps<ApproveAuditFormValues>) {
	const { isSubmitting, errorMessage, run, clear } = useSubmitState(onClose);
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ApproveAuditFormValues>({
		resolver: zodResolver(approveAuditSchema),
		defaultValues: { remarks: "" },
	});

	useEffect(() => {
		if (open) {
			reset({ remarks: "" });
			clear();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, reset]);

	return (
		<DialogFrame
			open={open}
			title={text.approve.title}
			description={text.approve.description}
			formId="approve-audit-form"
			onSubmit={(event) =>
				void handleSubmit((values) => run(() => onSubmit(values)))(event)
			}
			submitText={text.approve.confirm}
			submitVariant="success"
			isSubmitting={isSubmitting}
			errorMessage={errorMessage}
			onClose={onClose}
		>
			<TextareaInput
				label={text.approve.remarksLabel}
				rows={3}
				maxLength={DEALER_AUDIT_RULES.text.reasonMaxLength}
				error={errors.remarks?.message}
				disabled={isSubmitting}
				{...register("remarks")}
			/>
		</DialogFrame>
	);
}

// ── Reject ────────────────────────────────────────────────────────────

export function RejectAuditDialog({
	open,
	onClose,
	onSubmit,
}: DialogBaseProps<RejectAuditFormValues>) {
	const { isSubmitting, errorMessage, run, clear } = useSubmitState(onClose);
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<RejectAuditFormValues>({
		resolver: zodResolver(rejectAuditSchema),
		defaultValues: { reason: "" },
	});

	useEffect(() => {
		if (open) {
			reset({ reason: "" });
			clear();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, reset]);

	return (
		<DialogFrame
			open={open}
			title={text.reject.title}
			description={text.reject.description}
			formId="reject-audit-form"
			onSubmit={(event) =>
				void handleSubmit((values) => run(() => onSubmit(values)))(event)
			}
			submitText={text.reject.confirm}
			submitVariant="danger"
			isSubmitting={isSubmitting}
			errorMessage={errorMessage}
			onClose={onClose}
		>
			<TextareaInput
				label={text.reject.reasonLabel}
				rows={4}
				maxLength={DEALER_AUDIT_RULES.text.reasonMaxLength}
				error={errors.reason?.message}
				disabled={isSubmitting}
				{...register("reason")}
			/>
		</DialogFrame>
	);
}

// ── Raise clarification ───────────────────────────────────────────────

interface RaiseClarificationDialogProps
	extends DialogBaseProps<RaiseClarificationFormValues> {
	/** Items that can be sent back to the dealer. */
	items: readonly DealerAuditChecklistItem[];
}

export function RaiseClarificationDialog({
	open,
	items,
	onClose,
	onSubmit,
}: RaiseClarificationDialogProps) {
	const { isSubmitting, errorMessage, run, clear } = useSubmitState(onClose);
	const preselected = useMemo(
		() =>
			items
				.filter((item) => item.review?.decision === "CLARIFICATION_REQUIRED")
				.map((item) => item.id),
		[items],
	);
	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<RaiseClarificationFormValues>({
		resolver: zodResolver(raiseClarificationSchema),
		defaultValues: { itemIds: preselected, remarks: "" },
	});

	useEffect(() => {
		if (open) {
			reset({ itemIds: preselected, remarks: "" });
			clear();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, reset]);

	return (
		<DialogFrame
			open={open}
			title={text.clarification.title}
			description={text.clarification.description}
			formId="raise-clarification-form"
			onSubmit={(event) =>
				void handleSubmit((values) => run(() => onSubmit(values)))(event)
			}
			submitText={text.clarification.confirm}
			isSubmitting={isSubmitting}
			errorMessage={errorMessage}
			onClose={onClose}
		>
			<Controller
				control={control}
				name="itemIds"
				render={({ field }) => (
					<fieldset
						className="space-y-1"
						aria-describedby={errors.itemIds ? "clarification-items-error" : undefined}
					>
						<legend className="mb-1 text-sm font-medium text-(--color-text-primary)">
							{text.clarification.itemsLabel}
						</legend>
						<ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-(--color-border-default) p-2">
							{items.map((item) => {
								const checked = field.value.includes(item.id);
								return (
									<li key={item.id}>
										<label className="flex min-h-9 cursor-pointer items-start gap-2 text-sm">
											<input
												type="checkbox"
												className="mt-0.5 size-4"
												checked={checked}
												disabled={isSubmitting}
												onChange={() =>
													field.onChange(
														checked
															? field.value.filter((id) => id !== item.id)
															: [...field.value, item.id],
													)
												}
											/>
											<span className="min-w-0 break-words">
												<span className="font-medium">{item.sequence}.</span>{" "}
												{item.title}
											</span>
										</label>
									</li>
								);
							})}
						</ul>
						{errors.itemIds ? (
							<p
								id="clarification-items-error"
								className="form-error-text"
								role="alert"
							>
								{errors.itemIds.message}
							</p>
						) : null}
					</fieldset>
				)}
			/>
			<TextareaInput
				label={text.clarification.remarksLabel}
				rows={4}
				maxLength={DEALER_AUDIT_RULES.text.clarificationMaxLength}
				error={errors.remarks?.message}
				disabled={isSubmitting}
				{...register("remarks")}
			/>
		</DialogFrame>
	);
}

// ── Reassign reviewer ─────────────────────────────────────────────────

interface ReassignReviewerDialogProps
	extends DialogBaseProps<ReassignReviewerFormValues> {
	currentReviewerId: string | null;
}

export function ReassignReviewerDialog({
	open,
	currentReviewerId,
	onClose,
	onSubmit,
}: ReassignReviewerDialogProps) {
	const { isSubmitting, errorMessage, run, clear } = useSubmitState(onClose);
	const reviewers = useReviewerOptions(open);
	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<ReassignReviewerFormValues>({
		resolver: zodResolver(reassignReviewerSchema),
		defaultValues: { reviewerId: "", reason: "" },
	});

	useEffect(() => {
		if (open) {
			reset({ reviewerId: "", reason: "" });
			clear();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, reset]);

	const options = useMemo(
		() =>
			(reviewers.data ?? [])
				.filter((reviewer) => reviewer.id !== currentReviewerId)
				.map((reviewer) => ({
					value: reviewer.id,
					label: reviewer.designation
						? `${reviewer.name} — ${reviewer.designation}`
						: reviewer.name,
				})),
		[currentReviewerId, reviewers.data],
	);

	return (
		<DialogFrame
			open={open}
			title={text.reassign.title}
			description={text.reassign.description}
			formId="reassign-reviewer-form"
			onSubmit={(event) =>
				void handleSubmit((values) => run(() => onSubmit(values)))(event)
			}
			submitText={text.reassign.confirm}
			isSubmitting={isSubmitting}
			errorMessage={errorMessage}
			onClose={onClose}
		>
			<Controller
				control={control}
				name="reviewerId"
				render={({ field }) => (
					<SelectInput
						label={text.reassign.reviewerLabel}
						required
						options={options}
						value={options.find((option) => option.value === field.value) ?? null}
						onChange={(option) => field.onChange(option?.value ?? "")}
						isDisabled={isSubmitting || reviewers.isLoading}
						placeholder={
							reviewers.isLoading
								? text.reassign.loadingReviewers
								: text.reassign.reviewerPlaceholder
						}
						error={
							errors.reviewerId?.message ??
							(reviewers.isError ? text.reassign.reviewersFailed : undefined)
						}
					/>
				)}
			/>
			<TextareaInput
				label={text.reassign.reasonLabel}
				rows={3}
				maxLength={DEALER_AUDIT_RULES.text.reasonMaxLength}
				error={errors.reason?.message}
				disabled={isSubmitting}
				{...register("reason")}
			/>
		</DialogFrame>
	);
}

// ── Re-audit for improvement ──────────────────────────────────────────

export function ReAuditDialog({
	open,
	onClose,
	onSubmit,
}: DialogBaseProps<ReAuditFormValues>) {
	const { isSubmitting, errorMessage, run, clear } = useSubmitState(onClose);
	const schema = useMemo(() => reAuditSchema(), []);
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ReAuditFormValues>({
		resolver: zodResolver(schema),
		defaultValues: { reason: "", dueDate: "" },
	});

	useEffect(() => {
		if (open) {
			reset({ reason: "", dueDate: "" });
			clear();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, reset]);

	return (
		<DialogFrame
			open={open}
			title={text.reAudit.title}
			description={text.reAudit.description}
			formId="re-audit-form"
			onSubmit={(event) =>
				void handleSubmit((values) => run(() => onSubmit(values)))(event)
			}
			submitText={text.reAudit.confirm}
			isSubmitting={isSubmitting}
			errorMessage={errorMessage}
			onClose={onClose}
		>
			<TextareaInput
				label={text.reAudit.reasonLabel}
				rows={3}
				maxLength={DEALER_AUDIT_RULES.text.reasonMaxLength}
				error={errors.reason?.message}
				disabled={isSubmitting}
				{...register("reason")}
			/>
			<FormInput
				type="date"
				label={text.reAudit.dueDateLabel}
				min={toDateInputValue(new Date())}
				error={errors.dueDate?.message}
				disabled={isSubmitting}
				{...register("dueDate")}
			/>
		</DialogFrame>
	);
}
