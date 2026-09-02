import * as React from "react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useToast } from "../../../context/Auth/AuthContext";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../utils/apiError.helper";
import {
	useInitiateMedicalClaimMutation,
	useMedicalClaimDetailQuery,
	useResendMedicalClaimLinkMutation,
} from "../hooks/useMedicalClaimMutations";
import type {
	MedicalClaimInitiationErrors,
	MedicalClaimImportProgress,
	MedicalClaimInitiationPayload,
	MedicalClaimInitiationValues,
} from "../types/medicalClaimInitiation.types";
import type { MedicalClaimDetail } from "../types/medicalClaimListing.types";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import { medicalClaimApi } from "../api/medicalClaim.api";

const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
	if (typeof error === "object" && error !== null && "response" in error) {
		const response = error.response as {
			data?: {
				message?: string;
			};
		};

		if (response.data?.message) {
			return response.data.message;
		}
	}

	return fallbackMessage;
};

type UseMedicalClaimInitiationImportOptions = {
	onImportSuccess?: () => void | Promise<void>;
};
const EMPTY_VALUES: MedicalClaimInitiationValues = {
	employeeName: "",
	email: "",
	mobile: "",
	status: undefined,
	referenceNumber: "",
	ticketNumber: "",
};

type UseMedicalClaimInitiationArgs = {
	claimId?: string;
	initialValues?: Partial<MedicalClaimInitiationValues>;
	shouldFetchDetails?: boolean;
	onSubmitSuccess?: () => void | Promise<void>;
};

const mapDetailToForm = (
	response:
		| Partial<MedicalClaimInitiationValues>
		| MedicalClaimDetail
		| null
		| undefined,
): MedicalClaimInitiationValues => ({
	employeeName: response?.employeeName ?? "",
	email: response?.email ?? "",
	mobile: response?.mobile ?? "",
	ticketNumber: response?.ticketNumber ?? "",
	// status: response?.status,
	// referenceNumber: response?.referenceNumber ?? "",
});

export const useMedicalClaimInitiation = ({
	claimId,
	initialValues,
	shouldFetchDetails = false,
	onSubmitSuccess,
}: UseMedicalClaimInitiationArgs = {}) => {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const params = useParams<{ id?: string; claimId?: string }>();
	const resolvedClaimId = claimId ?? params.claimId ?? params.id ?? "";
	const initialResolvedValues = useMemo(
		() => ({ ...EMPTY_VALUES, ...initialValues }),
		[initialValues],
	);
	const [values, setValues] = useState(initialResolvedValues);
	const [originalValues, setOriginalValues] = useState(initialResolvedValues);
	const [errors, setErrors] = useState<MedicalClaimInitiationErrors>({});
	const detailQuery = useMedicalClaimDetailQuery(
		resolvedClaimId,
		shouldFetchDetails,
	);
	const initiateMutation = useInitiateMedicalClaimMutation();
	const resendLinkMutation = useResendMedicalClaimLinkMutation();

	React.useEffect(() => {
		if (!shouldFetchDetails || !detailQuery.data) return;
		const mapped = mapDetailToForm(detailQuery.data);
		setValues(mapped);
		setOriginalValues(mapped);
		setErrors({});
	}, [detailQuery.data, shouldFetchDetails]);

	React.useEffect(() => {
		if (shouldFetchDetails) return;
		setValues(initialResolvedValues);
		setOriginalValues(initialResolvedValues);
		setErrors({});
	}, [initialResolvedValues, shouldFetchDetails]);

	const isDirty = useMemo(
		() => JSON.stringify(values) !== JSON.stringify(originalValues),
		[originalValues, values],
	);

	const handleChange = <K extends keyof MedicalClaimInitiationPayload>(
		key: K,
		value: MedicalClaimInitiationPayload[K],
	) => {
		setValues((current) => ({ ...current, [key]: value }));
		setErrors((current) => ({ ...current, [key]: undefined }));
	};

	const validate = () => {
		const next: MedicalClaimInitiationErrors = {};
		if (!values.employeeName.trim())
			next.employeeName = "Employee name is required.";
		if (!/^\S+@\S+\.\S+$/.test(values.email.trim()))
			next.email = "Enter a valid email address.";
		if (!/^\d{10}$/.test(values.mobile.trim()))
			next.mobile = "Enter a valid 10-digit mobile number.";
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = () => {
		console.log(values, "vl");

		if (!validate()) return;
		initiateMutation.mutate(
			{
				employeeName: values.employeeName.trim(),
				email: values.email.trim(),
				mobile: values.mobile.trim(),
				ticketNumber: values.ticketNumber.trim(),
			},
			{
				onSuccess: async () => {
					await onSubmitSuccess?.();
					showSuccessToast(
						showToast,
						"The medical claim was initiated and the access link was sent successfully.",
						"Submitted successfully",
					);
					navigate("/medi-claim/listing");
				},
				onError: (error) =>
					showApiErrorToast(
						showToast,
						error,
						"Medical claim initiation failed",
					),
			},
		);
	};

	const handleResendLink = async () => {
		if (!resolvedClaimId) return;
		try {
			await resendLinkMutation.mutateAsync(resolvedClaimId);
			showSuccessToast(
				showToast,
				"The medical claim access link was re-sent successfully.",
				"Link sent",
			);
		} catch (error) {
			showApiErrorToast(showToast, error, "Unable to re-send link");
		}
	};

	const handleReset = () => {
		setValues(originalValues);
		setErrors({});
	};

	return {
		values,
		errors,
		resolvedClaimId,
		isDirty,
		isSubmitting: initiateMutation.isPending,
		isResendingLink: resendLinkMutation.isPending,
		isDetailLoading: detailQuery.isLoading,
		isDetailFetching: detailQuery.isFetching,
		isDetailError: detailQuery.isError,
		detailError: detailQuery.error,
		handleChange,
		handleReset,
		handleSubmit,
		handleResendLink,
		initiateMutation,
		resendLinkMutation,
	};
};

export function useMedicalClaimInitiationImport({
	onImportSuccess,
}: UseMedicalClaimInitiationImportOptions = {}) {
	const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
	const [importFile, setImportFile] = React.useState<FileUploadValue | null>(
		null,
	);
	const [importFileError, setImportFileError] = React.useState<string>();
	const [isImporting, setIsImporting] = React.useState(false);
	const [progress, setProgress] = React.useState<MedicalClaimImportProgress>();
	const pollTimerRef = React.useRef<number | undefined>(undefined);

	React.useEffect(() => () => window.clearTimeout(pollTimerRef.current), []);

	const openImportModal = React.useCallback(() => {
		setImportFile(null);
		setImportFileError(undefined);
		setIsImportModalOpen(true);
	}, []);

	const closeImportModal = React.useCallback(() => {
		if (isImporting) return;

		setIsImportModalOpen(false);
		setImportFile(null);
		setImportFileError(undefined);
	}, [isImporting]);

	const handleImportFileChange = React.useCallback(
		(value: FileUploadValue | null) => {
			setImportFile(value);
			setImportFileError(undefined);
		},
		[],
	);

	const handleImportFile = React.useCallback(async () => {
		const selectedFile = importFile?.file;

		if (!selectedFile) {
			setImportFileError("Please select an Excel file.");
			return;
		}

		const formData = new FormData();
		formData.append("file", selectedFile);

		try {
			setIsImporting(true);
			setImportFileError(undefined);
			setProgress({
				status: "waiting",
				totalRows: 0,
				processedRows: 0,
				failedRows: 0,
				errors: [],
			});

			const { jobId } = await medicalClaimApi.enqueueInitiationImport(formData);
			setIsImportModalOpen(false);
			setImportFile(null);

			const poll = async (): Promise<void> => {
				const result = await medicalClaimApi.getInitiationImportStatus(jobId);
				setProgress({
					status: result.status,
					...result.progress,
					errors: result.errors ?? [],
					failedReason: result.failedReason,
				});

				if (result.status === "completed") {
					setIsImporting(false);
					await onImportSuccess?.();
					return;
				}
				if (result.status === "failed") {
					setIsImporting(false);
					return;
				}
				pollTimerRef.current = window.setTimeout(() => {
					void poll().catch((pollError) => {
						setIsImporting(false);
						setProgress((current) =>
							current
								? {
										...current,
										status: "failed",
										failedReason: getErrorMessage(
											pollError,
											"Unable to retrieve the import status.",
										),
									}
								: current,
						);
					});
				}, 1500);
			};

			await poll();
		} catch (error) {
			setIsImporting(false);
			setImportFileError(
				getErrorMessage(
					error,
					"Unable to import the selected file. Please check the template and try again.",
				),
			);
		}
	}, [importFile?.file, onImportSuccess]);

	const clearProgress = React.useCallback(() => {
		if (!isImporting) setProgress(undefined);
	}, [isImporting]);

	return {
		isImportModalOpen,
		importFile,
		importFileError,
		progress,
		isImporting,

		openImportModal,
		closeImportModal,
		handleImportFileChange,
		handleImportFile,
		clearProgress,
	};
}
