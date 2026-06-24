import React from "react";
import { RefreshCcw, Save, X } from "lucide-react";

import Button from "../../../../../components/common/Button";
import SectionAccordion from "../../../../../components/common/SectionAccordion";

import { useMasterData } from "../../../../../hooks/useMasterData";
import { useEpcForm } from "./useEpcForm";
import EpcFormFields from "./EpcFormFields";

import { getStoredEpcInfo } from "../../helpers/localstorage";
import type { EpcDetailResponse } from "../../types/epc.types";

export type EpcFormProps = {
	mode?: "create" | "edit";
	epcId?: string | null;
	initialData?: EpcDetailResponse | null;
	onCancel?: () => void;
	onSuccess?: (data?: any) => Promise<void> | void;
};

const EpcForm = ({
	epcId: propEpcId,
	mode = "create",
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
	const saveStatus = "SUBMITTED";

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
		initialData,
		masters,
		onSuccess,
	});

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center text-gray-500">
				Loading EPC details...
			</div>
		);
	}

	return (
		<SectionAccordion
			title={
				isEditMode
					? "Edit Activity Planner Details"
					: "Create Activity Planner Details"
			}
		>
			<EpcFormFields
				values={values}
				errors={errors}
				masters={masters}
				onChange={handleChange}
				lockOrgFields={isEditMode}
			/>

			<div className="mt-4 flex flex-row items-center justify-end gap-2">
				{onCancel && (
					<Button
						type="button"
						text="Cancel"
						onClick={onCancel}
						size="sm"
						Icon={X}
						appearance="standard"
						variant="outline"
					/>
				)}

				{isEditMode && (
					<Button
						type="button"
						text="Reset"
						onClick={handleReset}
						size="sm"
						Icon={RefreshCcw}
						appearance="standard"
						variant="outline"
					/>
				)}

				<Button
					type="button"
					text={isEditMode ? "Update" : "Create EPC"}
					onClick={() => handleSave(saveStatus)}
					size="sm"
					Icon={Save}
					appearance="standard"
					variant="brand"
				/>
			</div>
		</SectionAccordion>
	);
};

export default EpcForm;
