import React from "react";
import { useNavigate } from "react-router-dom";

import { buildLineItemPayload } from "../../constant";

import type { GroupedOption, LineItemOption, Product } from "../../types";

import {
	groupProductsByCategory,
	mapCrfLineItemsToFormItems,
} from "./helper.mappers";

import {
	clearStoredEpcInfo,
	getStoredEpcInfo,
} from "../../helpers/localstorage";
import { useToast } from "../../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../../services/ServerAxios";

export type CrfFormMode = "create" | "edit";

export type CrfFormProps = {
	mode?: CrfFormMode;
	epcId?: string | null;
	crfId?: string | null;
	initialData?: any;
	onSuccess?: () => void | Promise<void>;
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
	epcId: propEpcId,
	crfId: propCrfId,
	initialData,
	onSuccess,
}: CrfFormProps): UseCrfFormResult {
	const { showToast } = useToast();
	const navigate = useNavigate();

	const storedInfo = React.useMemo(() => getStoredEpcInfo(), []);

	const epcId: string | null = propEpcId ?? storedInfo?.epcId ?? null;
	const crfId: string | null = propCrfId ?? storedInfo?.crfId ?? null;

	const isEditMode = mode === "edit" || Boolean(crfId);

	const [costItems, setCostItems] = React.useState<LineItemOption[]>(() => {
		if (!initialData?.lineItems?.length) return [];

		return mapCrfLineItemsToFormItems(initialData.lineItems);
	});

	const [options, setOptions] = React.useState<GroupedOption[]>([]);
	const [loading, setLoading] = React.useState(false);

	const fetchProducts = React.useCallback(async () => {
		try {
			setLoading(true);

			const productsRes = await ServerAxios.get(
				`/master-data/products?productType=CRF`,
			);

			const products = productsRes.data.data as Product[];
			const groupedOptions = groupProductsByCategory(products);

			setOptions(groupedOptions);
		} catch (err) {
			console.error("Failed to fetch CRF products:", err);

			showToast({
				type: "error",
				title: "Error",
				description: "Failed to load CRF product data.",
			});
		} finally {
			setLoading(false);
		}
	}, [showToast]);

	const fetchCrfDetails = React.useCallback(async () => {
		if (!crfId) return;
		if (initialData) return;

		try {
			setLoading(true);

			const crfRes = await ServerAxios.get(`/crf/${crfId}`);

			const lineItems = mapCrfLineItemsToFormItems(crfRes.data.lineItems ?? []);

			setCostItems(lineItems);
		} catch (err) {
			console.error("Failed to fetch CRF details:", err);

			showToast({
				type: "error",
				title: "Error",
				description: "Failed to load CRF details.",
			});
		} finally {
			setLoading(false);
		}
	}, [crfId, initialData, showToast]);

	React.useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	React.useEffect(() => {
		fetchCrfDetails();
	}, [fetchCrfDetails]);

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

			const payload = buildLineItemPayload(costItems, { epcId });

			if (crfId) {
				const {
					data: { message },
				} = await ServerAxios.put(`/crf/${crfId}`, payload);

				showToast({
					type: "success",
					title: "Success",
					description: message || "CRF modified successfully",
				});
			} else {
				const {
					data: { message },
				} = await ServerAxios.post("/crf", payload);

				showToast({
					type: "success",
					title: "Success",
					description: message || "CRF created successfully",
				});

				clearStoredEpcInfo();
			}

			if (onSuccess) {
				await onSuccess();
			} else {
				navigate("/marketing/listing");
			}
		} catch (error) {
			console.error("CRF save failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description: "Failed to save CRF.",
			});
		}
	}, [costItems, crfId, epcId, navigate, onSuccess, showToast]);

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
