import { useEffect, useState } from "react";
import {
  fetchDropdownOptions,
  fetchBranchesByZone,
  generateEpfNumber,
  fetchEpcById,
  saveEpcForm,
} from "./api";
import { validateEpcForm } from "./validation";
import type { EpcFormValues, UseEpcFormProps, Option } from "../../types";

const initialValues: EpcFormValues = {
  epfNo: "",
  poDocumentRefNo: "",
  department: "",
  zone: "",
  branch: "",
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
  const [values, setValues] = useState<EpcFormValues>(initialValues);
  const [errors, setErrors] = useState<
    Partial<Record<keyof EpcFormValues, string>>
  >({});
  const [loading, setLoading] = useState(false);

  const [options, setOptions] = useState<Option[]>([]);
  const [zone, setZone] = useState<Option[]>([]);
  const [branches, setBranches] = useState<Option[]>([]);

  const isEditMode = Boolean(epcId);

  // Initial Load

  useEffect(() => {
    const init = async () => {
      try {
        const dropdowns = await fetchDropdownOptions();
        setOptions(dropdowns);
        setZone(dropdowns.zones || []);

        if (!isEditMode) {
          const { epfNo } = await generateEpfNumber();
          setValues((prev) => ({ ...prev, epfNo }));
        }

        if (epcId) {
          const data = await fetchEpcById(epcId);
          setValues(data);

          if (data.zone) {
            const branchData = await fetchBranchesByZone(data.zone);
            setBranches(branchData);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    init();
  }, [epcId, isEditMode]);

  // Zone → Branch Dependency

  useEffect(() => {
    const loadBranches = async () => {
      if (!values.zone) {
        setBranches([]);
        return;
      }

      try {
        const data = await fetchBranchesByZone(values.zone);
        setBranches(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadBranches();
  }, [values.zone]);

  // Field Change

  const handleChange = (name: keyof EpcFormValues, value: string) => {
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
    console.log("Submitting Form Data:");
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
      await saveEpcForm(formData);

      alert(
        status === "DRAFT"
          ? "Draft Saved Successfully"
          : "Submitted Successfully",
      );
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
    options,
    zone,
    branches,
    isEditMode,
    handleChange,
    handleSave,
  };
};
