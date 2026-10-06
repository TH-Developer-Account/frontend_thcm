// forms/EPC/EpcForm.tsx
// Single entry point for the EPC form in every mode — same pattern as the
// vendor onboarding forms:
//
//   <EpcForm mode="create" onSuccess={...} />
//   <EpcForm mode="edit"   epcId initialData onCancel onSuccess />
//   <EpcForm mode="view"   initialData />          ← replaces ActivityDetailsSection
//
// "view" renders a separate component (EpcFormView) instead of branching
// inside one component, so useEpcForm is never mounted for read-only display
// and switching view ⇄ edit remounts the editor with fresh values.
import React from "react";
import { RefreshCcw, Save, X } from "lucide-react";

import Button from "../../../../../components/common/Button";
import SectionAccordion from "../../../../../components/common/SectionAccordion";

import { useMasterData } from "../../../../../hooks/useMasterData";
import { useEpcForm } from "./useEpcForm";
import EpcFormFields, { type EpcReadOnlyLabels } from "./EpcFormFields";
import { mapEpcDetailToFormValues } from "./epc.mapper";

import { getStoredEpcInfo } from "../../utils/localstorage";
import type { EpcDetailResponse, EpcFormValues } from "../../types/epc.types";

export type EpcFormMode = "create" | "edit" | "view";

export type EpcFormProps = {
	mode?: EpcFormMode;
	epcId?: string | null;
	initialData?: EpcDetailResponse | null;
	onCancel?: () => void;
	onSuccess?: (data?: any) => Promise<void> | void;
};

/* -------------------------------------------------------------------------- */
/*                                  View mode                                 */
/* -------------------------------------------------------------------------- */

/** Labels from the detail response relations — used if a master option is missing. */
const getReadOnlyLabels = (epc: EpcDetailResponse): EpcReadOnlyLabels => ({
	region: epc.region?.region_name || epc.region?.title,
	branch:
		epc.branch?.branch_name || epc.branch?.title || epc.branch?.description,
	department: epc.department?.department_name || epc.department?.title,
	vertical: epc.vertical?.name || epc.vertical?.title || epc.vertical?.code,
	eventName: epc.event_name?.title,
	budgetCode: epc.budget_master?.code || epc.budget_master?.value,
	budgetDescription: epc.budget_master?.description,
});

type EpcFormViewProps = {
	initialData?: EpcDetailResponse | null;
};

const EpcFormView = ({ initialData }: EpcFormViewProps) => {
	const { data: masters } = useMasterData();

	const values = React.useMemo(
		() => mapEpcDetailToFormValues(initialData) as EpcFormValues,
		[initialData],
	);

	const readOnlyLabels = React.useMemo(
		() => (initialData ? getReadOnlyLabels(initialData) : undefined),
		[initialData],
	);

	if (!initialData) {
		return <p className="epf-empty-message">EPC details are not available.</p>;
	}

	return (
		<EpcFormFields
			mode="view"
			values={values}
			masters={masters}
			readOnlyLabels={readOnlyLabels}
		/>
	);
};

/* -------------------------------------------------------------------------- */
/*                              Create / edit mode                            */
/* -------------------------------------------------------------------------- */

type EpcFormEditorProps = Omit<EpcFormProps, "mode"> & {
	mode: "create" | "edit";
};

const EpcFormEditor = ({
	epcId: propEpcId,
	mode,
	initialData,
	onSuccess,
	onCancel,
}: EpcFormEditorProps) => {
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
				mode="edit"
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

/* -------------------------------------------------------------------------- */
/*                                   Entry                                    */
/* -------------------------------------------------------------------------- */

const EpcForm = ({ mode = "create", ...props }: EpcFormProps) =>
	mode === "view" ? (
		<EpcFormView initialData={props.initialData} />
	) : (
		<EpcFormEditor mode={mode} {...props} />
	);

export default EpcForm;
