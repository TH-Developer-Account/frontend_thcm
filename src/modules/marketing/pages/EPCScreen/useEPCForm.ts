import { useState } from "react";
import { validateEpcForm } from "./validation";
import { useToast } from "../../../../context/Auth/AuthContext";
import type { EpcFormValues, EpcFormProps } from "../../types";
import { ServerAxios } from "../../../../services/ServerAxios";

const initialValues: EpcFormValues = {
	epfNo: "",
	poDocumentRefNo: "",
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
	const [values, setValues] = useState<EpcFormValues>(initialValues);
	const [errors, setErrors] = useState<
		Partial<Record<keyof EpcFormValues, string>>
	>({});
	const [loading, setLoading] = useState(false);

	const isEditMode = Boolean(epcId);

	// Field Change

	const handleChange = (name: keyof EpcFormValues, value: string) => {
		setValues((prev) => {
			const updated = {
				...prev,
				[name]: value,
			};

			console.log({ value });

			// reset branch when zone changes
			if (name === "region") {
				updated.branch = "";
			}

			// generate EPF when dept/branch/zone available
			if (updated.department && updated.branch && updated.region) {
				updated.epfNo = generateEpfNo(
					updated.department,
					updated.branch,
					updated.region,
				);
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

	// Save

	function generate4DigitNumber() {
		return Math.floor(1000 + Math.random() * 9000);
	}

	const handleSave = async (status: "SUBMITTED") => {
		const formData = {
			...values,
			proposal_number: `EPF-${generate4DigitNumber()}`,
		};
		console.log({ formData, status });

		if (status === "SUBMITTED") {
			const validationErrors = validateEpcForm(formData);

			if (Object.keys(validationErrors).length > 0) {
				setErrors(validationErrors);
				return;
			}
			return validationErrors;
		}

		try {
			setLoading(true);
			const {
				data: { message },
			} = await ServerAxios.post("/epc", formData);

			showToast({
				type: "error",
				title: "Error",
				description: message,
			});

			// ✅ RESET FORM
			setValues(initialValues);
			setErrors({});
		} catch (err: unknown) {
			if (err instanceof Error) {
				console.error(err.message); // Safely access .message
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

const generateEpfNo = (dept: string, branch: string, zone: string) => {
	if (!dept || !branch || !zone) return "";

	const deptCode = dept.slice(0, 3).toUpperCase();
	const branchCode = branch.slice(0, 3).toUpperCase();
	const zoneCode = zone.slice(0, 3).toUpperCase();

	const now = new Date();

	const yyyy = now.getFullYear();
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	const dd = String(now.getDate()).padStart(2, "0");
	const time = new Date()
		.toLocaleTimeString("en-GB", { hour12: false })
		.replace(/:/g, "");
	console.log(time); // hh:mm:ss
	// const timestamp = Date.now();

	return `${deptCode}/${branchCode}/${zoneCode}/${yyyy}${mm}${dd}/${time}`;
};
