import React from "react";
import { useNavigate } from "react-router-dom";

import type { GroupedOption, LineItemOption, Product } from "../../../types";

import {
	groupProductsByCategory,
	mapCrfLineItemsToFormItems,
} from "./crf.mapper";

import { buildCrfPayload } from "./crf.payload";

import {
	clearStoredEpcInfo,
	getStoredEpcInfo,
} from "../../../helpers/localstorage";

import { useToast } from "../../../../../context/Auth/AuthContext";

import { crfApi } from "../../api/crf.api";
import { useCreateCrfMutation } from "../../queries/useCreateCrfMutation";
import { useUpdateCrfMutation } from "../../queries/useUpdateCrfMutation";

export type CrfFormMode = "create" | "edit";
export type CrfFormVariant = "page" | "inline";

export type CrfFormProps = {
	mode?: CrfFormMode;
	variant?: CrfFormVariant;
	epcId?: string | null;
	crfId?: string | null;
	initialData?: any;
	initialOptions?: GroupedOption[];
	onSuccess?: (data?: any) => void | Promise<void>;
	onCancel?: () => void;
};

type UseCrfFormResult = {
	costItems: LineItemOption[];
	setCostItems: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
	options: GroupedOption[];
	loading: boolean;
	epcId: string | null;
	crfId: string | null;
	isEditMode: boolean;
	handleSubmit: () => Promise<void>;
	handleReset: () => void;
};

export function useCrfForm({
	mode = "create",
	variant = "page",
	epcId: propEpcId,
	crfId: propCrfId,
	initialData,
	initialOptions,
	onSuccess,
}: CrfFormProps): UseCrfFormResult {
	const { showToast } = useToast();
	const navigate = useNavigate();

	const createCrfMutation = useCreateCrfMutation();
	const updateCrfMutation = useUpdateCrfMutation();

	const storedInfo = React.useMemo(() => getStoredEpcInfo(), []);

	const epcId: string | null = propEpcId ?? storedInfo?.epcId ?? null;
	const crfId: string | null = propCrfId ?? storedInfo?.crfId ?? null;

	const isEditMode = mode === "edit" || Boolean(crfId);

	const [costItems, setCostItems] = React.useState<LineItemOption[]>(() => {
		if (!initialData?.lineItems?.length) return [];
		return mapCrfLineItemsToFormItems(initialData.lineItems);
	});

	const [options, setOptions] = React.useState<GroupedOption[]>(
		initialOptions ?? [],
	);

	const shouldFetchCrfDetails =
		variant === "page" && Boolean(crfId && !initialData);

	const shouldFetchProducts = !initialOptions?.length;

	const [productsLoading, setProductsLoading] =
		React.useState(shouldFetchProducts);

	const [detailsLoading, setDetailsLoading] = React.useState(
		shouldFetchCrfDetails,
	);

	const mutationLoading =
		createCrfMutation.isPending || updateCrfMutation.isPending;

	const loading = productsLoading || detailsLoading || mutationLoading;

	const fetchProducts = React.useCallback(async () => {
		if (!shouldFetchProducts) {
			setProductsLoading(false);
			return;
		}

		try {
			setProductsLoading(true);

			const products = await crfApi.getProducts();

			setOptions(groupProductsByCategory((products ?? []) as Product[]));
		} catch (err) {
			console.error("Failed to fetch CRF products:", err);

			showToast({
				type: "error",
				title: "Error",
				description: "Failed to load CRF product data.",
			});
		} finally {
			setProductsLoading(false);
		}
	}, [shouldFetchProducts, showToast]);

	const fetchCrfDetails = React.useCallback(async () => {
		if (!shouldFetchCrfDetails || !crfId) {
			setDetailsLoading(false);
			return;
		}

		try {
			setDetailsLoading(true);

			const crfData = await crfApi.getById(crfId);

			setCostItems(mapCrfLineItemsToFormItems(crfData?.lineItems ?? []));
		} catch (err) {
			console.error("Failed to fetch CRF details:", err);

			showToast({
				type: "error",
				title: "Error",
				description: "Failed to load CRF details.",
			});
		} finally {
			setDetailsLoading(false);
		}
	}, [crfId, shouldFetchCrfDetails, showToast]);

	React.useEffect(() => {
		void fetchProducts();
	}, [fetchProducts]);

	React.useEffect(() => {
		void fetchCrfDetails();
	}, [fetchCrfDetails]);

	React.useEffect(() => {
		if (!initialData?.lineItems?.length) return;

		setCostItems(mapCrfLineItemsToFormItems(initialData.lineItems));
		setDetailsLoading(false);
	}, [initialData]);

	const handleSubmit = React.useCallback(async () => {
		try {
			if (!epcId) {
				showToast({
					type: "error",
					title: "Error",
					description: "EPC ID not found.",
				});
				return;
			}

			const payload = buildCrfPayload(costItems, epcId);

			let savedData: any;

			if (crfId) {
				savedData = await updateCrfMutation.mutateAsync({
					epcId,
					crfId,
					payload,
				});

				showToast({
					type: "success",
					title: "Success",
					description: "CRF modified successfully",
				});
			} else {
				savedData = await createCrfMutation.mutateAsync({
					epcId,
					payload,
				});

				showToast({
					type: "success",
					title: "Success",
					description: "CRF created successfully",
				});

				clearStoredEpcInfo();
			}

			if (onSuccess) {
				await onSuccess(savedData);
			} else {
				navigate("/marketing/listing");
			}
		} catch (error: any) {
			console.error("CRF save failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to save CRF.",
			});
		}
	}, [
		costItems,
		createCrfMutation,
		crfId,
		epcId,
		navigate,
		onSuccess,
		showToast,
		updateCrfMutation,
	]);

	const handleReset = React.useCallback(() => {
		if (initialData?.lineItems?.length) {
			setCostItems(mapCrfLineItemsToFormItems(initialData.lineItems));
			return;
		}

		setCostItems([]);
	}, [initialData]);

	return {
		costItems,
		setCostItems,
		options,
		loading,
		epcId,
		crfId,
		isEditMode,
		handleSubmit,
		handleReset,
	};
}
