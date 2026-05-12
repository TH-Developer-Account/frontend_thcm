import React from "react";

import EpfFormInfo from "./EpfFormInfo";
import EpfItemsSection from "./components/EpfItemsSection";
import { useEpfForm, type EpfFormProps } from "./hooks/useEPFForm";
import Button from "../../../../components/common/Button";
import Section from "../ActivityPlannerView/components/Section";
import { LucideSave, RefreshCcw, Save, X } from "lucide-react";

export default function EpfForm(props: EpfFormProps) {
	const { variant = "page", onCancel } = props;

	const {
		values,
		handleChange,
		handleReset,
		options,
		costItems,
		setCostItems,
		handleSubmit,
		eventCost,
		isEditMode,
		loading,
	} = useEpfForm(props);

	const formBody = (
		<React.Fragment>
			<EpfItemsSection
				items={costItems}
				onChange={setCostItems}
				options={options}
				isViewer={false}
			/>

			<div className="mb-2">
				<EpfFormInfo
					values={values}
					handleChange={handleChange}
					eventCost={eventCost}
				/>
			</div>
		</React.Fragment>
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64 text-gray-500">
				Loading EPF details...
			</div>
		);
	}

	if (variant === "inline") {
		return (
			<Section
				title={
					isEditMode
						? "Edit Activity Proposition Form"
						: "Create Activity Proposition Form"
				}
				action={
					<div className="flex flex-row gap-2 items-end">
						{onCancel && (
							<Button
								type="button"
								text="Cancel"
								onClick={onCancel}
								className=" text-red-600"
								size="sm"
								Icon={X}
								iconColor="red"
							/>
						)}
						<Button
							type="button"
							text="Reset"
							onClick={handleReset}
							Icon={RefreshCcw}
							size="sm"
							className="text-red-600"
							iconColor="red"
						/>
						<Button
							type="button"
							onClick={() => handleSubmit("SUBMITTED")}
							text={isEditMode ? "Update" : "Save"}
							size="sm"
							className="text-red-600"
							iconColor="red"
							Icon={isEditMode ? Save : LucideSave}
						/>
					</div>
				}
			>
				{formBody}
			</Section>
		);
	}
}
