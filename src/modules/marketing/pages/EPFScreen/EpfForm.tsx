import React from "react";

import EpfFormInfo from "./EpfFormInfo";
import EpfItemsSection from "./components/EpfItemsSection";
import { useEpfForm, type EpfFormProps } from "./hooks/useEPFForm";

import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../components/ui/PageHeader";
import Button from "../../../../components/common/Button";
import Section from "../ActivityPlannerView/components/Section";

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
		epcId,
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
							<Button type="button" text="Cancel" onClick={onCancel} />
						)}
						<Button type="button" text="Reset" onClick={handleReset} />

						<Button
							type="button"
							onClick={() => handleSubmit("SUBMITTED")}
							text={isEditMode ? "Update" : "Save"}
						/>
					</div>
				}
			>
				{formBody}
			</Section>
		);
	}

	return (
		<PageRowSectionLayout
			contentClassName="p-4"
			header_children={
				<div className="flex flex-col sm:flex-row sm:justify-between items-end sm:items-start">
					<PageHeader
						headerText="Activity Proposition Form (APF)"
						subtitleText="Manage your Activity Proposition Form (APF) details here"
						badgeProps={{
							text: "Back",
							direction: "back",
						}}
					/>

					<div className="mx-2 my-4 sm:mx-4 flex flex-col gap-4 items-start">
						<p className="page-subtitle">
							<strong>EPC No: </strong>
							<span>{epcId}</span>
						</p>

						<div className="flex flex-row gap-4 items-end w-full">
							<Button
								type="button"
								text="Reset"
								onClick={handleReset}
								status="brand"
								fullWidth
							/>

							<Button
								type="button"
								status="brand"
								onClick={() => handleSubmit("SUBMITTED")}
								text={isEditMode ? "Update" : "Save"}
								className="ml-2"
								fullWidth
							/>
						</div>
					</div>
				</div>
			}
		>
			{formBody}
		</PageRowSectionLayout>
	);
}
