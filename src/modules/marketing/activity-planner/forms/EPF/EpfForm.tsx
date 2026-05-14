import React from "react";
import { LucideSave, RefreshCcw, Save, Send, X } from "lucide-react";

import Button from "../../../../../components/common/Button";
import Section from "../../components/Section";

import EpfItemsSection from "./EpfItemSection";
import { useEpfForm, type EpfFormProps } from "./useEpfForm";
import EpfFormFields from "./EpfFormFields";

export default function EpfForm(props: EpfFormProps) {
	const { onCancel } = props;

	const {
		values,
		errors,
		handleChange,
		handleReset,
		options,
		costItems,
		setCostItems,
		handleSubmit,
		eventCost,
		isEditMode,
		loading,
		submitting,
	} = useEpfForm(props);

	const actions = (
		<div className="flex flex-row items-center justify-end gap-2">
			{onCancel && (
				<Button
					type="button"
					text="Cancel"
					onClick={onCancel}
					className="text-red-600"
					size="sm"
					Icon={X}
					iconColor="red"
					disabled={submitting}
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
				disabled={submitting}
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
					disabled={submitting}
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
				disabled={submitting}
			/>
		</div>
	);

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center text-sm text-[var(--color-text-muted)]">
				Loading EPF details...
			</div>
		);
	}

	return (
		<div className="content-box mx-auto h-auto w-full max-w-full">
			<div className="px-6 py-4">
				<Section
					title={
						isEditMode
							? "Edit Event Proposition Form"
							: "Create Event Proposition Form"
					}
					action={actions}
				>
					<React.Fragment>
						<EpfItemsSection
							items={costItems}
							onChange={setCostItems}
							options={options}
							isViewer={false}
						/>

						<div className="mb-2">
							<EpfFormFields
								values={values}
								errors={errors}
								handleChange={handleChange}
								eventCost={eventCost}
							/>
						</div>
					</React.Fragment>
				</Section>
			</div>
		</div>
	);
}
