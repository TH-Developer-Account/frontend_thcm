import React from "react";
import { AlertTriangle } from "lucide-react";
import type { SingleValue } from "react-select";

import Button from "../../../../../components/common/Button";
import SelectInput from "../../../../../components/forms/SelectInput";
import FormInput from "../../../../../components/forms/FormInput";
import TextareaInput from "../../../../../components/forms/TextareaInput";
import { FileUploadField } from "../../../../../components/ui/FileUpload/FileUploadField";
import { validateUploadFile } from "../../../../../components/ui/FileUpload/fileUpload.helpers";

import { useToast } from "../../../../../context/Auth/AuthContext";
import {
	getApiErrorMessage,
	showApiErrorToast,
	showSuccessToast,
} from "../../../../../utils/apiError.helper";

import type { Option } from "../../../../../components/forms/input.types";
import type { DeviationInfo, EventOutcomeProps } from "../../types/epc.types";

import {
	eventDeviationOptions,
	eventOutcomeOptions,
} from "../../utils/constant";

import {
	useEventDeviationMutation,
	useEventOutcomeMutation,
} from "../../queries/epc.queries";
import { getEventOutcomeMode } from "../../utils/activity.helper";

const initialDeviationInfo: DeviationInfo = {
	reason: "",
	deviatedAmount: "",
	file: null,
};

const inr = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 2,
});

export const EventOutcome = ({
	eventStatus,
	epcID,
	eventBudget,
	onSuccess,
	onDeviationActivate,
}: EventOutcomeProps) => {
	const { showToast } = useToast();

	const eventOutcomeMutation = useEventOutcomeMutation();
	const eventDeviationMutation = useEventDeviationMutation();

	const [selectedOption, setSelectedOption] = React.useState<Option | null>(
		null,
	);
	const [isActivating, setIsActivating] = React.useState(false);
	const [deviationInfo, setDeviationInfo] =
		React.useState<DeviationInfo>(initialDeviationInfo);

	const mode = getEventOutcomeMode(eventStatus);

	const isOutcomeMode = mode === "OUTCOME";
	const isDeviationMode = mode === "DEVIATION_IN_PROGRESS";

	const isDeviationRequired =
		isDeviationMode && selectedOption?.value === "REQUIRED";
	// Any other deviation choice ("not required") asks for a reason only.
	const isDeviationNotRequired =
		isDeviationMode && Boolean(selectedOption?.value) && !isDeviationRequired;

	const options = isOutcomeMode ? eventOutcomeOptions : eventDeviationOptions;
	const label = isOutcomeMode ? "Event Outcome" : "Event Deviation";

	const isSubmitting =
		eventOutcomeMutation.isPending ||
		eventDeviationMutation.isPending ||
		isActivating;

	/* ---------------------------- Budget banner ---------------------------- */
	const totalBudget =
		eventBudget === null || eventBudget === undefined || eventBudget === ""
			? null
			: Number(eventBudget);
	const hasBudget = totalBudget !== null && Number.isFinite(totalBudget);
	const enteredDeviation = Number(deviationInfo.deviatedAmount);
	const revisedTotal =
		hasBudget && isDeviationRequired && enteredDeviation > 0
			? totalBudget + enteredDeviation
			: null;

	const resetForm = React.useCallback(() => {
		setSelectedOption(null);
		setDeviationInfo(initialDeviationInfo);
	}, []);

	const handleChange = React.useCallback((newValue: SingleValue<Option>) => {
		setSelectedOption(newValue ?? null);
		setDeviationInfo(initialDeviationInfo);
	}, []);

	const handleDeviationInfoChange = React.useCallback(
		<K extends keyof DeviationInfo>(field: K, value: DeviationInfo[K]) => {
			setDeviationInfo((current) => ({ ...current, [field]: value }));
		},
		[],
	);

	const validateBeforeSubmit = React.useCallback((): string | null => {
		if (!epcID) return "EPC ID not found.";

		if (!selectedOption?.value) {
			return `Please select ${label.toLowerCase()}.`;
		}

		if (isDeviationNotRequired && !deviationInfo.reason.trim()) {
			return "Please enter reason.";
		}

		if (isDeviationRequired) {
			if (!deviationInfo.deviatedAmount.trim()) {
				return "Please enter deviated amount.";
			}

			const deviatedAmount = Number(deviationInfo.deviatedAmount);
			if (!Number.isFinite(deviatedAmount) || deviatedAmount <= 0) {
				return "Deviated amount should be greater than 0.";
			}

			if (!deviationInfo.reason.trim()) return "Please enter reason.";

			if (!deviationInfo.file?.file) return "Please upload the quotation.";

			const fileError = validateUploadFile(deviationInfo.file.file, "pdf");
			if (fileError) return fileError;
		}

		return null;
	}, [
		deviationInfo,
		epcID,
		isDeviationNotRequired,
		isDeviationRequired,
		label,
		selectedOption,
	]);

	const handleSubmit = React.useCallback(async () => {
		if (!mode) return;

		const validationError = validateBeforeSubmit();
		if (validationError) {
			showApiErrorToast(showToast, validationError, validationError);
			return;
		}

		try {
			if (isOutcomeMode) {
				await eventOutcomeMutation.mutateAsync({
					epcId: epcID!,
					payload: { status: selectedOption!.value, reason: "" },
				});
			}

			if (isDeviationMode && isDeviationRequired) {
				const formData = new FormData();
				formData.append("status", selectedOption!.value);
				formData.append("reason", deviationInfo.reason.trim());
				formData.append("deviatedAmount", deviationInfo.deviatedAmount);
				if (deviationInfo.file?.file) {
					formData.append("file", deviationInfo.file.file);
				}

				await eventDeviationMutation.mutateAsync({
					epcId: epcID!,
					payload: formData,
				});

				// Deviation is saved. Now restart approval from the first stage.
				// Separate try so a failure here is reported accurately.
				try {
					setIsActivating(true);
					await onDeviationActivate?.(Number(deviationInfo.deviatedAmount));
				} catch (activationError: unknown) {
					showToast({
						type: "error",
						title: "Deviation saved, approval not restarted",
						description: getApiErrorMessage(
							activationError,
							"Could not restart the approval workflow. Please try again.",
						),
					});
					resetForm();
					await onSuccess?.();
					return;
				} finally {
					setIsActivating(false);
				}
			}

			if (isDeviationMode && !isDeviationRequired) {
				await eventDeviationMutation.mutateAsync({
					epcId: epcID!,
					payload: {
						status: selectedOption!.value,
						reason: deviationInfo.reason.trim(),
					},
				});
			}

			showSuccessToast(
				showToast,
				isOutcomeMode
					? "Event outcome saved successfully."
					: isDeviationRequired
						? "Deviation saved. Approval restarted from the first stage."
						: "Event deviation saved successfully.",
			);

			resetForm();
			await onSuccess?.();
		} catch (error: unknown) {
			showApiErrorToast(
				showToast,
				error,
				`Failed to save ${label.toLowerCase()}.`,
			);
			resetForm();
		}
	}, [
		deviationInfo,
		epcID,
		eventDeviationMutation,
		eventOutcomeMutation,
		isDeviationMode,
		isDeviationRequired,
		isOutcomeMode,
		label,
		mode,
		onDeviationActivate,
		onSuccess,
		resetForm,
		selectedOption,
		showToast,
		validateBeforeSubmit,
	]);

	if (!mode) return null;

	return (
		<section aria-label="Activity outcome">
			{/* 1. Total event budget alert, above the form */}
			{isDeviationMode && hasBudget ? (
				<div
					role="alert"
					className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
				>
					<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
					<div className="text-sm text-amber-900">
						<p className="font-medium">
							Total event budget: {inr.format(totalBudget)}
						</p>
						<p className="mt-0.5 text-xs text-amber-800">
							{revisedTotal !== null
								? `With this deviation the revised total will be ${inr.format(revisedTotal)}. `
								: ""}
							Submitting a deviated amount sends this EPC back to the first
							approval stage.
						</p>
					</div>
				</div>
			) : null}

			<div
				className={[
					"event-outcome-form-grid",
					isDeviationRequired && "event-outcome-form-grid-expanded",
				]
					.filter(Boolean)
					.join(" ")}
			>
				<div className="event-outcome-field event-outcome-field-selection">
					<SelectInput
						name="eventOutcome"
						options={options}
						label={label}
						value={selectedOption}
						isDisabled={isSubmitting}
						onChange={handleChange}
					/>
				</div>

				{/* 3. "Not required" → reason only, sent in the payload */}
				{isDeviationNotRequired ? (
					<div className="event-outcome-field event-outcome-field-reason">
						<TextareaInput
							name="reason"
							label="Reason"
							value={deviationInfo.reason}
							disabled={isSubmitting}
							rows={4}
							helperText="Briefly explain why no deviation is needed."
							onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
								handleDeviationInfoChange("reason", event.target.value)
							}
						/>
					</div>
				) : null}

				{isDeviationRequired ? (
					<>
						<div className="event-outcome-field event-outcome-field-amount">
							<FormInput
								name="deviatedAmount"
								label="Deviated Amount"
								type="number"
								min="0"
								step="0.01"
								value={deviationInfo.deviatedAmount}
								disabled={isSubmitting}
								onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
									handleDeviationInfoChange(
										"deviatedAmount",
										event.target.value,
									)
								}
							/>
						</div>

						<div className="event-outcome-field event-outcome-field-reason">
							<TextareaInput
								name="reason"
								label="Reason"
								value={deviationInfo.reason}
								disabled={isSubmitting}
								rows={4}
								helperText="Provide a complete breakdown of the approved amount and the deviated amount."
								onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
									handleDeviationInfoChange("reason", event.target.value)
								}
							/>
						</div>

						<div className="event-outcome-field event-outcome-field-upload">
							<FileUploadField
								kind="pdf"
								label="Quotation Attachment"
								description="Upload one PDF file, up to 10 MB."
								value={deviationInfo.file}
								required
								disabled={isSubmitting}
								onChange={(file) => handleDeviationInfoChange("file", file)}
							/>
						</div>
					</>
				) : null}
			</div>

			<footer className="event-outcome-actions">
				<Button
					type="button"
					text="Reset"
					appearance="standard"
					variant="outline"
					size="sm"
					disabled={isSubmitting}
					onClick={resetForm}
				/>
				<Button
					type="button"
					text={isSubmitting ? "Saving..." : "Save"}
					appearance="standard"
					variant="brand"
					size="sm"
					disabled={!selectedOption?.value || isSubmitting}
					onClick={handleSubmit}
				/>
			</footer>
		</section>
	);
};
