import React from "react";
import { useNavigate } from "react-router-dom";

import { useToast } from "../../../../../context/Auth/AuthContext";

import {
	clearStoredEpcInfo,
	getStoredEpcInfo,
} from "../../../helpers/localstorage";

import { useEpcDetailQuery } from "../../queries/useEpcDetailQuery";
import { useCreateEpcMutation } from "../../queries/useCreateEpcMutation";
import { useUpdateEpcMutation } from "../../queries/useUpdateEpcMutation";

import { validateEpcForm, type EpcFormErrors } from "./epc.schema";
import { buildEpcCreatePayload, buildEpcUpdatePayload } from "./epc.payload";
import { mapEpcDetailToFormValues } from "./epc.mapper";

import type { EpcDetailResponse, EpcFormValues } from "../../types/epc.types";

export type EpcFormMode = "create" | "edit";
export type EpcFormVariant = "page" | "inline";

export type UseEpcFormProps = {
	mode?: EpcFormMode;
	variant?: EpcFormVariant;
	epcId?: string | null;
	initialData?: EpcDetailResponse | null;
	onSuccess?: (data?: any) => Promise<void> | void;
	onCancel?: () => void;
};

type UseEpcFormResult = {
	values: EpcFormValues;
	errors: EpcFormErrors;
	loading: boolean;
	isEditMode: boolean;
	handleChange: (name: keyof EpcFormValues, value: string) => void;
	handleSave: (status: "DRAFT" | "SUBMITTED") => Promise<void>;
	handleReset: () => void;
};

const generateProposalNumber = () => {
	const timestamp = new Date()
		.toISOString()
		.replace(/[-:.TZ]/g, "")
		.slice(0, 14);

	return `EPC/${timestamp}`;
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
	event_objective: "",

	status: "DRAFT",
	proposal_number: "",
};

export function useEpcForm({
	mode = "create",
	variant = "page",
	epcId: propEpcId,
	initialData,
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

	/**
	 * Important rule:
	 * - Inline Activity Planner edit already receives parent `initialData`
	 * - Page edit can fetch EPC detail only if `initialData` is missing
	 */
	const shouldFetchEpcDetail =
		variant === "page" && Boolean(epcId && !initialData);

	const { data: fetchedEpcData, isLoading: detailLoading } = useEpcDetailQuery(
		shouldFetchEpcDetail ? epcId : null,
	);

	const sourceData = initialData ?? fetchedEpcData ?? null;

	const [values, setValues] = React.useState<EpcFormValues>(() => {
		if (sourceData) {
			return mapEpcDetailToFormValues(sourceData);
		}

		const proposalNumber = generateProposalNumber();

		return {
			...initialEpcValues,
			epfNo: proposalNumber,
			proposal_number: proposalNumber,
		};
	});

	const [errors, setErrors] = React.useState<EpcFormErrors>({});

	React.useEffect(() => {
		if (!sourceData) return;

		setValues(mapEpcDetailToFormValues(sourceData));
		setErrors({});
	}, [sourceData]);

	const loading =
		detailLoading || createEpcMutation.isPending || updateEpcMutation.isPending;

	const handleChange = React.useCallback(
		(name: keyof EpcFormValues, value: string) => {
			setValues((prev) => ({
				...prev,
				[name]: value,
			}));

			if (errors[name]) {
				setErrors((prev) => ({
					...prev,
					[name]: undefined,
				}));
			}
		},
		[errors],
	);

	const handleReset = React.useCallback(() => {
		if (sourceData) {
			setValues(mapEpcDetailToFormValues(sourceData));
			setErrors({});
			return;
		}

		const proposalNumber = generateProposalNumber();

		setValues({
			...initialEpcValues,
			epfNo: proposalNumber,
			proposal_number: proposalNumber,
		});

		setErrors({});
	}, [sourceData]);

	const handleSave = React.useCallback(
		async (status: "DRAFT" | "SUBMITTED") => {
			try {
				const nextValues: EpcFormValues = {
					...values,
					status,
					proposal_number: values.proposal_number || values.epfNo,
					epfNo: values.epfNo || values.proposal_number,
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

				let savedData: any;

				if (isEditMode && epcId) {
					const payload = buildEpcUpdatePayload(nextValues, status);

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
					const payload = buildEpcCreatePayload(nextValues, status);

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

				const savedEpcId = savedData?.id ?? epcId;

				if (savedEpcId) {
					navigate(`/marketing/activity-planner/${savedEpcId}`);
				} else {
					navigate("/marketing/listing");
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
