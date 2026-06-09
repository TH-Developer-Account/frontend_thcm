import React from "react";
import { useToast } from "../../../../../context/Auth/AuthContext";
import { MAX_IMAGES, validateImageFile } from "./constant";
import type {
	UseEventReportFormProps,
	FormState,
	ReportImage,
} from "../../types/event.report.types";
import {
	buildEventReportFormData,
	mapReportToForm,
	mapReportToImages,
} from "./eventReport.mapper";
import { useSubmitEventReportMutation } from "../../queries/useActivityFormQuery";

export function useEventReportForm({
	epcId,
	eventCost,
	initialReport,
	onSuccess,
}: UseEventReportFormProps) {
	const { showToast } = useToast();
	const submitMutation = useSubmitEventReportMutation();

	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const targetSlotRef = React.useRef<number | null>(null);

	const [images, setImages] = React.useState<(ReportImage | undefined)[]>(() =>
		mapReportToImages(initialReport),
	);

	const [form, setForm] = React.useState<FormState>(() =>
		mapReportToForm(initialReport, eventCost),
	);

	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		setImages(mapReportToImages(initialReport));
		setForm(mapReportToForm(initialReport, eventCost));
	}, [initialReport, eventCost]);

	React.useEffect(() => {
		return () => {
			images.forEach((img) => {
				if (img?.file) URL.revokeObjectURL(img.url);
			});
		};
	}, []);

	const openFilePicker = React.useCallback((slotIndex?: number) => {
		targetSlotRef.current = slotIndex ?? null;
		fileInputRef.current?.click();
	}, []);

	const handleFileChange = React.useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files || []);
			if (!files.length) return;

			setImages((prev) => {
				const updated = [...prev];

				if (targetSlotRef.current !== null) {
					const file = files[0];
					const validationError = validateImageFile(file);

					if (validationError) {
						setError(validationError);
						return prev;
					}

					const old = updated[targetSlotRef.current];

					if (old?.file) {
						URL.revokeObjectURL(old.url);
					}

					updated[targetSlotRef.current] = {
						url: URL.createObjectURL(file),
						file,
						position: targetSlotRef.current + 1,
					};

					return updated;
				}

				let fileIndex = 0;

				for (let i = 0; i < MAX_IMAGES && fileIndex < files.length; i++) {
					if (!updated[i]) {
						const file = files[fileIndex++];
						const validationError = validateImageFile(file);

						if (validationError) {
							setError(validationError);
							break;
						}

						updated[i] = {
							url: URL.createObjectURL(file),
							file,
							position: i + 1,
						};
					}
				}

				return updated;
			});

			e.target.value = "";
			setError(null);
		},
		[],
	);

	const removeImage = React.useCallback((index: number) => {
		setImages((prev) => {
			const updated = [...prev];
			const old = updated[index];

			if (old?.file) {
				URL.revokeObjectURL(old.url);
			}

			updated[index] = undefined;
			return updated;
		});
	}, []);

	const handleFormChange = React.useCallback(
		(field: keyof FormState, value: string) => {
			setForm((prev) => ({ ...prev, [field]: value }));
			setError(null);
		},
		[],
	);

	const validateForm = React.useCallback(() => {
		const filledImages = images.filter(Boolean);

		if (filledImages.length !== MAX_IMAGES) {
			return `Please upload all ${MAX_IMAGES} event photos before submitting`;
		}

		if (!form.outcomeStatus) {
			return "Please select an event outcome status";
		}

		if (!form.totalLeadsGenerated || isNaN(Number(form.totalLeadsGenerated))) {
			return "Please enter total leads generated";
		}

		if (!form.approvedEventCost || isNaN(Number(form.approvedEventCost))) {
			return "Please enter the approved event cost";
		}

		return null;
	}, [form, images]);

	const handleSubmit = React.useCallback(async () => {
		const validationError = validateForm();

		if (validationError) {
			setError(validationError);
			return;
		}

		try {
			const payload = buildEventReportFormData(images, form);

			await submitMutation.mutateAsync({
				epcId,
				payload,
				isEditMode: form.formType === "EDIT",
			});

			showToast({
				type: "success",
				title: "Success",
				description:
					form.formType === "EDIT"
						? "Report resubmitted successfully."
						: "Report submitted successfully.",
			});

			await onSuccess?.();
		} catch (err: any) {
			setError(
				err?.response?.data?.message ||
					err?.message ||
					"Failed to submit report.",
			);
		}
	}, [epcId, form, images, onSuccess, showToast, submitMutation, validateForm]);

	return {
		form,
		images,
		error,
		fileInputRef,
		filledCount: images.filter(Boolean).length,
		isSubmitting: submitMutation.isPending,
		openFilePicker,
		handleFileChange,
		removeImage,
		handleFormChange,
		handleSubmit,
	};
}
