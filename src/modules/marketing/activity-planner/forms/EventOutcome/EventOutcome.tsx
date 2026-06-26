import React from "react";
import type { SingleValue } from "react-select";

import Button from "../../../../../components/common/Button";
import SelectInput from "../../../../../components/FormElements/SelectInput";
import FormInput from "../../../../../components/FormElements/FormInput";
import TextareaInput from "../../../../../components/FormElements/TextareaInput";
import { FileUploadField } from "../../../../../components/FileUpload/FileUploadField";
import { validateUploadFile } from "../../../../../components/FileUpload/fileUpload.helpers";
import SectionAccordion from "../../../../../components/common/SectionAccordion";

import { useToast } from "../../../../../context/Auth/AuthContext";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../../../utils/apiError.helper";

import type { Option } from "../../../../../components/FormElements/input.types";
import type {
	DeviationInfo,
	EventOutcomeProps,
} from "../../types/event.outcome.types";

import {
	eventDeviationOptions,
	eventOutcomeOptions,
} from "../../utils/constants";

import { getEventOutcomeMode } from "../../helpers/eventOutcome.helper";

import {
	useEventDeviationMutation,
	useEventOutcomeMutation,
} from "../../queries/useActivityFormQuery";

import { usePreviewWorkflowMutation } from "../../queries/useEventOutcomeMutation";

const initialDeviationInfo: DeviationInfo = {
	reason: "",
	deviatedAmount: "",
	file: null,
};

export const EventOutcome = ({
	eventStatus,
	epcID,
	workspaceId,
	appId,
	onSuccess,
	onDeviationPreviewSuccess,
}: EventOutcomeProps) => {
	const { showToast } = useToast();

	const eventOutcomeMutation = useEventOutcomeMutation();
	const eventDeviationMutation = useEventDeviationMutation();
	const previewWorkflowMutation = usePreviewWorkflowMutation();

	const [selectedOption, setSelectedOption] = React.useState<Option | null>(
		null,
	);

	const [deviationInfo, setDeviationInfo] =
		React.useState<DeviationInfo>(initialDeviationInfo);

	const mode = getEventOutcomeMode(eventStatus);

	const isOutcomeMode = mode === "OUTCOME";
	const isDeviationMode = mode === "DEVIATION_IN_PROGRESS";

	const isDeviationRequired =
		isDeviationMode && selectedOption?.value === "REQUIRED";

	const options = isOutcomeMode ? eventOutcomeOptions : eventDeviationOptions;

	const label = isOutcomeMode ? "Event Outcome" : "Event Deviation";

	const isSubmitting =
		eventOutcomeMutation.isPending ||
		eventDeviationMutation.isPending ||
		previewWorkflowMutation.isPending;

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
			setDeviationInfo((current) => ({
				...current,
				[field]: value,
			}));
		},
		[],
	);

	const validateBeforeSubmit = React.useCallback((): string | null => {
		if (!epcID) {
			return "EPC ID not found.";
		}

		if (!selectedOption?.value) {
			return `Please select ${label.toLowerCase()}.`;
		}

		if (isDeviationRequired) {
			if (!deviationInfo.deviatedAmount.trim()) {
				return "Please enter deviated amount.";
			}

			const deviatedAmount = Number(deviationInfo.deviatedAmount);

			if (!Number.isFinite(deviatedAmount) || deviatedAmount <= 0) {
				return "Deviated amount should be greater than 0.";
			}

			if (!deviationInfo.reason.trim()) {
				return "Please enter reason.";
			}

			if (!deviationInfo.file?.file) {
				return "Please upload the quotation.";
			}

			const fileError = validateUploadFile(deviationInfo.file.file, "pdf");

			if (fileError) {
				return fileError;
			}
		}

		return null;
	}, [deviationInfo, epcID, isDeviationRequired, label, selectedOption]);

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
					payload: {
						status: selectedOption!.value,
						reason: "",
					},
				});
			}

			if (isDeviationMode) {
				if (isDeviationRequired) {
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

					if (!workspaceId || !appId) {
						showApiErrorToast(
							showToast,
							"Workspace or application id not found.",
							"Workspace or application id not found.",
						);

						return;
					}

					const previewResponse = await previewWorkflowMutation.mutateAsync({
						workspaceId,
						appId,
						budget: Number(deviationInfo.deviatedAmount),
					});

					onDeviationPreviewSuccess?.(previewResponse?.stages ?? []);
				} else {
					await eventDeviationMutation.mutateAsync({
						epcId: epcID!,
						payload: {
							status: selectedOption!.value,
							reason: "",
						},
					});
				}
			}

			showSuccessToast(
				showToast,
				isOutcomeMode
					? "Event outcome saved successfully."
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
		appId,
		deviationInfo,
		epcID,
		eventDeviationMutation,
		eventOutcomeMutation,
		isDeviationMode,
		isDeviationRequired,
		isOutcomeMode,
		label,
		mode,
		onDeviationPreviewSuccess,
		onSuccess,
		previewWorkflowMutation,
		resetForm,
		selectedOption,
		showToast,
		validateBeforeSubmit,
		workspaceId,
	]);

	if (!mode) return null;

	return (
		<SectionAccordion title="Activity Outcome">
			<section className="event-outcome" aria-label="Activity outcome">
				<div className="event-outcome-intro">
					<div className="event-outcome-intro-copy">
						<h3 className="event-outcome-title">{label}</h3>

						<p className="event-outcome-description">
							{isOutcomeMode
								? "Record the final outcome of this activity."
								: "Confirm whether the activity requires a budget deviation."}
						</p>
					</div>

					{isDeviationRequired ? (
						<span className="event-outcome-required-indicator">
							Additional details required
						</span>
					) : null}
				</div>

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
		</SectionAccordion>
	);
};
