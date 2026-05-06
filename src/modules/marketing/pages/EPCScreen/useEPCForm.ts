import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateEpcForm } from "./validation";
import { useToast } from "../../../../context/Auth/AuthContext";
import type { EpcFormValues, EpcFormProps, Option } from "../../types";
import { ServerAxios } from "../../../../services/ServerAxios";
import { useMasterData } from "../../../../hooks/useMasterData";

const initialValues: EpcFormValues = {
	epfNo: "",
	poDocumentRefNo: "",
	proposal_number: "",
	department: "",
	region: "",
	branch: "",
	budget_master_id: "",
	budgetDescription: "",
	vertical: "",
	event_scale: "",
	event_name: "",
	event_description: "",
	event_from_date: "",
	event_to_date: "",
	location: "",
	event_objective: "",
	status: "DRAFT",
};

const getNestedId = (data: any, nestedKey: string, fallbackKey: string) => {
	return data?.[nestedKey]?.id || data?.[fallbackKey] || "";
};

const getNestedDescription = (
	data: any,
	nestedKey: string,
	fallbackKey: string,
) => {
	return data?.[nestedKey]?.description || data?.[fallbackKey] || "";
};

const formatDateOnly = (date?: string | null) => {
	if (!date) return "";
	return String(date).split("T")[0];
};

export const useEpcForm = ({ epcId }: EpcFormProps) => {
	const { showToast } = useToast();
	const navigate = useNavigate();

	const { data: masters } = useMasterData();

	const [values, setValues] = useState<EpcFormValues>(initialValues);
	const [errors, setErrors] = useState<
		Partial<Record<keyof EpcFormValues, string>>
	>({});
	const [loading, setLoading] = useState(false);

	const isEditMode = Boolean(epcId);

	const getOptionCode = useCallback(
		(options: Option[] = [], value?: string) => {
			return options.find((opt) => opt.value === value)?.code || "";
		},
		[],
	);

	const generateProposalNumber = useCallback(
		(formValues: EpcFormValues) => {
			const departmentCode = getOptionCode(
				masters?.departments || [],
				formValues.department,
			);

			const branchCode = getOptionCode(
				masters?.branches || [],
				formValues.branch,
			);

			const regionCode = getOptionCode(
				masters?.regions || [],
				formValues.region,
			);

			const verticalCode = getOptionCode(
				masters?.vertical || [],
				formValues.vertical,
			);

			if (departmentCode && branchCode && regionCode && verticalCode) {
				return generateEpfNo(
					departmentCode,
					branchCode,
					regionCode,
					verticalCode,
				);
			}

			return "";
		},
		[
			getOptionCode,
			masters?.branches,
			masters?.departments,
			masters?.regions,
			masters?.vertical,
		],
	);

	const mapEpcResponseToForm = useCallback((epc: any): EpcFormValues => {
		return {
			epfNo: epc?.proposal_number || "",
			proposal_number: epc?.proposal_number || "",

			poDocumentRefNo: epc?.poDocumentRefNo || "",

			department: getNestedId(epc, "department", "departmentId"),
			region: getNestedId(epc, "region", "regionId"),
			branch: getNestedId(epc, "branch", "branchId"),

			budget_master_id:
				epc?.budget_master?.id ||
				epc?.budgetMaster?.id ||
				epc?.budget_master_id ||
				epc?.budgetMasterId ||
				"",

			budgetDescription:
				getNestedDescription(epc, "budget_master", "budgetDescription") ||
				epc?.budgetMaster?.description ||
				"",

			vertical: getNestedId(epc, "vertical", "verticalId"),

			event_scale: epc?.event_scale || "",

			event_name:
				epc?.event_name?.id ||
				epc?.eventName?.id ||
				epc?.event_name_id ||
				epc?.eventNameId ||
				"",

			event_description: epc?.event_description || "",
			event_from_date: formatDateOnly(epc?.event_from_date),
			event_to_date: formatDateOnly(epc?.event_to_date),
			location: epc?.location || "",
			event_objective: epc?.event_objective || "",
			status: epc?.status || "DRAFT",
		};
	}, []);

	useEffect(() => {
		let ignore = false;

		const fetchEpcDetails = async () => {
			if (!epcId) {
				setValues(initialValues);
				return;
			}

			try {
				setLoading(true);

				const response = await ServerAxios.get(`/epc/${epcId}`);

				const epcData =
					response.data?.data?.eventProposal ||
					response.data?.data?.epc ||
					response.data?.data ||
					response.data;

				if (ignore) return;

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
				if (!ignore) {
					setLoading(false);
				}
			}
		};

		fetchEpcDetails();

		return () => {
			ignore = true;
		};
	}, [epcId, mapEpcResponseToForm, showToast]);

	const handleChange = (name: keyof EpcFormValues, value: string) => {
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

			/*
				For new EPC create:
				Generate EPC No automatically.

				For edit:
				Keep existing proposal_number unless user changes master fields.
			*/
			const shouldRegenerateNo =
				!isEditMode ||
				name === "department" ||
				name === "vertical" ||
				name === "region" ||
				name === "branch";

			if (shouldRegenerateNo) {
				const proposalNo = generateProposalNumber(updated);

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
	};

	const handleSave = async (status: "SUBMITTED") => {
		const formData: EpcFormValues = {
			...values,
			status,
			proposal_number: values.epfNo,
		};

		if (!formData.proposal_number) {
			showToast({
				type: "error",
				title: "Error",
				description: "EPC number not generated yet",
			});
			return;
		}

		if (status === "SUBMITTED") {
			const validationErrors = validateEpcForm(formData);

			if (Object.keys(validationErrors).length > 0) {
				setErrors(validationErrors);
				return;
			}
		}

		try {
			setLoading(true);

			const response = isEditMode
				? await ServerAxios.put(`/epc/${epcId}`, formData)
				: await ServerAxios.post("/epc", formData);

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

			localStorage.removeItem("epcInfo");
			setValues(initialValues);
			setErrors({});
			navigate("/marketing/listing");
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
	};

	const handleReset = () => {
		setValues(initialValues);
		setErrors({});
	};

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

const generateEpfNo = (
	deptCode: string,
	branchCode: string,
	zoneCode: string,
	verticalCode: string,
) => {
	const now = new Date();

	const yyyy = now.getFullYear();
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	const dd = String(now.getDate()).padStart(2, "0");

	const time = now
		.toLocaleTimeString("en-GB", { hour12: false })
		.replace(/:/g, "");

	return `${deptCode}/${verticalCode}/${zoneCode}/${branchCode}/${yyyy}${mm}${dd}${time}`;
};
