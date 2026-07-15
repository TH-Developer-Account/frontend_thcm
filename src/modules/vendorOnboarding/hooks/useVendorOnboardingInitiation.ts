import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { vendorOnboardingApi } from "../api/vendorOnboarding.api";

export type VendorOnboardingInitiationPayload = {
  vendorName: string;
  email: string;
  mobile: string;
};

export type VendorOnboardingInitiationErrors = Partial<
  Record<keyof VendorOnboardingInitiationPayload, string>
>;

const initialFormValues: VendorOnboardingInitiationPayload = {
  vendorName: "",
  email: "",
  mobile: "",
};

type UseVendorOnboardingInitiationParams = {
  initialValues?: Partial<VendorOnboardingInitiationPayload>;
  initiationId?: string;
  onSubmitSuccess?: () => void;
  onUpdateSuccess?: () => void;
};

export const useVendorOnboardingInitiation = ({
  initialValues,
  initiationId,
  onSubmitSuccess,
  onUpdateSuccess,
}: UseVendorOnboardingInitiationParams = {}) => {
  const navigate = useNavigate();

  const [values, setValues] = useState<VendorOnboardingInitiationPayload>({
    ...initialFormValues,
    ...initialValues,
  });

  const [errors, setErrors] = useState<VendorOnboardingInitiationErrors>({});

  const isEditMode = Boolean(initiationId);

  const submitMutation = useMutation({
    mutationFn: vendorOnboardingApi.createInitiation,
    onSuccess: () => {
      onSubmitSuccess?.();
      navigate("/vendor/listing?tab=initiation");
    },
    onError: (error) => {
      console.error("Vendor initiation submit failed:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: vendorOnboardingApi.updateInitiation,
    onSuccess: () => {
      onUpdateSuccess?.();
      navigate("/vendor/listing?tab=initiation");
    },
    onError: (error) => {
      console.error("Vendor initiation update failed:", error);
    },
  });

  const isSubmitting = submitMutation.isPending || updateMutation.isPending;

  const isDirty = useMemo(() => {
    const originalValues = {
      ...initialFormValues,
      ...initialValues,
    };

    return JSON.stringify(values) !== JSON.stringify(originalValues);
  }, [values, initialValues]);

  const handleChange = <K extends keyof VendorOnboardingInitiationPayload>(
    key: K,
    value: VendorOnboardingInitiationPayload[K],
  ) => {
    setValues((previousValues) => ({
      ...previousValues,
      [key]: value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
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
    if (isEditMode && initiationId) {
      updateMutation.mutate({
        id: initiationId,
        payload: values,
      });

      return;
    }

    submitMutation.mutate(values);
  };

  return {
    values,
    errors,
    isEditMode,
    isDirty,
    isSubmitting,
    handleChange,
    handleReset,
    handleSubmit,
    submitMutation,
    updateMutation,
  };
};
