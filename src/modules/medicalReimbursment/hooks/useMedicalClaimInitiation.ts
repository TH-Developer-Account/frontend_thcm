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
	ImportedMedicalClaimInitiationApiRow,
	MedicalClaimInitiationErrors,
	MedicalClaimInitiationPayload,
	MedicalClaimInitiationValues,
} from "../types/medicalClaimInitiation.types";
import type { MedicalClaimDetail } from "../types/medicalClaimListing.types";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import type {
	BulkMedicalClaimInitiationPayload,
	ImportedMedicalClaimInitiationRow,
} from "../types/medicalClaimInitiation.types";
import {
	useBulkMedicalClaimInitiationMutation,
	useImportMedicalClaimInitiationsMutation,
} from "./useMedicalClaimMutations";

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

const createImportedRowId = (
	index: number,
	email: string,
	mobile: string,
): string => `${email}-${mobile}-${index}`;

type UseMedicalClaimInitiationImportOptions = {
	onImportSuccess?: (rows: ImportedMedicalClaimInitiationRow[]) => void;
	onInitiateSuccess?: () => void | Promise<void>;
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
	onInitiateSuccess,
}: UseMedicalClaimInitiationImportOptions = {}) {
	const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
	const [importFile, setImportFile] = React.useState<FileUploadValue | null>(
		null,
	);
	const [importFileError, setImportFileError] = React.useState<string>();
	const [initiateAllError, setInitiateAllError] = React.useState<string>();
	const [importedRows, setImportedRows] = React.useState<
		ImportedMedicalClaimInitiationRow[]
	>([]);

	const importMutation = useImportMedicalClaimInitiationsMutation();
	const bulkInitiationMutation = useBulkMedicalClaimInitiationMutation();

	const openImportModal = React.useCallback(() => {
		setImportFile(null);
		setImportFileError(undefined);
		setIsImportModalOpen(true);
	}, []);

	const closeImportModal = React.useCallback(() => {
		if (importMutation.isPending) return;

		setIsImportModalOpen(false);
		setImportFile(null);
		setImportFileError(undefined);
	}, [importMutation.isPending]);

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
			setImportFileError(undefined);
			setInitiateAllError(undefined);

			const response = await importMutation.mutateAsync(formData);
			const rows: ImportedMedicalClaimInitiationRow[] = (
				response.data ?? []
			).map(
				(
					row: ImportedMedicalClaimInitiationApiRow,
					index: number,
				): ImportedMedicalClaimInitiationRow => ({
					rowId: createImportedRowId(index, row.email, row.mobile),
					employeeName: row.employeeName,
					grade: row.grade,
					email: row.email,
					mobile: row.mobile,
				}),
			);

			if (rows.length === 0) {
				setImportFileError(
					"No valid employee records were found in the selected file.",
				);
				return;
			}

			setImportedRows(rows);
			setIsImportModalOpen(false);
			setImportFile(null);

			onImportSuccess?.(rows);
		} catch (error) {
			setImportFileError(
				getErrorMessage(
					error,
					"Unable to import the selected file. Please check the template and try again.",
				),
			);
		}
	}, [importFile?.file, importMutation, onImportSuccess]);

	const handleInitiateAll = React.useCallback(async () => {
		if (importedRows.length === 0) {
			setInitiateAllError("There are no imported employees to initiate.");
			return;
		}

		const payload: BulkMedicalClaimInitiationPayload = {
			employees: importedRows.map(({ employeeName, grade, email, mobile }) => ({
				employeeName,
				grade,
				email,
				mobile,
			})),
		};

		try {
			setInitiateAllError(undefined);

			await bulkInitiationMutation.mutateAsync(payload);

			setImportedRows([]);
			await onInitiateSuccess?.();
		} catch (error) {
			setInitiateAllError(
				getErrorMessage(
					error,
					"Unable to initiate the imported medical claims. Please try again.",
				),
			);
		}
	}, [bulkInitiationMutation, importedRows, onInitiateSuccess]);

	const clearImportedRows = React.useCallback(() => {
		if (bulkInitiationMutation.isPending) return;

		setImportedRows([]);
		setInitiateAllError(undefined);
	}, [bulkInitiationMutation.isPending]);

	return {
		isImportModalOpen,
		importFile,
		importFileError,
		importedRows,
		initiateAllError,

		isImporting: importMutation.isPending,
		isInitiatingAll: bulkInitiationMutation.isPending,

		openImportModal,
		closeImportModal,
		handleImportFileChange,
		handleImportFile,
		handleInitiateAll,
		clearImportedRows,
	};
}
