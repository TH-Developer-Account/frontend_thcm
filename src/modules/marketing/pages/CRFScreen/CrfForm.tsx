import React from "react";

import Button from "../../../../components/common/Button";
import Section from "../ActivityPlannerView/components/Section";

import { CrfItemsSection } from "./component.CrfLineItemSection";
import { useCrfForm, type CrfFormProps } from "./useCRFForm";

export default function CrfForm(props: CrfFormProps) {
	const { onCancel } = props;

	const {
		costItems,
		setCostItems,
		options,
		loading,
		isEditMode,
		handleSubmit,
		handleReset,
	} = useCrfForm(props);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64 text-gray-500">
				Loading CRF details...
			</div>
		);
	}

	return (
		<React.Fragment>
			<Section
				title="Collateral Requisition Form"
				action={
					<div className="flex flex-row gap-4 items-end">
						{onCancel && (
							<Button
								type="button"
								onClick={onCancel}
								text="Cancel"
								size="sm"
								iconColor="darkBlue"
							/>
						)}
					</div>
				}
			>
				<div className="flex flex-row gap-4 items-end justify-end">
					<Button
						type="button"
						onClick={handleReset}
						size="sm"
						text={"Reset"}
						iconColor="darkBlue"
					/>

					<Button
						type="button"
						onClick={handleSubmit}
						text={isEditMode ? "Update" : "Save"}
						className="ml-2 text-darkBlue"
						size="sm"
						iconColor="darkBlue"
					/>
				</div>
				<CrfItemsSection
					items={costItems}
					onChange={setCostItems}
					isViewer={false}
					options={options}
				/>
			</Section>
		</React.Fragment>
	);
}
