import React from "react";
import SelectInput from "../../../../components/FormElements/SelectInput";
import Button from "../../../../components/common/Button";

import { eventOutcomeOptions } from "../utils/constants";
import { useEventOutcomeMutation } from "../queries/useActivityFormQuery";
import { useToast } from "../../../../context/Auth/AuthContext";
import type { Option } from "../../../../components/FormElements/input.types";
import type { SingleValue } from "react-select";
import Section from "./Section";
import TextareaInput from "../../../../components/FormElements/TextareaInput";

type EventOutcomeProps = {
	eventStatus: string;
	epcID?: string | null;
};

export const EventOutcome = ({ eventStatus, epcID }: EventOutcomeProps) => {
	const [selectedOutcome, setSelectedOutcome] = React.useState<Option | null>(
		null,
	);
	const { showToast } = useToast();
	const eventOutcomeMutation = useEventOutcomeMutation();

	const handleChange = React.useCallback((newValue: SingleValue<Option>) => {
		setSelectedOutcome(newValue);
	}, []);

	const handleSubmit = React.useCallback(async () => {
		try {
			if (!epcID) {
				showToast({
					type: "error",
					title: "Error",
					description: "EPC ID not found.",
				});

				return;
			}

			const payload = {
				status: selectedOutcome?.value ?? "",
				reason: "",
			};

			await eventOutcomeMutation.mutateAsync({
				epcId: epcID,
				payload,
			});

			showToast({
				type: "success",
				title: "Success",
				description: "Event outcome saved successfully.",
			});
		} catch (error: any) {
			console.error("Event outcome save failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to save event outcome.",
			});
		}
	}, [epcID, selectedOutcome, eventOutcomeMutation, showToast]);

	if (eventStatus !== "APPROVED") {
		return null;
	}

	return (
		<Section title="Activity Outcome">
			<div className="px-4 py-2">
				<SelectInput
					options={eventOutcomeOptions}
					label="Event Status"
					className="mb-2"
					value={selectedOutcome}
					onChange={handleChange}
				/>
				<TextareaInput name="reason" label="Reason" className="mb-2" />
				<Button
					onClick={handleSubmit}
					status="brand"
					size="sm"
					disabled={!selectedOutcome || eventOutcomeMutation.isPending}
				>
					Save
				</Button>
			</div>
		</Section>
	);
};
