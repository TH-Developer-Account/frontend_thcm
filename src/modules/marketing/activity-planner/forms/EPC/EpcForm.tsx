import React from "react";
import { Save, X } from "lucide-react";

import Button from "../../../../../components/common/Button";
import PageRowSectionLayout from "../../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../../components/ui/PageHeader";
import Section from "../../components/Section";

import { useMasterData } from "../../../../../hooks/useMasterData";
import { useEpcForm } from "./useEpcForm";
import EpcFormFields from "./EpcFormFields";

import { getStoredEpcInfo } from "../../../helpers/localstorage";
import type { EpcDetailResponse } from "../../types/epc.types";

export type EpcFormProps = {
	mode?: "create" | "edit";
	variant?: "page" | "inline";
	epcId?: string | null;
	initialData?: EpcDetailResponse | null;
	onCancel?: () => void;
	onSuccess?: (data?: any) => Promise<void> | void;
};

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
			<div className="flex h-64 items-center justify-center text-gray-500">
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
					<div className="flex flex-row items-center justify-end gap-2">
						{onCancel && (
							<Button
								type="button"
								text="Cancel"
								onClick={onCancel}
								size="sm"
								Icon={X}
								className="text-red-600"
								iconColor="red"
							/>
						)}

						<Button
							type="button"
							text={isEditMode ? "Update" : "Create EPC"}
							onClick={() => handleSave("SUBMITTED")}
							size="sm"
							className="text-red-600"
							Icon={Save}
							iconColor="red"
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
				<div className="flex flex-col items-end sm:flex-row sm:items-center sm:justify-between">
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

					<div className="mx-2 my-4 flex flex-row items-end gap-2 sm:mx-4">
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
