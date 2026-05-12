import React from "react";
import { useNavigate } from "react-router-dom";

import { validateEpcForm } from "./helpers/validation";
import { useToast } from "../../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../../services/ServerAxios";
import { useMasterData } from "../../../../hooks/useMasterData";
import {
	buildEpcCreatePayload,
	buildEpcUpdatePayload,
} from "./helpers/epcPayload";
import type { EpcFormProps, EpcFormValues } from "../../types";

import {
	initialEpcValues,
	mapEpcResponseToForm,
	normalizeEpcResponse,
} from "./helpers/epcMappers";

import { generateProposalNumber } from "./helpers/epcNumber";
import { clearStoredEpcInfo } from "../../helpers/localstorage";

type UseEpcFormResult = {
	values: EpcFormValues;
	errors: Partial<Record<keyof EpcFormValues, string>>;
	loading: boolean;
	isEditMode: boolean;
	handleChange: (name: keyof EpcFormValues, value: string) => void;
	handleSave: (status: "SUBMITTED") => Promise<void>;
	handleReset: () => void;
};

export const useEpcForm = ({
	epcId,
	initialData,
	onSuccess,
}: EpcFormProps): UseEpcFormResult => {
	const { showToast } = useToast();
	const navigate = useNavigate();
	const { data: masters } = useMasterData();

	const isEditMode = Boolean(epcId);

	const shouldFetchEpc = Boolean(epcId && !initialData);

	const [values, setValues] = React.useState<EpcFormValues>(() => {
		if (!initialData) return initialEpcValues;

		return mapEpcResponseToForm(initialData);
	});

	const [errors, setErrors] = React.useState<
		Partial<Record<keyof EpcFormValues, string>>
	>({});

	const [loading, setLoading] = React.useState(shouldFetchEpc);

	const fetchEpcDetails = React.useCallback(async () => {
		if (!epcId || initialData) return;

		try {
			const response = await ServerAxios.get(`/epc/${epcId}`);
			const epcData = normalizeEpcResponse(response);
			const mappedValues = mapEpcResponseToForm(epcData);

			setValues(mappedValues);
		} catch (err) {
			console.error("Failed to fetch EPC details", err);

			showToast({
				type: "error",
				title: "Error",
				description: "Failed to load EPC details",
			});
		} finally {
			setLoading(false);
		}
	}, [epcId, initialData, showToast]);

	React.useEffect(() => {
		void fetchEpcDetails();
	}, [fetchEpcDetails]);

	const handleChange = React.useCallback(
		(name: keyof EpcFormValues, value: string) => {
			setValues((prev) => {
				const updated: EpcFormValues = {
					...prev,
					[name]: value,
				};

				if (name === "region") {
					updated.branch = "";
				}

				if (name === "department") {
					updated.vertical = "";
				}

				if (name === "budget_master_id") {
					updated.budgetDescription = "";
				}

				const shouldRegenerateNo =
					!isEditMode &&
					(name === "department" ||
						name === "vertical" ||
						name === "region" ||
						name === "branch");

				if (shouldRegenerateNo) {
					const proposalNo = generateProposalNumber(updated, masters);

					updated.epfNo = proposalNo;
					updated.proposal_number = proposalNo;
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
		[errors, isEditMode, masters],
	);

	const handleSave = React.useCallback(
		async (status: "SUBMITTED") => {
			const proposalNumber = values.proposal_number || values.epfNo;

			const formData: EpcFormValues = {
				...values,
				status,
				proposal_number: proposalNumber,
				epfNo: proposalNumber,
			};

			if (!formData.proposal_number) {
				showToast({
					type: "error",
					title: "Error",
					description: "EPC number not generated yet",
				});
				return;
			}

			const validationErrors = validateEpcForm(formData);

			if (Object.keys(validationErrors).length > 0) {
				setErrors(validationErrors);
				return;
			}

			try {
				setLoading(true);

				const payload = isEditMode
					? buildEpcUpdatePayload(formData, status)
					: buildEpcCreatePayload(formData, status);

				const response = isEditMode
					? await ServerAxios.put(`/epc/${epcId}`, payload)
					: await ServerAxios.post("/epc", payload);

				const savedEpc =
					response.data?.data?.eventProposal ??
					response.data?.data?.epc ??
					response.data?.data ??
					response.data;

				const message = response.data?.message;

				showToast({
					type: "success",
					title: "Success",
					description:
						message ||
						(isEditMode
							? "EPC updated successfully"
							: "EPC created successfully"),
				});

				clearStoredEpcInfo();

				if (onSuccess) {
					await onSuccess(savedEpc);
				} else {
					setValues(initialEpcValues);
					setErrors({});
					navigate("/marketing/listing");
				}
			} catch (err: unknown) {
				console.error("Failed to save EPC", err);

				showToast({
					type: "error",
					title: "Error",
					description: isEditMode
						? "Failed to update EPC"
						: "Failed to create EPC",
				});
			} finally {
				setLoading(false);
			}
		},
		[epcId, isEditMode, navigate, onSuccess, showToast, values],
	);

	const handleReset = React.useCallback(() => {
		if (initialData) {
			setValues(mapEpcResponseToForm(initialData));
			setErrors({});
			return;
		}

		setValues(initialEpcValues);
		setErrors({});
	}, [initialData]);

	return {
		values,
		errors,
		loading,
		isEditMode,
		handleChange,
		handleSave,
		handleReset,
	};
};
