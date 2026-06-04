import React from "react";
import type { SingleValue } from "react-select";

import SelectInput from "../../../../components/FormElements/SelectInput";
import TextareaInput from "../../../../components/FormElements/TextareaInput";
import Button from "../../../../components/common/Button";
import Section from "./Section";

import { eventDeviationOptions, eventOutcomeOptions } from "../utils/constants";
import {
	useEventOutcomeMutation,
	useEventDeviationMutation,
} from "../queries/useActivityFormQuery";
import { useToast } from "../../../../context/Auth/AuthContext";
import type { Option } from "../../../../components/FormElements/input.types";
import { getEventOutcomeMode } from "../utils/eventOutcome.helper";

type EventOutcomeProps = {
	eventStatus: string;
	epcID?: string | null;
	onSuccess?: () => void | Promise<void>;
};

export const EventOutcome = ({
	eventStatus,
	epcID,
	onSuccess,
}: EventOutcomeProps) => {
	const { showToast } = useToast();

	const eventOutcomeMutation = useEventOutcomeMutation();
	const eventDeviationMutation = useEventDeviationMutation();

	const [selectedOption, setSelectedOption] = React.useState<Option | null>(
		null,
	);
	const [reason, setReason] = React.useState("");

	const mode = getEventOutcomeMode(eventStatus);

	const isOutcomeMode = mode === "OUTCOME";
	const isDeviationMode = mode === "DEVIATION";

	const options = isOutcomeMode ? eventOutcomeOptions : eventDeviationOptions;

	const label = isOutcomeMode ? "Event Outcome" : "Event Deviation";

	const isSubmitting =
		eventOutcomeMutation.isPending || eventDeviationMutation.isPending;

	const handleChange = React.useCallback((newValue: SingleValue<Option>) => {
		setSelectedOption(newValue ?? null);
	}, []);

	const handleSubmit = React.useCallback(async () => {
		if (!mode) return;

		if (!epcID) {
			showToast({
				type: "error",
				title: "Error",
				description: "EPC ID not found.",
			});
			return;
		}

		if (!selectedOption?.value) {
			showToast({
				type: "error",
				title: "Error",
				description: `Please select ${label.toLowerCase()}.`,
			});
			return;
		}

		const payload = {
			status: selectedOption.value,
			reason: reason.trim(),
		};

		try {
			if (isOutcomeMode) {
				await eventOutcomeMutation.mutateAsync({
					epcId: epcID,
					payload,
				});
			}

			if (isDeviationMode) {
				await eventDeviationMutation.mutateAsync({
					epcId: epcID,
					payload,
				});
			}

			showToast({
				type: "success",
				title: "Success",
				description: isOutcomeMode
					? "Event outcome saved successfully."
					: "Event deviation saved successfully.",
			});

			setSelectedOption(null);
			setReason("");

			await onSuccess?.();
		} catch (error: any) {
			showToast({
				type: "error",
				title: "Error",
				description:
					error?.response?.data?.message ||
					error?.message ||
					`Failed to save ${label.toLowerCase()}.`,
			});
		}
	}, [
		mode,
		epcID,
		selectedOption,
		reason,
		label,
		isOutcomeMode,
		isDeviationMode,
		eventOutcomeMutation,
		eventDeviationMutation,
		showToast,
		onSuccess,
	]);

	if (!mode) return null;

	return (
		<Section title="Activity Outcome">
			<div className="px-4 py-2">
				<SelectInput
					options={options}
					label={label}
					className="mb-2"
					value={selectedOption}
					onChange={handleChange}
				/>

				<TextareaInput
					name="reason"
					label="Reason"
					className="mb-2"
					value={reason}
					onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
						setReason(e.target.value)
					}
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
		</Section>
	);
};
