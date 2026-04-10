import { useState, useEffect } from "react";
import { useToast } from "../../../../context/Auth/AuthContext";
import type { EpfFormValues, LineItem, UseEpcFormProps } from "../../types";
import { ServerAxios } from "../../../../services/ServerAxios";

const initialValues: EpfFormValues = {
	externalParticipants: "",
	internalParticipants: "",
	totalParticipants: "",
	crfTotal: "",

	eventBudget: "",
	annualBudget: "",
	availableBudget: "",

	dealerName: "",
	dealerPercent: "",
	dealerShare: "",

	tataHitachiPercent: "",
	tataHitachiShare: "",
	tataHitachiPoAmount: "",

	proposedBy: "",
	checkedBy: "",
	approvedBy: "",

	reportValidatedBy: "",

	proposedByStatus: "",
	checkedByStatus: "",
	approvedByStatus: "",
	reportValidatedByStatus: "",

	overheads: [], // ✅ SINGLE SOURCE
};

export const useEpfForm = ({ epcId }: UseEpcFormProps) => {
	const { showToast } = useToast();

	const [values, setValues] = useState<EpfFormValues>(initialValues);
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

	const isEditMode = Boolean(epcId);

	// =============================
	// FIELD CHANGE
	// =============================
	const handleChange = (name: keyof EpfFormValues, value: string) => {
		setValues((prev) => {
			const updated = { ...prev, [name]: value };

			// ✅ Participants auto total
			const external = Number(updated.externalParticipants) || 0;
			const internal = Number(updated.internalParticipants) || 0;
			updated.totalParticipants = String(external + internal);

			// ✅ Budget calculations
			const budget = Number(updated.eventBudget) || 0;
			const dealerPercent = Number(updated.dealerPercent) || 0;
			const tataPercent = Number(updated.tataHitachiPercent) || 0;

			if (budget > 0) {
				updated.dealerShare = ((budget * dealerPercent) / 100).toFixed(2);

				updated.tataHitachiShare = ((budget * tataPercent) / 100).toFixed(2);
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

	// =============================
	// TABLE LOGIC
	// =============================
	const handleDraftChange = (name: keyof LineItem, value: string | number) => {
		setDraft((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleAdd = () => {
		if (!draft.particular) return;

		setValues((prev) => ({
			...prev,
			overheads: [
				...prev.overheads,
				{
					...draft,
					id: crypto.randomUUID(),
					qty: draft.quantity,
					total: draft.rate * draft.quantity,
				},
			],
		}));

		setDraft({
			id: "",
			particular: "",
			description: "",
			rate: 0,
			quantity: 0,
		});
	};

	const handleDelete = (id: string) => {
		setValues((prev) => {
			const updated = {
				...prev,
				overheads: prev.overheads.filter((i) => i.id !== id),
			};

			console.log("🗑️ OVERHEAD DELETED:", updated.overheads);
			return updated;
		});
	};

	// =============================
	// SAVE
	// =============================
	const handleSave = async (status: "DRAFT" | "SUBMITTED") => {
		const formData = { ...values, status };

		console.log("🚀 FINAL SUBMIT:", formData);

		try {
			setLoading(true);

			const {
				data: { message },
			} = await ServerAxios.post("/epf", formData);

			showToast({
				type: "success",
				title: "Success",
				description: message,
			});

			setValues(initialValues);
			setErrors({});
		} catch (err) {
			console.error("❌ API ERROR:", err);

			showToast({
				type: "error",
				title: "Error",
				description: "Something went wrong",
			});
		} finally {
			setLoading(false);
		}
	};

	// =============================
	// RESET
	// =============================
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

	// =============================
	// DEBUG WATCH
	// =============================
	useEffect(() => {}, [values]);

	return {
		values,
		draft,
		errors,
		loading,
		isEditMode,

		handleChange,
		handleDraftChange,
		handleAdd,
		handleDelete,

		handleSave,
		handleReset,
	};
};
