import React from "react";
import { useNavigate } from "react-router-dom";
import type {
	GroupedOption,
	LineItemOption,
	Product,
} from "../../types/lineItem.types";

import {
	groupProductsByCategory,
	mapCrfLineItemsToFormItems,
} from "./crf.mapper";

import { buildCrfPayload } from "./crf.payload";

import {
	clearStoredEpcInfo,
	getStoredEpcInfo,
} from "../../helpers/localstorage";

import { useToast } from "../../../../../context/Auth/AuthContext";

import {
	useCreateCrfMutation,
	useUpdateCrfMutation,
	useCrfProductsQuery,
} from "../../queries/useCrfMutation";

export type CrfFormMode = "create" | "edit";

export type CrfFormProps = {
	mode?: CrfFormMode;
	epcId?: string | null;
	crfId?: string | null;
	initialData?: any;
	initialOptions?: GroupedOption[];
	onSuccess?: (data?: any) => void | Promise<void>;
	onCancel?: () => void;
	isClarifiedUpdate?: boolean;
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

const toInitialCostItems = (initialData?: any): LineItemOption[] => {
	if (!initialData?.lineItems?.length) return [];

	return mapCrfLineItemsToFormItems(initialData.lineItems);
};

export function useCrfForm({
	mode = "create",
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

	const initialCostItems = React.useMemo(
		() => toInitialCostItems(initialData),
		[initialData],
	);

	const [costItems, setCostItems] =
		React.useState<LineItemOption[]>(initialCostItems);

	const shouldFetchProducts = !initialOptions?.length;

	const {
		data: productData,
		isLoading: productsLoading,
		isError: productsError,
	} = useCrfProductsQuery(shouldFetchProducts);

	const options = React.useMemo(() => {
		if (initialOptions?.length) return initialOptions;

		return groupProductsByCategory((productData ?? []) as Product[]);
	}, [initialOptions, productData]);

	const mutationLoading =
		createCrfMutation.isPending || updateCrfMutation.isPending;

	const loading = productsLoading || mutationLoading;

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

			if (productsError) {
				showToast({
					type: "error",
					title: "Error",
					description:
						"CRF products failed to load. Please refresh and try again.",
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
					description: "CRF modified successfully.",
				});
			} else {
				savedData = await createCrfMutation.mutateAsync({
					epcId,
					payload,
				});

				showToast({
					type: "success",
					title: "Success",
					description: "CRF created successfully.",
				});

				clearStoredEpcInfo();
			}

			if (onSuccess) {
				await onSuccess(savedData);
				return;
			}

			navigate("/marketing/listing");
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
		productsError,
		showToast,
		updateCrfMutation,
	]);

	const handleReset = React.useCallback(() => {
		setCostItems(initialCostItems);
	}, [initialCostItems]);

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
