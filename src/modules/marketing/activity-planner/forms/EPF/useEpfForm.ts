import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../context/Auth/useAuth";
import { useToast } from "../../../../../context/Auth/AuthContext";

import type { LineItemOption } from "../../../types";
import type {
	EpfCrfData,
	EpfDetailResponse,
	EpfFormValues,
	EpfProduct,
	EpfStatus,
} from "../../types/epf.types";

import {
	calculateBudgetShares,
	calculateLineItemsTotal,
	calculateParticipantsTotal,
} from "./epf.calculations";

import {
	getCrfTotalFromData,
	initialEpfValues,
	mapBudgetInfoToFormValues,
	mapEpfLineItemsToFormItems,
	mapEpfProductsToOptions,
	mapEpfResponseToFormValues,
} from "./epf.mapper";

import { buildEpfCreatePayload, buildEpfUpdatePayload } from "./epf.payload";
import { validateEpfForm } from "../../utils/validations";

import {
	clearStoredEpcInfo,
	getStoredAppId,
	getStoredEpcInfo,
} from "../../helpers/localstorage";

import { workflowApi } from "../../api/workflow.api";
import {
	useCreateEpfMutation,
	useUpdateEpfMutation,
	useEpfProductsQuery,
} from "../../queries/useEpfMutation";
import { useEpfBudgetInfoQuery } from "../../queries/useEpfBudgetInfoQuery";

export type EpfFormMode = "create" | "edit";

export type EpfFormProps = {
	mode?: EpfFormMode;
	epcId?: string | null;
	crfId?: string | null;
	epfId?: string | null;
	initialData?: EpfDetailResponse | null;
	crfData?: EpfCrfData;
	budgetMasterId?: string | null;
	onSuccess?: (data?: any) => void | Promise<void>;
	onCancel?: () => void;
	isClarifiedUpdate?: boolean;
};

type UseEpfFormResult = {
	values: EpfFormValues;
	eventCost: number;
	errors: Partial<Record<keyof EpfFormValues, string>>;
	loading: boolean;
	submitting: boolean;
	options: LineItemOption[];
	costItems: LineItemOption[];
	setCostItems: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
	epcId: string | null;
	epfId: string | null;
	isEditMode: boolean;
	handleChange: (name: keyof EpfFormValues, value: string) => void;
	handleReset: () => void;
	handleSubmit: (status: EpfStatus) => Promise<void>;
};

const numericFields = new Set<keyof EpfFormValues>([
	"externalParticipants",
	"internalParticipants",
	"totalParticipants",
	"crfTotal",
	"eventBudget",
	"annualBudget",
	"availableBudget",
	"allotedBudget",
	"dealerPercent",
	"dealerShare",
	"tataHitachiPercent",
	"tataHitachiShare",
	"tataHitachiPoAmount",
]);

const parseFieldValue = (name: keyof EpfFormValues, value: string) => {
	if (!numericFields.has(name)) return value;
	return value === "" ? "" : Number(value);
};

const getBudgetMasterId = ({
	budgetMasterId,
	initialData,
	crfData,
}: {
	budgetMasterId?: string | null;
	initialData?: any;
	crfData?: any;
}) => {
	return (
		budgetMasterId ??
		initialData?.epc?.budget_master_id ??
		initialData?.epc?.budgetMasterId ??
		initialData?.budget_master_id ??
		crfData?.epc?.budget_master_id ??
		null
	);
};

export const useEpfForm = ({
	mode = "create",
	epcId: propEpcId,
	crfId: propCrfId,
	epfId: propEpfId,
	initialData,
	crfData,
	budgetMasterId: propBudgetMasterId,
	onSuccess,
}: EpfFormProps = {}): UseEpfFormResult => {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const { workspaceId } = useAuth();

	const storedInfo = React.useMemo(() => getStoredEpcInfo(), []);
	const appId = React.useMemo(() => getStoredAppId(), []);

	const epcId = propEpcId ?? storedInfo?.epcId ?? null;
	const crfId = propCrfId ?? storedInfo?.crfId ?? null;
	const epfId = propEpfId ?? storedInfo?.epfId ?? null;

	const isEditMode = mode === "edit" || Boolean(epfId);

	const initialCrfTotal = React.useMemo(() => {
		return getCrfTotalFromData(crfData);
	}, [crfData]);

	const [values, setValues] = React.useState<EpfFormValues>(() => {
		if (initialData) {
			return mapEpfResponseToFormValues(initialData, initialCrfTotal);
		}

		return {
			...initialEpfValues,
			crfTotal: initialCrfTotal,
		};
	});

	const [costItems, setCostItems] = React.useState<LineItemOption[]>(() => {
		return mapEpfLineItemsToFormItems(initialData?.lineItems ?? []);
	});

	const [errors, setErrors] = React.useState<
		Partial<Record<keyof EpfFormValues, string>>
	>({});

	const budgetMasterId = getBudgetMasterId({
		budgetMasterId: propBudgetMasterId,
		initialData,
		crfData,
	});

	const productsQuery = useEpfProductsQuery();
	const budgetQuery = useEpfBudgetInfoQuery(budgetMasterId);

	const createEpfMutation = useCreateEpfMutation();
	const updateEpfMutation = useUpdateEpfMutation();

	const options = React.useMemo(() => {
		return mapEpfProductsToOptions((productsQuery.data ?? []) as EpfProduct[]);
	}, [productsQuery.data]);

	React.useEffect(() => {
		if (initialData) {
			setValues(mapEpfResponseToFormValues(initialData, initialCrfTotal));
			setCostItems(mapEpfLineItemsToFormItems(initialData.lineItems ?? []));
			setErrors({});
			return;
		}

		setValues((prev) => ({
			...prev,
			crfTotal: initialCrfTotal,
		}));
	}, [initialData, initialCrfTotal]);

	React.useEffect(() => {
		if (!crfData) return;

		const crfTotal = getCrfTotalFromData(crfData);

		setValues((prev) => ({
			...prev,
			crfTotal,
		}));
	}, [crfData]);

	React.useEffect(() => {
		if (!budgetQuery.data) return;

		setValues((prev) => ({
			...prev,
			...mapBudgetInfoToFormValues(budgetQuery.data),
		}));
	}, [budgetQuery.data]);

	const eventCost = React.useMemo(() => {
		const overheadTotal = calculateLineItemsTotal(costItems);
		return overheadTotal + Number(values.crfTotal || 0);
	}, [costItems, values.crfTotal]);

	const displayValues = React.useMemo<EpfFormValues>(() => {
		const budgetValues = calculateBudgetShares(values, eventCost);

		return {
			...values,
			totalParticipants: calculateParticipantsTotal(
				values.externalParticipants,
				values.internalParticipants,
			),
			...budgetValues,
		};
	}, [eventCost, values]);

	const loading = productsQuery.isLoading || budgetQuery.isLoading;

	const submitting = createEpfMutation.isPending || updateEpfMutation.isPending;

	const handleChange = React.useCallback(
		(name: keyof EpfFormValues, value: string) => {
			setValues((prev) => {
				const parsedValue = parseFieldValue(name, value);

				const updated = {
					...prev,
					[name]: parsedValue,
				};

				if (
					name === "externalParticipants" ||
					name === "internalParticipants"
				) {
					return {
						...updated,
						totalParticipants: calculateParticipantsTotal(
							updated.externalParticipants,
							updated.internalParticipants,
						),
					};
				}

				return updated;
			});

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
		if (initialData) {
			setValues(mapEpfResponseToFormValues(initialData, initialCrfTotal));
			setCostItems(mapEpfLineItemsToFormItems(initialData.lineItems ?? []));
		} else {
			setValues({
				...initialEpfValues,
				crfTotal: initialCrfTotal,
			});
			setCostItems([]);
		}

		setErrors({});
	}, [initialData, initialCrfTotal]);

	const assignWorkflow = React.useCallback(async () => {
		if (!epcId || !workspaceId || !appId) return;

		await workflowApi.assignWorkflow({
			eventProposalId: epcId,
			workspaceId,
			appId,
			budget: eventCost,
		});
	}, [appId, epcId, eventCost, workspaceId]);

	const handleSubmit = React.useCallback(
		async (status: EpfStatus) => {
			try {
				if (!epcId) {
					showToast({
						type: "error",
						title: "Error",
						description: "EPC ID not found.",
					});
					return;
				}

				const validation = validateEpfForm(displayValues);

				if (status === "SUBMITTED" && !validation.isValid) {
					setErrors(validation.errors);

					showToast({
						type: "error",
						title: "Validation Error",
						description: "Please fill all required EPF details.",
					});

					return;
				}

				const payloadArgs = {
					values: displayValues,
					status,
					epcId,
					crfId,
					eventCost,
					costItems,
				};

				const savedData = epfId
					? await updateEpfMutation.mutateAsync({
							epcId,
							epfId,
							payload: buildEpfUpdatePayload(payloadArgs),
						})
					: await createEpfMutation.mutateAsync({
							epcId,
							payload: buildEpfCreatePayload(payloadArgs),
						});

				if (!epfId && status === "SUBMITTED") {
					try {
						await assignWorkflow();
					} catch (workflowError) {
						console.error("Workflow assignment failed:", workflowError);

						showToast({
							type: "error",
							title: "Workflow Error",
							description: "EPF saved, but workflow assignment failed.",
						});
					}
				}

				clearStoredEpcInfo();

				showToast({
					type: "success",
					title: "Success",
					description: epfId
						? "EPF updated successfully."
						: status === "DRAFT"
							? "EPF draft saved successfully."
							: "EPF submitted successfully.",
				});

				if (onSuccess) {
					await onSuccess(savedData);
					return;
				}

				navigate(`/marketing/activity-planner/${epcId}`);
			} catch (error: any) {
				console.error("EPF save failed:", error);

				showToast({
					type: "error",
					title: "Error",
					description:
						error?.response?.data?.message ||
						error?.message ||
						"Failed to save EPF.",
				});
			}
		},
		[
			assignWorkflow,
			costItems,
			createEpfMutation,
			crfId,
			displayValues,
			epcId,
			epfId,
			eventCost,
			navigate,
			onSuccess,
			showToast,
			updateEpfMutation,
		],
	);

	return {
		values: displayValues,
		eventCost,
		errors,
		loading,
		submitting,
		options,
		costItems,
		setCostItems,
		epcId,
		epfId,
		isEditMode,
		handleChange,
		handleReset,
		handleSubmit,
	};
};
