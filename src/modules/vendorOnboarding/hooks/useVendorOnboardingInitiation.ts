import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
// import { ServerAxios } from "../../../services/ServerAxios";

export type VendorOnboardingInitiationPayload = {
	vendorName: string;
	vendorEmail: string;
	vendorPhone: string;
	personName: string;
	personEmail: string;
	personPhone: string;
};

export type VendorOnboardingInitiationErrors = Partial<
	Record<keyof VendorOnboardingInitiationPayload, string>
>;

const initialFormValues: VendorOnboardingInitiationPayload = {
	vendorName: "",
	vendorEmail: "",
	vendorPhone: "",
	personName: "",
	personEmail: "",
	personPhone: "",
};

// const validateVendorInitiationForm = (
// 	values: VendorOnboardingInitiationPayload,
// ): VendorOnboardingInitiationErrors => {
// 	const errors: VendorOnboardingInitiationErrors = {};

// 	if (!values.vendorName.trim()) {
// 		errors.vendorName = "Vendor name is required.";
// 	}

// 	if (!values.vendorEmail.trim()) {
// 		errors.vendorEmail = "Vendor email is required.";
// 	}

// 	if (!values.vendorPhone.trim()) {
// 		errors.vendorPhone = "Vendor phone number is required.";
// 	}

// 	if (values.vendorEmail && !/^\S+@\S+\.\S+$/.test(values.vendorEmail)) {
// 		errors.vendorEmail = "Enter a valid vendor email.";
// 	}

// 	if (values.personEmail && !/^\S+@\S+\.\S+$/.test(values.personEmail)) {
// 		errors.personEmail = "Enter a valid contact person email.";
// 	}

// 	return errors;
// };

const createVendorInitiation = async (
	payload: VendorOnboardingInitiationPayload,
) => {
	console.log("CREATE vendor onboarding initiation:", payload);

	// API ready version:
	// const { data } = await ServerAxios.post("/vendor-onboarding/initiation", payload);
	// return data;

	return {
		success: true,
		message: "Vendor onboarding initiation created.",
		data: payload,
	};
};

const updateVendorInitiation = async (
	payload: VendorOnboardingInitiationPayload & { id: string },
) => {
	console.log("UPDATE vendor onboarding initiation:", payload);

	// API ready version:
	// const { data } = await ServerAxios.put(
	// 	`/vendor-onboarding/initiation/${payload.id}`,
	// 	payload,
	// );
	// return data;

	return {
		success: true,
		message: "Vendor onboarding initiation updated.",
		data: payload,
	};
};

const deleteVendorInitiation = async (id: string) => {
	console.log("DELETE vendor onboarding initiation:", id);

	// API ready version:
	// const { data } = await ServerAxios.delete(`/vendor-onboarding/initiation/${id}`);
	// return data;

	return {
		success: true,
		message: "Vendor onboarding initiation deleted.",
		id,
	};
};

type UseVendorOnboardingInitiationParams = {
	initialValues?: Partial<VendorOnboardingInitiationPayload>;
	initiationId?: string;
	onSubmitSuccess?: () => void;
	onUpdateSuccess?: () => void;
	onDeleteSuccess?: () => void;
};

export const useVendorOnboardingInitiation = ({
	initialValues,
	initiationId,
	onSubmitSuccess,
	onUpdateSuccess,
	onDeleteSuccess,
}: UseVendorOnboardingInitiationParams = {}) => {
	const navigate = useNavigate();
	const [values, setValues] = useState<VendorOnboardingInitiationPayload>({
		...initialFormValues,
		...initialValues,
	});

	const [errors, setErrors] = useState<VendorOnboardingInitiationErrors>({});

	const isEditMode = Boolean(initiationId);

	const submitMutation = useMutation({
		mutationFn: createVendorInitiation,
		onSuccess: (response) => {
			console.log("Submit success:", response);
			onSubmitSuccess?.();
			navigate("/vendor/listing?tab=initiation");
		},
		onError: (error) => {
			console.error("Submit failed:", error);
		},
	});

	const updateMutation = useMutation({
		mutationFn: updateVendorInitiation,
		onSuccess: (response) => {
			console.log("Update success:", response);
			onUpdateSuccess?.();
		},
		onError: (error) => {
			console.error("Update failed:", error);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteVendorInitiation,
		onSuccess: (response) => {
			console.log("Delete success:", response);
			onDeleteSuccess?.();
		},
		onError: (error) => {
			console.error("Delete failed:", error);
		},
	});

	const isSubmitting = submitMutation.isPending || updateMutation.isPending;
	const isDeleting = deleteMutation.isPending;

	const isDirty = useMemo(() => {
		return JSON.stringify(values) !== JSON.stringify(initialFormValues);
	}, [values]);

	const handleChange = <K extends keyof VendorOnboardingInitiationPayload>(
		key: K,
		value: VendorOnboardingInitiationPayload[K],
	) => {
		setValues((prev) => ({
			...prev,
			[key]: value,
		}));

		setErrors((prev) => ({
			...prev,
			[key]: "",
		}));
	};

	const handleReset = () => {
		setValues({
			...initialFormValues,
			...initialValues,
		});
		setErrors({});
	};

	const handleSubmit = () => {
		// const validationErrors = validateVendorInitiationForm(values);

		// if (Object.keys(validationErrors).length > 0) {
		// 	setErrors(validationErrors);
		// 	return;
		// }

		if (isEditMode && initiationId) {
			updateMutation.mutate({
				id: initiationId,
				...values,
			});
			return;
		}

		submitMutation.mutate(values);
	};

	const handleDelete = () => {
		if (!initiationId) {
			console.warn("Delete skipped: initiationId is missing.");
			return;
		}

		deleteMutation.mutate(initiationId);
	};

	return {
		values,
		errors,
		isEditMode,
		isDirty,
		isSubmitting,
		isDeleting,

		handleChange,
		handleReset,
		handleSubmit,
		handleDelete,

		submitMutation,
		updateMutation,
		deleteMutation,
	};
};
