import React from "react";
import { LucideSave, RefreshCcw, Save, Send, X } from "lucide-react";
import EpcFormFields from "../EPC/EpcFormFields";
import { useEpfForm, type EpfFormProps } from "./useEpfForm";
import Button from "../../../../../components/common/Button";
import Section from "../../components/Section";

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

	const actions = (
		<div className="flex flex-row gap-2 items-center justify-end">
			{onCancel && (
				<Button
					type="button"
					text="Cancel"
					onClick={onCancel}
					className="text-red-600"
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

			{!isEditMode && (
				<Button
					type="button"
					onClick={() => handleSubmit("DRAFT")}
					text="Save Draft"
					size="sm"
					className="text-red-600"
					iconColor="red"
					Icon={LucideSave}
				/>
			)}

			<Button
				type="button"
				onClick={() => handleSubmit("SUBMITTED")}
				text={isEditMode ? "Update" : "Submit"}
				size="sm"
				className="text-red-600"
				iconColor="red"
				Icon={isEditMode ? Save : Send}
			/>
		</div>
	);

	const formBody = (
		<React.Fragment>
			<EpfItemsSection
				items={costItems}
				onChange={setCostItems}
				options={options}
				isViewer={false}
			/>

			<div className="mb-2">
				<EpcFormFields
					values={values}
					errors={errors}
					masters={masters}
					onChange={handleChange}
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
				action={actions}
			>
				{formBody}
			</Section>
		);
	}

	return (
		<div className="content-box w-full h-auto max-w-full mx-auto">
			<div className="px-6 py-4">
				<Section
					title={
						isEditMode
							? "Edit Activity Proposition Form"
							: "Create Activity Proposition Form"
					}
					action={actions}
				>
					{formBody}
				</Section>
			</div>
		</div>
	);
}
