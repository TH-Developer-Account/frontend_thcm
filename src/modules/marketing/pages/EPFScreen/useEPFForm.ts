import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/Auth/useAuth";
import { buildLineItemPayload } from "../../constant";
import { useToast } from "../../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../../services/ServerAxios";
import type {
	EpfFormValues,
	LineItem,
	LineItemOption,
	Product,
} from "../../types";

const initialValues: EpfFormValues = {
	externalParticipants: 0,
	internalParticipants: 0,
	totalParticipants: 0,
	crfTotal: 0,
	eventBudget: 0,
	annualBudget: 0,
	availableBudget: 0,
	allotedBudget: 0,
	dealerName: "",
	dealerPercent: 50,
	dealerShare: 0,
	tataHitachiPercent: 50,
	tataHitachiShare: 0,
	tataHitachiPoAmount: 0,
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

const toNumberOrNull = (val: number | string) => {
	if (val === "" || val === null || val === undefined) return null;
	return Number(val);
};

const getTotalEventLineitemAmount = (items: LineItemOption[]) => {
	return items.reduce((total, item) => {
		return total + Number(item.rate || 0) * Number(item.quantity || 0);
	}, 0);
};

const calculateBudgetShares = (values: EpfFormValues, eventCost: number) => {
	const budget = Number(eventCost) || 0;

	const dealerPercent = Math.min(
		100,
		Math.max(0, Number(values.dealerPercent) || 0),
	);

	const tataHitachiPercent = 100 - dealerPercent;

	return {
		eventBudget: budget,
		dealerPercent,
		tataHitachiPercent,
		dealerShare: Number(((budget * dealerPercent) / 100).toFixed(2)),
		tataHitachiShare: Number(((budget * tataHitachiPercent) / 100).toFixed(2)),
	};
};

const prepareEpfPayload = (
	values: EpfFormValues,
	status: "DRAFT" | "SUBMITTED",
	epcId: string,
	eventCost: number,
) => {
	const budgetValues = calculateBudgetShares(values, eventCost);

	return {
		epcId,
		status,
		externalParticipants: toNumberOrNull(values.externalParticipants),
		internalParticipants: toNumberOrNull(values.internalParticipants),
		eventBudget: toNumberOrNull(budgetValues.eventBudget),
		annualBudget: toNumberOrNull(values.annualBudget),
		availableBudget: toNumberOrNull(values.availableBudget),
		dealerName: values.dealerName || "",
		dealerPercent: toNumberOrNull(budgetValues.dealerPercent),
		dealerShare: toNumberOrNull(budgetValues.dealerShare),
		// tataHitachiPercent: toNumberOrNull(budgetValues.tataHitachiPercent),
		// tataHitachiShare: toNumberOrNull(budgetValues.tataHitachiShare),
		// tataHitachiPoAmount: toNumberOrNull(values.tataHitachiPoAmount),
	};
};

export const useEpfForm = () => {
	const { showToast } = useToast();
	const navigate = useNavigate();
	const { workspaceId } = useAuth();

	const [values, setValues] = useState<EpfFormValues>(initialValues);
	const [options, setOptions] = React.useState<LineItemOption[]>([]);
	const [costItems, setCostItems] = React.useState<LineItemOption[]>([]);
	const [errors, setErrors] = useState<
		Partial<Record<keyof EpfFormValues, string>>
	>({});
	const [loading, setLoading] = useState(false);

	const [draft, setDraft] = useState<LineItem>({
		id: "",
		particular: "",
		description: "",
		rate: 0,
		quantity: 0,
	});

	const stored = localStorage.getItem("epcInfo");
	const appId = localStorage.getItem("appId");

	let epcId: string | null = null;
	let crfId: string | null = null;
	let epfId: string | null = null;

	if (stored) {
		const parsed = JSON.parse(stored);
		epcId = parsed.epcId || null;
		crfId = parsed.crfId || null;
		epfId = parsed.epfId || null;
	}

	const eventCost = React.useMemo(() => {
		const total = getTotalEventLineitemAmount(costItems);
		return total + Number(values.crfTotal || 0);
	}, [costItems, values.crfTotal]);

	const calculatedBudgetValues = React.useMemo(() => {
		return calculateBudgetShares(values, eventCost);
	}, [values.dealerPercent, eventCost]);

	const displayValues: EpfFormValues = React.useMemo(() => {
		return {
			...values,
			...calculatedBudgetValues,
		};
	}, [values, calculatedBudgetValues]);

	React.useEffect(() => {
		const fetchProducts = async () => {
			try {
				setLoading(true);

				const [productsRes, budgetInfo] = await Promise.all([
					ServerAxios.get(`/master-data/products?productType=EPF`),
					ServerAxios.get(`/master-data/budget`),
				]);

				const budgetInformation = budgetInfo.data.d.results[0];

				setValues((prev) => ({
					...prev,
					availableBudget: Number(budgetInformation.Available),
					annualBudget: Number(budgetInformation.Budget),
					allotedBudget: Number(budgetInformation.Allocated),
				}));

				const data = productsRes.data.data;

				setOptions(
					data.map((item: Product) => ({
						partNumber: item.partNumber,
						value: item.id,
						label: item.name,
						particular: item.name,
						description: item.description,
						rate: parseFloat(item.unitRate),
						quantity: 1,
					})),
				);
			} catch (err) {
				console.error("Product search failed:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchProducts();
	}, []);

	React.useEffect(() => {
		const fetchEPF = async () => {
			try {
				setLoading(true);

				const [epfRes, crfRes] = await Promise.all([
					ServerAxios.get(`/epf/${epfId}`),
					crfId ? ServerAxios.get(`/crf/${crfId}`) : Promise.resolve(null),
				]);

				const crfData = crfRes?.data;
				const epfData = epfRes?.data;

				const totalCrfAmount = getTotalEventLineitemAmount(
					crfData?.lineItems || [],
				);

				const lineItems: LineItemOption[] = (epfData.lineItems ?? []).map(
					(item: {
						productId: string;
						productName: string;
						partNumber: string;
						description: string | null;
						rate: number;
						quantity: number;
						category: string;
						product: Product;
					}) => ({
						value: item.product.id,
						label: item.product.name,
						description: item.product.description,
						rate: item.rate,
						quantity: item.quantity,
						partNumber: item.product.partNumber,
						category: item.product.category,
					}),
				);

				setCostItems(lineItems);

				setValues((prev) => ({
					...prev,
					crfTotal: totalCrfAmount,
					externalParticipants: epfData.externalParticipants,
					internalParticipants: epfData.internalParticipants,
					totalParticipants:
						Number(epfData.externalParticipants || 0) +
						Number(epfData.internalParticipants || 0),
					annualBudget: epfData.annualBudget,
					availableBudget: epfData.availableBudget,
					dealerName: epfData.dealerName,
					dealerPercent: epfData.dealerPercent ?? 50,
					tataHitachiPoAmount: epfData.tataHitachiPoAmount,
				}));
			} catch (err) {
				console.error("EPF fetch failed:", err);
			} finally {
				setLoading(false);
			}
		};

		if (epfId) fetchEPF();
	}, [epfId, crfId]);

	const handleChange = (name: keyof EpfFormValues, value: string) => {
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
	};

	const handleReset = () => {
		setValues(initialValues);
		setDraft({
			id: "",
			particular: "",
			description: "",
			rate: 0,
			quantity: 0,
		});
		setErrors({});
	};

	const assignWorkflow = async () => {
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
	};

	const handleSubmit = async (status: "DRAFT" | "SUBMITTED") => {
		try {
			if (!epcId) {
				console.error("EPC ID not found in localStorage");
				return;
			}

			const epfPayload = prepareEpfPayload(values, status, epcId, eventCost);
			const lineItemPayload = buildLineItemPayload(costItems, { epcId });

			const payload = {
				...epfPayload,
				lineItems: lineItemPayload.lineItems,
			};

			console.log("FINAL PAYLOAD:", payload);

			if (epfId) {
				const { epcId: _epcId, ...updatePayload } = payload;
				const {
					data: { message },
				} = await ServerAxios.put(`/epf/${epfId}`, updatePayload);

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

			localStorage.removeItem("epcInfo");
			navigate("/marketing/listing");
		} catch (error) {
			console.error("EPF save failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description: "Failed to save EPF.",
			});
		}
	};

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
		handleChange,
		handleReset,
		handleSubmit,
	};
};
