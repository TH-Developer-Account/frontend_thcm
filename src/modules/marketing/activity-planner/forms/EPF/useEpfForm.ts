import React from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../../../context/Auth/useAuth";
import { useToast } from "../../../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../../../services/ServerAxios";

import type {
	EpfFormValues,
	LineItem,
	LineItemOption,
	Product,
} from "../../../types";

import {
	calculateBudgetShares,
	getTotalLineItemAmount,
} from "./epf.calculations";

import {
	getCrfTotalFromData,
	initialEpfValues,
	mapEpfLineItemsToFormItems,
	mapEpfResponseToFormValues,
	mapProductToEpfOption,
} from "./epf.mapper";

import { buildEpfCreatePayload, buildEpfUpdatePayload } from "./epf.payload";

import {
	clearStoredEpcInfo,
	getStoredAppId,
	getStoredEpcInfo,
} from "../../../helpers/localstorage";

import { crfApi } from "../../api/crf.api";
import { epfApi } from "../../api/epf.api";
import { useCreateEpfMutation } from "../../queries/useCreateEpfMutation";
import { useUpdateEpfMutation } from "../../queries/useUpdateEpfMutation";

export type EpfFormMode = "create" | "edit";
export type EpfFormVariant = "page" | "inline";

export type EpfFormProps = {
	mode?: EpfFormMode;
	variant?: EpfFormVariant;
	epcId?: string | null;
	crfId?: string | null;
	epfId?: string | null;
	initialData?: any;
	crfData?: any;
	onSuccess?: (data?: any) => void | Promise<void>;
	onCancel?: () => void;
};

const numberFields: (keyof EpfFormValues)[] = [
	"externalParticipants",
	"internalParticipants",
	"totalParticipants",
	"crfTotal",
	"eventBudget",
	"annualBudget",
	"availableBudget",
	"dealerPercent",
	"dealerShare",
	"tataHitachiPercent",
	"tataHitachiShare",
	"tataHitachiPoAmount",
];

const parseValue = (name: keyof EpfFormValues, value: string) => {
	if (numberFields.includes(name)) {
		return value === "" ? "" : Number(value);
	}

	return value;
};

type UseEpfFormResult = {
	values: EpfFormValues;
	eventCost: number;
	draft: LineItem;
	errors: Partial<Record<keyof EpfFormValues, string>>;
	loading: boolean;
	options: LineItemOption[];
	costItems: LineItemOption[];
	setCostItems: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
	setOptions: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
	epcId: string | null;
	epfId: string | null;
	isEditMode: boolean;
	handleChange: (name: keyof EpfFormValues, value: string) => void;
	handleReset: () => void;
	handleSubmit: (status: "DRAFT" | "SUBMITTED") => Promise<void>;
};

export const useEpfForm = ({
	mode = "create",
	epcId: propEpcId,
	crfId: propCrfId,
	epfId: propEpfId,
	initialData,
	crfData,
	onSuccess,
}: EpfFormProps = {}): UseEpfFormResult => {
	const { showToast } = useToast();
	const navigate = useNavigate();
	const { workspaceId } = useAuth();

	const createEpfMutation = useCreateEpfMutation();
	const updateEpfMutation = useUpdateEpfMutation();

	const storedInfo = React.useMemo(() => getStoredEpcInfo(), []);
	const appId = React.useMemo(() => getStoredAppId(), []);

	const epcId = propEpcId ?? storedInfo?.epcId ?? null;
	const crfId = propCrfId ?? storedInfo?.crfId ?? null;
	const epfId = propEpfId ?? storedInfo?.epfId ?? null;

	const isEditMode = mode === "edit" || Boolean(epfId);

	const initialCrfTotal = React.useMemo(() => {
		const sourceCrf = crfData ?? initialData?.crf;

		if (!sourceCrf) return 0;

		return getCrfTotalFromData(sourceCrf);
	}, [crfData, initialData]);

	const [values, setValues] = React.useState<EpfFormValues>(() => {
		if (initialData) {
			return mapEpfResponseToFormValues(initialData, initialCrfTotal);
		}

		return {
			...initialEpfValues,
			crfTotal: initialCrfTotal,
		};
	});

	const [options, setOptions] = React.useState<LineItemOption[]>([]);

	const [costItems, setCostItems] = React.useState<LineItemOption[]>(() => {
		if (!initialData?.lineItems?.length) return [];
		return mapEpfLineItemsToFormItems(initialData.lineItems);
	});

	const [errors, setErrors] = React.useState<
		Partial<Record<keyof EpfFormValues, string>>
	>({});

	const shouldFetchEpf = Boolean(epfId && !initialData);
	const shouldFetchCrfTotal = Boolean(crfId && !crfData);

	const [productsLoading, setProductsLoading] = React.useState(true);
	const [epfLoading, setEpfLoading] = React.useState(shouldFetchEpf);
	const [crfLoading, setCrfLoading] = React.useState(shouldFetchCrfTotal);

	const mutationLoading =
		createEpfMutation.isPending || updateEpfMutation.isPending;

	const loading =
		productsLoading || epfLoading || crfLoading || mutationLoading;

	const [draft, setDraft] = React.useState<LineItem>({
		id: "",
		particular: "",
		description: "",
		rate: 0,
		quantity: 0,
	});

	const eventCost = React.useMemo(() => {
		const overheadTotal = getTotalLineItemAmount(costItems);
		return overheadTotal + Number(values.crfTotal || 0);
	}, [costItems, values.crfTotal]);

	const calculatedBudgetValues = React.useMemo(() => {
		return calculateBudgetShares(values, eventCost);
	}, [values, eventCost]);

	const displayValues: EpfFormValues = React.useMemo(() => {
		return {
			...values,
			...calculatedBudgetValues,
		};
	}, [values, calculatedBudgetValues]);

	const budgetMasterId =
		initialData?.epc?.budget_master_id ??
		initialData?.epc?.budgetMasterId ??
		initialData?.budget_master_id ??
		crfData?.epc?.budget_master_id ??
		storedInfo?.budgetMasterId ??
		null;

	const fetchProductsAndBudget = React.useCallback(async () => {
		try {
			const [productsResult, budgetResult] = await Promise.allSettled([
				epfApi.getProducts(),
				epfApi.getBudgetInfo(budgetMasterId),
			]);

			if (productsResult.status === "fulfilled") {
				const products = productsResult.value ?? [];
				setOptions((products as Product[]).map(mapProductToEpfOption));
			}

			if (budgetResult.status === "fulfilled") {
				const budgetInformation = budgetResult.value;

				if (budgetInformation) {
					setValues((prev) => ({
						...prev,
						availableBudget: Number(
							budgetInformation.Available ??
								budgetInformation.availableBudget ??
								budgetInformation.available_budget ??
								prev.availableBudget ??
								0,
						),
						annualBudget: Number(
							budgetInformation.Budget ??
								budgetInformation.annualBudget ??
								budgetInformation.annual_budget ??
								prev.annualBudget ??
								0,
						),
						allotedBudget: Number(
							budgetInformation.Allocated ??
								budgetInformation.allotedBudget ??
								budgetInformation.allottedBudget ??
								budgetInformation.allocated_budget ??
								prev.allotedBudget ??
								0,
						),
					}));
				}
			}
		} catch (err) {
			console.error("EPF product/budget fetch failed:", err);

			showToast({
				type: "error",
				title: "Error",
				description: "Failed to load EPF products or budget data.",
			});
		} finally {
			setProductsLoading(false);
		}
	}, [budgetMasterId, showToast]);

	const fetchCrfTotal = React.useCallback(async () => {
		if (!crfId || crfData) {
			setCrfLoading(false);
			return;
		}

		try {
			const crfDetails = await crfApi.getById(crfId);
			const totalCrfAmount = getCrfTotalFromData(crfDetails);

			setValues((prev) => ({
				...prev,
				crfTotal: totalCrfAmount,
			}));
		} catch (err) {
			console.error("CRF fetch failed:", err);
		} finally {
			setCrfLoading(false);
		}
	}, [crfId, crfData]);

	const fetchEpf = React.useCallback(async () => {
		if (!epfId || initialData) {
			setEpfLoading(false);
			return;
		}

		try {
			const epfData = await epfApi.getById(epfId);

			const lineItems = mapEpfLineItemsToFormItems(epfData?.lineItems ?? []);

			setCostItems(lineItems);

			setValues((prev) => ({
				...prev,
				...mapEpfResponseToFormValues(epfData, Number(prev.crfTotal || 0)),
			}));
		} catch (err) {
			console.error("EPF fetch failed:", err);

			showToast({
				type: "error",
				title: "Error",
				description: "Failed to load EPF details.",
			});
		} finally {
			setEpfLoading(false);
		}
	}, [epfId, initialData, showToast]);

	React.useEffect(() => {
		void fetchProductsAndBudget();
	}, [fetchProductsAndBudget]);

	React.useEffect(() => {
		void fetchCrfTotal();
	}, [fetchCrfTotal]);

	React.useEffect(() => {
		const sourceCrf = crfData ?? initialData?.crf;

		if (!sourceCrf) return;

		const crfTotal = getCrfTotalFromData(sourceCrf);

		setValues((prev) => ({
			...prev,
			crfTotal,
		}));

		setCrfLoading(false);
	}, [crfData, initialData]);

	React.useEffect(() => {
		void fetchEpf();
	}, [fetchEpf]);

	React.useEffect(() => {
		if (!initialData) return;

		setValues(mapEpfResponseToFormValues(initialData, initialCrfTotal));
		setCostItems(mapEpfLineItemsToFormItems(initialData.lineItems ?? []));
		setEpfLoading(false);
	}, [initialData, initialCrfTotal]);

	const handleChange = React.useCallback(
		(name: keyof EpfFormValues, value: string) => {
			setValues((prev) => {
				const parsedValue = parseValue(name, value);

				const updated = {
					...prev,
					[name]: parsedValue,
				};

				const external = Number(updated.externalParticipants || 0);
				const internal = Number(updated.internalParticipants || 0);

				return {
					...updated,
					externalParticipants: external,
					internalParticipants: internal,
					totalParticipants: external + internal,
				};
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

		setDraft({
			id: "",
			particular: "",
			description: "",
			rate: 0,
			quantity: 0,
		});

		setErrors({});
	}, [initialData, initialCrfTotal]);

	const assignWorkflow = React.useCallback(async () => {
		try {
			if (!epcId || !workspaceId || !appId) return;

			await ServerAxios.post("/soa/assign-workflow", {
				eventProposalId: epcId,
				workspaceId,
				appId,
				budget: eventCost,
			});
		} catch (error) {
			console.error("Error while assigning workflow", error);

			showToast({
				type: "error",
				title: "Workflow Error",
				description: "Saved, but workflow assignment failed.",
			});
		}
	}, [appId, epcId, eventCost, showToast, workspaceId]);

	const handleSubmit = React.useCallback(
		async (status: "DRAFT" | "SUBMITTED") => {
			try {
				if (!epcId) {
					showToast({
						type: "error",
						title: "Error",
						description: "EPC ID not found.",
					});
					return;
				}

				const payload = epfId
					? buildEpfUpdatePayload({
							values,
							status,
							epcId,
							eventCost,
							costItems,
						})
					: buildEpfCreatePayload({
							values,
							status,
							epcId,
							eventCost,
							costItems,
						});

				let savedData: any;

				if (epfId) {
					savedData = await updateEpfMutation.mutateAsync({
						epcId,
						epfId,
						payload,
					});

					showToast({
						type: "success",
						title: "Success",
						description: "EPF modified successfully",
					});
				} else {
					savedData = await createEpfMutation.mutateAsync({
						epcId,
						payload,
					});

					if (status === "SUBMITTED") {
						await assignWorkflow();
					}

					showToast({
						type: "success",
						title: "Success",
						description: "EPF created successfully",
					});
				}

				clearStoredEpcInfo();

				if (onSuccess) {
					await onSuccess(savedData);
				} else {
					navigate("/marketing/listing");
				}
			} catch (error: any) {
				console.error("EPF save failed:", error);

				const message =
					error?.response?.data?.message ||
					error?.message ||
					"Failed to save EPF.";

				showToast({
					type: "error",
					title: "Error",
					description: message,
				});
			}
		},
		[
			assignWorkflow,
			costItems,
			createEpfMutation,
			epcId,
			epfId,
			eventCost,
			navigate,
			onSuccess,
			showToast,
			updateEpfMutation,
			values,
		],
	);

	return {
		values: displayValues,
		eventCost,
		draft,
		errors,
		loading,
		options,
		costItems,
		setCostItems,
		setOptions,
		epcId,
		epfId,
		isEditMode,
		handleChange,
		handleReset,
		handleSubmit,
	};
};
