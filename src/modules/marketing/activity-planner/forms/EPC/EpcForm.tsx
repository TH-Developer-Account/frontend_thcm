import React from "react";
import { RefreshCcw, Save, X } from "lucide-react";

import Button from "../../../../../components/common/Button";
import Section from "../../components/Section";

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
	isClarifiedUpdate?: boolean;
};

const EpcForm = ({
	epcId: propEpcId,
	mode = "create",
	initialData,
	onSuccess,
	onCancel,
	isClarifiedUpdate,
}: EpcFormProps) => {
	const epcInfo = React.useMemo(() => getStoredEpcInfo(), []);

	const storedEpcId = epcInfo?.epcId || "";

	const finalEpcId =
		mode === "create"
			? propEpcId || undefined
			: propEpcId || storedEpcId || undefined;

	const { data: masters } = useMasterData();
	const saveStatus = isClarifiedUpdate ? "DRAFT" : "SUBMITTED";
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
		isClarifiedUpdate,
	});
	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center text-gray-500">
				Loading EPC details...
			</div>
		);
	}

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
						text="Reset"
						onClick={handleReset}
						Icon={RefreshCcw}
						className="text-red-600"
						size="sm"
						iconColor="red"
					/>

					<Button
						type="button"
						text={isEditMode ? "Update" : "Create EPC"}
						onClick={() => handleSave(saveStatus)}
						size="sm"
						className="text-red-600"
						Icon={Save}
						iconColor="red"
					/>
				</div>
			}
		>
			<EpcFormFields
				values={values}
				errors={errors}
				masters={masters}
				onChange={handleChange}
			/>
		</Section>
	);
};

export default EpcForm;
