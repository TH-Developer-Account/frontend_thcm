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
	// eventBudget: 0,
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
	// "eventBudget",
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
		return value === "" ? "" : Number(value); // keep "" for controlled inputs
	}
	return value;
};

const toNumberOrNull = (val: number | string) => {
	if (val === "" || val === null || val === undefined) return null;
	return Number(val);
};

const prepareEpfPayload = (
	values: EpfFormValues,
	status: "DRAFT" | "SUBMITTED",
	epcId: string,
	eventCost: number,
) => {
	return {
		epcId,
		status,

		externalParticipants: toNumberOrNull(values.externalParticipants),
		internalParticipants: toNumberOrNull(values.internalParticipants),
		eventBudget: toNumberOrNull(eventCost),
		annualBudget: toNumberOrNull(values.annualBudget),
		availableBudget: toNumberOrNull(values.availableBudget),
		dealerName: values.dealerName || "",
		dealerPercent: toNumberOrNull(values.dealerPercent),
		dealerShare: toNumberOrNull(values.dealerShare),
		tataHitachiPoAmount: toNumberOrNull(values.tataHitachiPoAmount),
	};
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTotalEventLineitemAmount = (items: LineItemOption[]) => {
	return items.reduce((total, item) => {
		return total + Number(item.rate || 0) * Number(item.quantity || 0);
	}, 0);
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

	// ✅ TABLE STATE (merged here)
	const [draft, setDraft] = useState<LineItem>({
		id: "",
		particular: "",
		description: "",
		rate: 0,
		quantity: 0,
	});

	const eventCost = React.useMemo(() => {
		console.log("called");
		const total = getTotalEventLineitemAmount(costItems);
		return total + Number(values.crfTotal || 0);
	}, [costItems, values.crfTotal]);

	const stored = localStorage.getItem("epcInfo");
	const appId = localStorage.getItem("appId");
	let epcId: string | null = null;
	let crfId: string | null = null;
	if (stored) {
		const parsed = JSON.parse(stored);
		epcId = parsed.epcId || null;
		crfId = parsed.crfId || null;
	}

	React.useEffect(() => {
		const fetchProducts = async () => {
			try {
				const [productsRes, crfRes, budgetInfo] = await Promise.all([
					ServerAxios.get(`/master-data/products?productType=EPF`),
					crfId ? ServerAxios.get(`/crf/${crfId}`) : Promise.resolve(null),
					ServerAxios.get(`/master-data/budget`),
				]);

				const budgetInformation = budgetInfo.data.d.results[0];
				const crfData = crfRes?.data;
				const totalCrfAmount = getTotalEventLineitemAmount(
					crfData?.lineItems || [],
				);
				setValues((prev) => ({
					...prev,
					crfTotal: totalCrfAmount,
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

				console.log("Fetched products for EPF:", data);
			} catch (err) {
				console.error("Product search failed:", err);
			}
		};

		fetchProducts();
	}, []);

	const handleChange = (name: keyof EpfFormValues, value: string) => {
		setValues((prev) => {
			const parsedValue = parseValue(name, value);
			const updated = {
				...prev,
				[name]: parsedValue,
			};

			// ✅ Participants auto total
			const external = Number(updated.externalParticipants);
			const internal = Number(updated.internalParticipants);
			updated.externalParticipants = external;
			updated.internalParticipants = internal;
			updated.totalParticipants = Number(external + internal);

			// ✅ Budget calculations
			const budget = Number(eventCost) || 0;

			const dealerPercent = Math.min(
				100,
				Math.max(0, Number(updated.dealerPercent) || 0),
			);

			// auto-calculate tata percent
			const tataPercent = 100 - dealerPercent;
			updated.tataHitachiPercent = tataPercent;

			if (budget > 0) {
				updated.dealerShare = Number(
					((budget * dealerPercent) / 100).toFixed(2),
				);

				updated.tataHitachiShare = Number(
					((budget * tataPercent) / 100).toFixed(2),
				);
			}

			return updated;
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

			const cleanedData = prepareEpfPayload(values, status, epcId, eventCost);

			const payload = buildLineItemPayload(costItems, cleanedData);

			console.log("FINAL PAYLOAD:", payload);

			const {
				data: { message },
			} = await ServerAxios.post("/epf", payload);

			showToast({
				type: "success",
				title: "Success",
				description: message || "Created EPF Successfully",
			});

			// ✅ 2. Assign workflow ONLY if submitted
			await assignWorkflow();

			localStorage.removeItem("epcInfo");
			navigate("/marketing/listing");
		} catch (error) {
			console.error("CRF creation failed:", error);
		} finally {
			setLoading(false);
		}
	};

	return {
		values,
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
