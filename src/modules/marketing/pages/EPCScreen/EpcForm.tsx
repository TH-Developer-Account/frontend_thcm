import React from "react";

import Button from "../../../../components/common/Button";
import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../components/ui/PageHeader";
import Section from "../ActivityPlannerView/components/Section";

import { useMasterData } from "../../../../hooks/useMasterData";
import { useEpcForm } from "./useEPCForm";
import EpcFormFields from "./components/EpcFormFields";

import type { EpcFormProps } from "../../types";
import { getStoredEpcInfo } from "../../helpers/localstorage";

const EpcForm = ({
	epcId: propEpcId,
	mode = "create",
	variant = "page",
	initialData,
	onSuccess,
	onCancel,
}: EpcFormProps) => {
	const epcInfo = React.useMemo(() => getStoredEpcInfo(), []);
	const storedEpcId = epcInfo?.epcId || "";

	const finalEpcId =
		mode === "create"
			? propEpcId || undefined
			: propEpcId || storedEpcId || undefined;

	const { data: masters } = useMasterData();

	const {
		values,
		errors,
		loading,
		isEditMode,
		handleChange,
		handleSave,
		handleReset,
	} = useEpcForm({
		epcId: finalEpcId,
		mode,
		variant,
		initialData,
		onSuccess,
		onCancel,
	});

	const formFields = (
		<EpcFormFields
			values={values}
			errors={errors}
			masters={masters}
			onChange={handleChange}
		/>
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64 text-gray-500">
				Loading EPC details...
			</div>
		);
	}

	if (variant === "inline") {
		return (
			<Section
				title={
					isEditMode
						? "Edit Activity Planner Details"
						: "Create Activity Planner Details"
				}
				action={
					<div className="flex flex-row gap-2 items-end">
						{onCancel && (
							<Button type="button" text="Cancel" onClick={onCancel} />
						)}

						<Button
							type="button"
							text={isEditMode ? "Update" : "Create EPC"}
							onClick={() => handleSave("SUBMITTED")}
						/>
					</div>
				}
			>
				{formFields}
			</Section>
		);
	}

	return (
		<PageRowSectionLayout
			header_children={
				<div className="flex flex-col sm:flex-row sm:justify-between items-end sm:items-center">
					<PageHeader
						headerText={
							isEditMode
								? "Update Event Planning Calendar"
								: "Event Planning Calendar"
						}
						subtitleText="Manage your Event Planning Calendar (EPC) details here"
						badgeProps={{
							text: "Back",
							direction: "back",
						}}
					/>

					<div className="mx-2 my-4 sm:mx-4 flex flex-row gap-2 items-end">
						<Button
							type="button"
							text="Reset"
							onClick={handleReset}
							status="brand"
						/>

						<Button
							type="button"
							onClick={() => handleSave("SUBMITTED")}
							text={isEditMode ? "Update" : "Submit"}
							status="brand"
						/>
					</div>
				</div>
			}
		>
			{formFields}
		</PageRowSectionLayout>
	);
};

export default EpcForm;
