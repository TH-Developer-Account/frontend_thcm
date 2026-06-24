import React from "react";
import type { SingleValue } from "react-select";

import SelectInput from "../../../../../components/FormElements/SelectInput";
import TextareaInput from "../../../../../components/FormElements/TextareaInput";
import Button from "../../../../../components/common/Button";
import { validateUploadFile } from "../../../../../components/FileUpload/fileUpload.helpers";
import {
	eventDeviationOptions,
	eventOutcomeOptions,
} from "../../utils/constants";
import {
	useEventOutcomeMutation,
	useEventDeviationMutation,
} from "../../queries/useActivityFormQuery";
import { useToast } from "../../../../../context/Auth/AuthContext";
import type { Option } from "../../../../../components/FormElements/input.types";
import { getEventOutcomeMode } from "../../helpers/eventOutcome.helper";
import FormInput from "../../../../../components/FormElements/FormInput";
import type {
	DeviationInfo,
	EventOutcomeProps,
} from "../../types/event.outcome.types";
import { usePreviewWorkflowMutation } from "../../queries/useEventOutcomeMutation";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../../../utils/apiError.helper";
import { FileUploadField } from "../../../../../components/FileUpload/FileUploadField";
import SectionAccordion from "../../../../../components/common/SectionAccordion";

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
	const previewWorkflowMutation = usePreviewWorkflowMutation();
	const isSubmitting =
		eventOutcomeMutation.isPending ||
		eventDeviationMutation.isPending ||
		previewWorkflowMutation.isPending;

	const handleChange = React.useCallback((newValue: SingleValue<Option>) => {
		setSelectedOption(newValue ?? null);
		setDeviationInfo(initialDeviationInfo);
	}, []);

	const handleDeviationInfoChange = React.useCallback(
		<K extends keyof DeviationInfo>(field: K, value: DeviationInfo[K]) => {
			setDeviationInfo((prev) => ({
				...prev,
				[field]: value,
			}));
		},
		[],
	);

	const validateBeforeSubmit = React.useCallback(() => {
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

			if (Number(deviationInfo.deviatedAmount) <= 0) {
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
	}, [epcID, selectedOption, label, isDeviationRequired, deviationInfo]);

	const handleSubmit = React.useCallback(async () => {
		if (!mode) return;

		const validationError = validateBeforeSubmit();

		if (validationError) {
			showApiErrorToast(showToast, validationError, validationError);
			return;
		}

		try {
			if (isOutcomeMode) {
				const payload = {
					status: selectedOption!.value,
					reason: "",
				};

				await eventOutcomeMutation.mutateAsync({
					epcId: epcID!,
					payload,
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
						workspaceId: workspaceId!,
						appId: appId!,
						budget: Number(deviationInfo.deviatedAmount),
					});

					onDeviationPreviewSuccess?.(previewResponse?.stages ?? []);
				} else {
					const payload = {
						status: selectedOption!.value,
						reason: "",
					};

					await eventDeviationMutation.mutateAsync({
						epcId: epcID!,
						payload,
					});
				}
			}

			showSuccessToast(
				showToast,
				isOutcomeMode
					? "Event outcome saved successfully."
					: "Event deviation saved successfully.",
			);

			setSelectedOption(null);
			setDeviationInfo(initialDeviationInfo);

			await onSuccess?.();
		} catch (error: unknown) {
			showApiErrorToast(
				showToast,
				error,
				`Failed to save ${label.toLowerCase()}.`,
			);
			setSelectedOption(null);
			setDeviationInfo(initialDeviationInfo);
		}
	}, [
		mode,
		validateBeforeSubmit,
		showToast,
		isOutcomeMode,
		isDeviationMode,
		isDeviationRequired,
		selectedOption,
		eventOutcomeMutation,
		eventDeviationMutation,
		previewWorkflowMutation,
		epcID,
		workspaceId,
		appId,
		deviationInfo,
		label,
		onSuccess,
		onDeviationPreviewSuccess,
	]);

	if (!mode) return null;

	return (
		<SectionAccordion title="Activity Outcome">
			<div className="mt-4 px-4 py-2">
				<div
					className={`grid grid-cols-2 gap-2  ${isDeviationRequired && "mb-4"}  text-left`}
				>
					<SelectInput
						options={options}
						label={label}
						className="mb-2"
						value={selectedOption}
						onChange={handleChange}
					/>

					{isDeviationRequired && (
						<>
							<FormInput
								label="Deviated Amount"
								type="number"
								value={deviationInfo.deviatedAmount}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									handleDeviationInfoChange("deviatedAmount", e.target.value)
								}
							/>

							<TextareaInput
								name="reason"
								label="Reason"
								value={deviationInfo.reason}
								onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
									handleDeviationInfoChange("reason", e.target.value)
								}
								rows={5}
								helperText="Provide a complete breakdown of the total amount and the deviated amount. For example: Initial Food Amount: ₹1000, Deviated Food Amount: ₹200."
							/>

							<FileUploadField
								kind="pdf"
								label="Quotation Attachment"
								description="PDF only, up to 10 MB"
								value={deviationInfo.file}
								required
								onChange={(file) => handleDeviationInfoChange("file", file)}
							/>
						</>
					)}
				</div>
				<div
					className={`flex flex-row gap-2 ${isDeviationRequired ? "justify-end" : "justify-start"}`}
				>
					<Button
						type="button"
						status="brand"
						size="sm"
						text={"Reset"}
						onClick={() => {
							setDeviationInfo(initialDeviationInfo);
							setSelectedOption(null);
						}}
					/>
					<Button
						type="button"
						onClick={handleSubmit}
						status="brand"
						size="sm"
						disabled={!selectedOption?.value || isSubmitting}
					>
						{isSubmitting ? "Saving..." : "Save"}
					</Button>
				</div>
			</div>
		</SectionAccordion>
	);
};
