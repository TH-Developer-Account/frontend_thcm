// crf/CrfForm.tsx

import { LucideSave, RefreshCcw, Save, X } from "lucide-react";

import Button from "../../../components/common/Button";
import CrfCatalog from "./crf.catalog";
import { useCrfForm, type CrfFormProps } from "./useCrfForm";

export default function CrfForm(props: CrfFormProps) {
	const { onCancel, submitLabel } = props;

	const {
		costItems,
		setCostItems,
		options,
		errors,
		loading,
		submitting,
		isEditMode,
		handleSubmit,
		handleReset,
	} = useCrfForm(props);

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center text-sm text-gray-500">
				Loading CRF products...
			</div>
		);
	}

	return (
		<>
			<CrfCatalog
				options={options}
				items={costItems}
				onChange={setCostItems}
				errors={errors}
				readOnly={submitting}
			/>

			<div className="flex flex-row items-center justify-end gap-2 border-t border-dashed border-zinc-300 px-4 pt-4">
				{onCancel && (
					<Button
						type="button"
						onClick={onCancel}
						text="Cancel"
						size="sm"
						Icon={X}
						appearance="standard"
						variant="outline"
						disabled={submitting}
					/>
				)}

				<Button
					type="button"
					onClick={handleReset}
					size="sm"
					text="Reset"
					Icon={RefreshCcw}
					appearance="standard"
					variant="outline"
					disabled={submitting}
				/>

				<Button
					type="button"
					onClick={() => void handleSubmit()}
					text={
						submitting
							? "Saving..."
							: (submitLabel ?? (isEditMode ? "Update" : "Save"))
					}
					size="sm"
					Icon={isEditMode ? Save : LucideSave}
					appearance="standard"
					variant="brand"
					disabled={submitting}
				/>
			</div>
		</>
	);
}
