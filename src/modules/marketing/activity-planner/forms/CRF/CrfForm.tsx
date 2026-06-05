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
		<Section title="Collateral Requisition Form">
			<CrfItemsSection
				items={costItems}
				onChange={setCostItems}
				isViewer={false}
				options={options}
			/>

			<div className="pt-4 flex flex-row items-center justify-end gap-2 px-4 border-t border-dashed border-zinc-300">
				{onCancel && (
					<Button
						type="button"
						onClick={onCancel}
						text="Cancel"
						size="sm"
						Icon={X}
						className="text-red-600"
						status="brand"
						iconColor="white"
					/>
				)}

				<Button
					type="button"
					onClick={handleReset}
					size="sm"
					text="Reset"
					Icon={RefreshCcw}
					className="text-red-600"
					status="brand"
					iconColor="white"
				/>

				<Button
					type="button"
					onClick={handleSubmit}
					text={isEditMode ? "Update" : "Save"}
					className="text-red-600"
					size="sm"
					Icon={isEditMode ? Save : LucideSave}
					status="brand"
					iconColor="white"
				/>
			</div>
		</Section>
	);
}
