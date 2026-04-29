import { useState } from "react";
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

export const useEpcForm = ({ epcId }: EpcFormProps) => {
	const { showToast } = useToast();
	const navigate = useNavigate();

	// ✅ FIX: your hook returns data, so alias it as masters
	const { data: masters } = useMasterData();

	const [values, setValues] = useState<EpcFormValues>(initialValues);
	const [errors, setErrors] = useState<
		Partial<Record<keyof EpcFormValues, string>>
	>({});
	const [loading, setLoading] = useState(false);

	const isEditMode = Boolean(epcId);

	const getOptionCode = (options: Option[] = [], value?: string) => {
		return options.find((opt) => opt.value === value)?.code || "";
	};

	const handleChange = (name: keyof EpcFormValues, value: string) => {
		setValues((prev) => {
			const updated = {
				...prev,
				[name]: value,
			};

			if (name === "region") {
				updated.branch = "";
			}

			const departmentCode = getOptionCode(
				masters?.departments,
				updated.department,
			);

			const branchCode = getOptionCode(masters?.branches, updated.branch);

			const regionCode = getOptionCode(masters?.regions, updated.region);

			const verticalCode = getOptionCode(masters?.vertical, updated.vertical);

			if (departmentCode && branchCode && regionCode && verticalCode) {
				updated.epfNo = generateEpfNo(
					departmentCode,
					branchCode,
					regionCode,
					verticalCode,
				);
			} else {
				updated.epfNo = "";
			}

			if (name === "budget_master_id") {
				updated.budgetDescription = "";
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
		const formData = {
			...values,
			proposal_number: values.epfNo,
		};
		if (!values.epfNo) {
			showToast({
				type: "error",
				title: "Error",
				description: "EPF number not generated yet",
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

			const {
				data: { message },
			} = await ServerAxios.post("/epc", formData);

			showToast({
				type: "success",
				title: "Success",
				description: message || "Created EPC Successfully",
			});

			setValues(initialValues);
			setErrors({});
			navigate(`/marketing/listing`);
		} catch (err: unknown) {
			if (err instanceof Error) {
				console.error(err.message);
			} else {
				console.error("An unexpected error occurred", err);
			}
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
