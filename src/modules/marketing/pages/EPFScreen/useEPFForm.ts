import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export const useEpfForm = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

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

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await ServerAxios.get(
          `/master-data/products?productType=EPF`,
        );

        const data = response.data.data;
        setOptions(
          data.map((item: Product) => ({
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

  const handleSubmit = async () => {
    try {
      const epcId = localStorage.getItem("epcId");

      if (!epcId) {
        console.error("EPC ID not found in localStorage");
        return;
      }

      const extraPayload = {
        epcId,
        total_budget: 300000,
        expected_revenue: 50000,
      };
      const payload = buildLineItemPayload(costItems, extraPayload);

      console.log("FINAL PAYLOAD:", payload);

      const {
        data: { message },
      } = await ServerAxios.post("/epf", payload);

      showToast({
        type: "success",
        title: "Success",
        description: message,
      });

      navigate("/marketing/listing");
    } catch (error) {
      console.error("CRF creation failed:", error);
    }
  };

  return {
    values,
    draft,
    errors,
    loading,
    options,
    costItems,
    setCostItems,
    setOptions,
    handleChange,
    handleSave,
    handleReset,
    handleSubmit,
  };
};
