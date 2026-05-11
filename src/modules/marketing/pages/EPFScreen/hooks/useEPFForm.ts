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
} from "../helpers/epfCalculations";

import {
	getCrfTotalFromData,
	initialEpfValues,
	mapEpfLineItemsToFormItems,
	mapEpfResponseToFormValues,
	mapProductToEpfOption,
} from "../helpers/epfMappers";

import {
	buildEpfCreatePayload,
	buildEpfUpdatePayload,
} from "../helpers/epfPayload";
import {
	clearStoredEpcInfo,
	getStoredAppId,
	getStoredEpcInfo,
} from "../../../helpers/localstorage";

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
	onSuccess?: () => void | Promise<void>;
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

	const storedInfo = React.useMemo(() => getStoredEpcInfo(), []);
	const appId = React.useMemo(() => getStoredAppId(), []);

	const epcId = propEpcId ?? storedInfo?.epcId ?? null;
	const crfId = propCrfId ?? storedInfo?.crfId ?? null;
	const epfId = propEpfId ?? storedInfo?.epfId ?? null;

	const isEditMode = mode === "edit" || Boolean(epfId);

	const initialCrfTotal = React.useMemo(() => {
		if (crfData) return getCrfTotalFromData(crfData);
		return 0;
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

	const loading = productsLoading || epfLoading || crfLoading;

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

	const fetchProductsAndBudget = React.useCallback(async () => {
		try {
			const [productsRes, budgetInfo] = await Promise.allSettled([
				ServerAxios.get(`/master-data/products?productType=EPF`),
				ServerAxios.get(`/master-data/budget`),
			]);

			if (budgetInfo.status === "fulfilled" && budgetInfo.value) {
				const budgetInformation = budgetInfo.value.data.d.results[0];

				setValues((prev) => ({
					...prev,
					availableBudget: Number(budgetInformation.Available),
					annualBudget: Number(budgetInformation.Budget),
					allotedBudget: Number(budgetInformation.Allocated),
				}));
			}

			if (productsRes.status === "fulfilled" && productsRes.value) {
				const products = productsRes.value.data.data as Product[];
				setOptions(products.map(mapProductToEpfOption));
			}
		} catch (err) {
			console.error("Product search failed:", err);

			showToast({
				type: "error",
				title: "Error",
				description: "Failed to load EPF products.",
			});
		} finally {
			setProductsLoading(false);
		}
	}, [showToast]);

	const fetchCrfTotal = React.useCallback(async () => {
		if (!crfId || crfData) return;
		try {
			const crfRes = await ServerAxios.get(`/crf/${crfId}`);
			const totalCrfAmount = getCrfTotalFromData(crfRes?.data);

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
		if (!epfId || initialData) return;

		try {
			const epfRes = await ServerAxios.get(`/epf/${epfId}`);
			const epfData = epfRes?.data;

			const lineItems = mapEpfLineItemsToFormItems(epfData.lineItems ?? []);

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
		fetchProductsAndBudget();
	}, [fetchProductsAndBudget]);

	React.useEffect(() => {
		fetchCrfTotal();
	}, [fetchCrfTotal]);

	React.useEffect(() => {
		fetchEpf();
	}, [fetchEpf]);

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
			return ServerAxios.post("/soa/assign-workflow", {
				eventProposalId: epcId,
				workspaceId,
				appId,
				budget: eventCost,
			});
		} catch (error) {
			console.log("error while assigning workflow", error);

			showToast({
				type: "error",
				title: "Workflow Error",
				description: "Saved but workflow assignment failed",
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

				if (epfId) {
					const {
						data: { message },
					} = await ServerAxios.put(`/epf/${epfId}`, payload);

					showToast({
						type: "success",
						title: "Success",
						description: message || "EPF modified successfully",
					});
				} else {
					const {
						data: { message },
					} = await ServerAxios.post("/epf", payload);

					if (status === "SUBMITTED") {
						await assignWorkflow();
					}

					showToast({
						type: "success",
						title: "Success",
						description: message || "EPF created successfully",
					});
				}

				clearStoredEpcInfo();

				if (onSuccess) {
					await onSuccess();
				} else {
					navigate("/marketing/listing");
				}
			} catch (error) {
				console.error("EPF save failed:", error);

				showToast({
					type: "error",
					title: "Error",
					description: "Failed to save EPF.",
				});
			}
		},
		[
			assignWorkflow,
			costItems,
			epcId,
			epfId,
			eventCost,
			navigate,
			onSuccess,
			showToast,
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
