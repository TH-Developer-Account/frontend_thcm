import React from "react";
import { useNavigate } from "react-router-dom";

import { useToast } from "../../../../../context/Auth/AuthContext";

import {
	clearStoredEpcInfo,
	getStoredEpcInfo,
} from "../../helpers/localstorage";

import {
	useCreateEpcMutation,
	useUpdateEpcMutation,
} from "../../queries/useEpcMutation";

import { validateEpcForm, type EpcFormErrors } from "./epc.schema";
import { buildEpcCreatePayload, buildEpcUpdatePayload } from "./epc.payload";
import { mapEpcDetailToFormValues } from "./epc.mapper";
import { buildEpcNoFromValues } from "./epcNumber";

import type {
	EpcCreatePayload,
	EpcDetailResponse,
	EpcFormValues,
} from "../../types/epc.types";

export type EpcFormMode = "create" | "edit";
export type EpcSaveStatus = "DRAFT" | "SUBMITTED";

type MasterOption = {
	value: string;
	label: string;
	code?: string;
	[key: string]: unknown;
};

type EpcMasters = {
	regions?: MasterOption[];
	branches?: MasterOption[];
	departments?: MasterOption[];
	vertical?: MasterOption[];
	eventNames?: MasterOption[];
	budgetMasters?: MasterOption[];
};

export type UseEpcFormProps = {
	mode?: EpcFormMode;
	epcId?: string | null;
	initialData?: EpcDetailResponse | null;
	masters?: EpcMasters;
	onSuccess?: (data?: any) => Promise<void> | void;
};

type UseEpcFormResult = {
	values: EpcFormValues;
	errors: EpcFormErrors;
	loading: boolean;
	isEditMode: boolean;
	handleChange: (name: keyof EpcFormValues, value: string) => void;
	handleSave: (status: EpcSaveStatus) => Promise<void>;
	handleReset: () => void;
};

export const initialEpcValues: EpcFormValues = {
	epfNo: "",
	poDocumentRefNo: "",

	department: "",
	region: "",
	branch: "",
	budget_master_id: "",
	budgetDescription: "",
	vertical: "",

	event_scale: 0,
	event_name: "",
	event_description: "",
	event_from_date: "",
	event_to_date: "",
	location: "",
	locationMeta: {
		pincode: "",
		officeName: "",
		district: "",
		stateName: "",
		latitude: null,
		longitude: null,
	},
	event_objective: "",

	status: "DRAFT",
	proposal_number: "",
};

const toEpcFormValues = (data?: EpcDetailResponse | null): EpcFormValues => ({
	...initialEpcValues,
	...mapEpcDetailToFormValues(data),
});

const shouldRegenerateEpcNo = (
	mode: EpcFormMode,
	name: keyof EpcFormValues,
) => {
	if (mode === "edit") return false;

	return (
		name === "department" ||
		name === "region" ||
		name === "branch" ||
		name === "vertical"
	);
};
const LOCKED_EDIT_FIELDS: readonly (keyof EpcFormValues)[] = [
	"department",
	"region",
	"branch",
	"vertical",
];
export function useEpcForm({
	mode = "create",
	epcId: propEpcId,
	initialData,
	masters,
	onSuccess,
}: UseEpcFormProps = {}): UseEpcFormResult {
	const navigate = useNavigate();
	const { showToast } = useToast();

	const createEpcMutation = useCreateEpcMutation();
	const updateEpcMutation = useUpdateEpcMutation();

	const storedInfo = React.useMemo(() => getStoredEpcInfo(), []);

	const epcId =
		mode === "edit"
			? (propEpcId ?? storedInfo?.epcId ?? null)
			: (propEpcId ?? null);

	const isEditMode = mode === "edit" || Boolean(epcId);

	const initialValues = React.useMemo(() => {
		if (initialData) {
			return toEpcFormValues(initialData);
		}

		return initialEpcValues;
	}, [initialData]);

	const [values, setValues] = React.useState<EpcFormValues>(initialValues);
	const [errors, setErrors] = React.useState<EpcFormErrors>({});

	const loading = createEpcMutation.isPending || updateEpcMutation.isPending;

	const handleChange = React.useCallback(
		(name: keyof EpcFormValues, value: string) => {
			if (isEditMode && LOCKED_EDIT_FIELDS.includes(name)) {
				return;
			}

			setValues((prev) => {
				const nextValues: EpcFormValues = {
					...prev,
					[name]: value,
				};

				if (shouldRegenerateEpcNo(mode, name)) {
					const generatedEpcNo = buildEpcNoFromValues(nextValues, masters);

					nextValues.epfNo = generatedEpcNo;
					nextValues.proposal_number = generatedEpcNo;
				}

				return nextValues;
			});

			setErrors((prev) => {
				if (!prev[name]) return prev;

				return {
					...prev,
					[name]: undefined,
				};
			});
		},
		[isEditMode, mode, masters],
	);

	const handleReset = React.useCallback(() => {
		setValues(initialValues);
		setErrors({});
	}, [initialValues]);

	const handleSave = React.useCallback(
		async (status: EpcSaveStatus) => {
			try {
				const generatedEpcNo =
					values.proposal_number ||
					values.epfNo ||
					buildEpcNoFromValues(values, masters);

				const nextValues: EpcFormValues = {
					...values,
					status,
					proposal_number: generatedEpcNo,
					epfNo: generatedEpcNo,
				};

				const validationErrors = validateEpcForm(nextValues);

				if (Object.keys(validationErrors).length > 0) {
					setErrors(validationErrors);

					showToast({
						type: "error",
						title: "Validation Error",
						description: "Please fill all required EPC fields.",
					});

					return;
				}

				if (!nextValues.proposal_number) {
					showToast({
						type: "error",
						title: "EPC No missing",
						description:
							"Please select Department, Zone, Branch, and Vertical to generate EPC No.",
					});

					return;
				}

				let savedData: any;

				if (isEditMode && epcId) {
					const payload = buildEpcUpdatePayload(nextValues);

					savedData = await updateEpcMutation.mutateAsync({
						epcId,
						payload,
					});

					showToast({
						type: "success",
						title: "Success",
						description: "EPC updated successfully.",
					});
				} else {
					const payload: EpcCreatePayload = buildEpcCreatePayload(nextValues);

					savedData = await createEpcMutation.mutateAsync(payload);

					clearStoredEpcInfo();

					showToast({
						type: "success",
						title: "Success",
						description: "EPC created successfully.",
					});
				}

				if (onSuccess) {
					await onSuccess(savedData);
					return;
				}

				const savedEpcId =
					savedData?.id ??
					savedData?.eventProposal?.id ??
					savedData?.epcId ??
					savedData?.epc?.id ??
					epcId;

				if (savedEpcId) {
					navigate(`/marketing/activity-planner/${savedEpcId}`);
				} else {
					navigate("/marketing/activity-planner/listing");
				}
			} catch (error: any) {
				console.error("EPC save failed:", error);

				showToast({
					type: "error",
					title: "Error",
					description:
						error?.response?.data?.message ||
						error?.message ||
						"Failed to save EPC.",
				});
			}
		},
		[
			values,
			masters,
			isEditMode,
			epcId,
			updateEpcMutation,
			createEpcMutation,
			showToast,
			onSuccess,
			navigate,
		],
	);

	return {
		values,
		errors,
		loading,
		isEditMode,
		handleChange,
		handleSave,
		handleReset,
	};
}
