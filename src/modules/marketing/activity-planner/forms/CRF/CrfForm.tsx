import { LucideSave, RefreshCcw, Save, X } from "lucide-react";

import Button from "../../../../../components/common/Button";
import Section from "../../components/common/Section";

import { CrfItemsSection } from "./CrfItemsSection";
import { useCrfForm, type CrfFormProps } from "./useCrfForm";

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
			<div className="flex h-64 items-center justify-center text-sm text-gray-500">
				Loading CRF details...
			</div>
		);
	}

	return (
		<Section
			title="Collateral Requisition Form"
			action={
				<div className="flex flex-row items-end gap-4">
					{onCancel && (
						<Button
							type="button"
							onClick={onCancel}
							text="Cancel"
							size="sm"
							Icon={X}
							className="text-red-600"
							iconColor="red"
						/>
					)}

					<Button
						type="button"
						onClick={handleReset}
						size="sm"
						text="Reset"
						Icon={RefreshCcw}
						className="text-red-600"
						iconColor="red"
					/>

					<Button
						type="button"
						onClick={handleSubmit}
						text={isEditMode ? "Update" : "Save"}
						className="text-red-600"
						size="sm"
						Icon={isEditMode ? Save : LucideSave}
						iconColor="red"
					/>
				</div>
			}
		>
			<CrfItemsSection
				items={costItems}
				onChange={setCostItems}
				isViewer={false}
				options={options}
			/>
		</Section>
	);
}
