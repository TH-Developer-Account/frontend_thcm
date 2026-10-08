// forms/EPF/useEpfForm.ts
// EPF form controller.
//
// CHANGED (Review & Submit):
//   • Saving the EPF no longer starts the approval workflow, and the
//     "Display Approval Flow" preview is gone from here.
//   • Both now live in the Review & Submit step (forms/Review/EpcReviewSubmit):
//     the preview loads when the user lands there, and "Final Submit" is the
//     only thing that calls workflowApi.assignWorkflow.
//   • Validation on save is unchanged (required fields + ₹25k quotation rule),
//     so whatever reaches Review is already complete.
import React from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../../../context/Auth/AuthContext";

import type { LineItemOption } from "../../types/epc.types";
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
	getOverheadItemsMissingQuotation,
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
import { validateEpfForm } from "../../utils/formatters";

import { clearStoredEpcInfo, getStoredEpcInfo } from "../../utils/localstorage";

import {
	useCreateEpfMutation,
	useEpfBudgetInfoQuery,
	useEpfProductsQuery,
	useUpdateEpfMutation,
} from "../../queries/epf.queries";

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

	const storedInfo = React.useMemo(() => getStoredEpcInfo(), []);

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

	/** Event cost = overheads + CRF total. Saved as the EPF's event budget. */
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

	const handleSubmit = React.useCallback(
		async (status: EpfStatus) => {
			if (submitting) return;

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

				if (status === "SUBMITTED") {
					const overheadItemsMissingQuotation =
						getOverheadItemsMissingQuotation(costItems);

					if (overheadItemsMissingQuotation.length > 0) {
						showToast({
							type: "error",
							title: "Quotation Required",
							description:
								"Upload a quotation for each event cost overhead item above ₹25,000.",
						});
						return;
					}
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

				// NOTE: no workflow assignment here any more — Final Submit on the
				// Review & Submit step starts the approval workflow.

				clearStoredEpcInfo();

				showToast({
					type: "success",
					title: "Success",
					description: epfId
						? "EPF updated successfully."
						: "EPF saved. Review and submit to start the approval workflow.",
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
			submitting,
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
