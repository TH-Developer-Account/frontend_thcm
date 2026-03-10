import { useState } from "react";
import { validateEpcForm } from "./validation";
import { useToast } from "../../../../context/Auth/AuthContext";
import type { EpcFormValues, UseEpcFormProps } from "../../types";
import { ServerAxios } from "../../../../services/ServerAxios";

const initialValues: EpcFormValues = {
  epfNo: "",
  poDocumentRefNo: "",
  department: "",
  zone: "",
  branch: "",
  budgetCode: "",
  vertical: "",
  scale: "",
  eventName: "",
  eventDescription: "",
  eventFrom: "",
  eventTo: "",
  location: "",
  objective: "",
  status: "DRAFT",
};

export const useEpcForm = ({ epcId }: UseEpcFormProps) => {
  const { showToast } = useToast();
  const [values, setValues] = useState<EpcFormValues>(initialValues);
  const [errors, setErrors] = useState<
    Partial<Record<keyof EpcFormValues, string>>
  >({});
  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(epcId);

  // Field Change

  const handleChange = (name: keyof EpcFormValues, value: string) => {
    console.log({ name, value });
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // Reset branch if zone changes
    if (name === "zone") {
      setValues((prev) => ({
        ...prev,
        branch: "",
      }));
    }
  };

  // Save

  const handleSave = async (status: "DRAFT" | "SUBMITTED") => {
    const formData = { ...values, status };
    console.log(formData);
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

  return {
    values,
    errors,
    loading,
    isEditMode,
    handleChange,
    handleSave,
  };
};
