import * as React from "react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useToast } from "../../../context/Auth/AuthContext";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import {
	useInitiateMedicalClaimMutation,
	useMedicalClaimDetailQuery,
	useResendMedicalClaimLinkMutation,
} from "./useMedicalClaimMutations";
import type {
	MedicalClaimImportProgress,
	MedicalClaimInitiationErrors,
	MedicalClaimInitiationPayload,
	MedicalClaimInitiationValues,
	ParsedInitiationFile,
} from "../types/medicalClaimInitiation.types";
import type { MedicalClaimDetail } from "../types/medicalClaimListing.types";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import { medicalClaimApi } from "../api/medicalClaim.api";
import {
	firstErrorMessage,
	medicalClaimInitiationSchema,
	toFieldErrors,
} from "../utils/reimbursementClaim.schemas";
import {
	buildInitiationImportFile,
	parseInitiationImportFile,
} from "../helpers/initiationImport.parser";

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
	response: Partial<MedicalClaimInitiationValues> | MedicalClaimDetail | null | undefined,
): MedicalClaimInitiationValues => ({
	employeeName: response?.employeeName ?? "",
	email: response?.email ?? "",
	mobile: response?.mobile ?? "",
	ticketNumber: response?.ticketNumber ?? "",
	status: response?.status ?? undefined,
	referenceNumber: response?.referenceNumber ?? "",
});

const toPayload = (values: MedicalClaimInitiationValues): MedicalClaimInitiationPayload => ({
	employeeName: values.employeeName,
	email: values.email,
	mobile: values.mobile,
	ticketNumber: values.ticketNumber,
});

/** Single-claim initiation (create) and the initiation detail view (resend). */
export const useMedicalClaimInitiation = ({
	claimId,
	initialValues,
	shouldFetchDetails = false,
	onSubmitSuccess,
}: UseMedicalClaimInitiationArgs = {}) => {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const params = useParams<{ id?: string; claimId?: string; initiationId?: string }>();
	const resolvedClaimId =
		claimId ?? params.initiationId ?? params.claimId ?? params.id ?? "";
	const initialResolvedValues = useMemo(
		() => ({ ...EMPTY_VALUES, ...initialValues }),
		[initialValues],
	);
	const [values, setValues] = useState(initialResolvedValues);
	const [originalValues, setOriginalValues] = useState(initialResolvedValues);
	const [errors, setErrors] = useState<MedicalClaimInitiationErrors>({});
	const detailQuery = useMedicalClaimDetailQuery(resolvedClaimId, shouldFetchDetails);
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

	/** Validates one field on blur so mistakes show before submit. */
	const handleBlur = (key: keyof MedicalClaimInitiationPayload) => {
		const result = medicalClaimInitiationSchema.safeParse(toPayload(values));
		if (result.success) return;
		const fieldErrors = toFieldErrors(result.error);
		if (fieldErrors[key] && String(values[key] ?? "").trim()) {
			setErrors((current) => ({ ...current, [key]: fieldErrors[key] }));
		}
	};

	const validate = () => {
		const result = medicalClaimInitiationSchema.safeParse(toPayload(values));
		if (result.success) {
			setErrors({});
			return result.data;
		}
		setErrors(toFieldErrors(result.error) as MedicalClaimInitiationErrors);
		showToast({
			type: "error",
			title: "Please fix the highlighted fields",
			description: firstErrorMessage(result.error),
		});
		return null;
	};

	const handleSubmit = async () => {
		if (initiateMutation.isPending) return;
		const payload = validate();
		if (!payload) return;

		try {
			const response = await initiateMutation.mutateAsync(payload);
			await onSubmitSuccess?.();
			const mailFailed = response?.mailSent === false;
			showToast({
				type: mailFailed ? "error" : "success",
				title: mailFailed ? "Claim initiated — email not sent" : "Submitted successfully",
				description:
					response?.message ??
					"The medical claim was initiated and the access link was sent successfully.",
			});
			setValues(EMPTY_VALUES);
			setOriginalValues(EMPTY_VALUES);
			navigate("/medi-claim/listing?tab=initiation");
		} catch (error) {
			// The current backend saves the claim BEFORE emailing the link, so
			// a server error (e.g. mail failure) can still have created it.
			// Refresh the list and warn, so nobody retries into a duplicate.
			const status = (error as { response?: { status?: number } })?.response?.status;
			const mayExist = !status || status >= 500;
			showToast({
				type: "error",
				title: "Medical claim initiation failed",
				description: mayExist
					? `${getApiErrorMessage(error, "Something went wrong.")} The claim may still have been created — check the Initiation tab (you can resend the link from there) before trying again.`
					: getApiErrorMessage(error, "Please try again."),
			});
		}
	};

	const handleResendLink = async () => {
		if (!resolvedClaimId || resendLinkMutation.isPending) return;
		try {
			const response = await resendLinkMutation.mutateAsync(resolvedClaimId);
			showToast({
				type: "success",
				title: "Link sent",
				description:
					response?.message ?? "The medical claim access link was re-sent successfully.",
			});
		} catch (error) {
			showToast({
				type: "error",
				title: "Unable to re-send link",
				description: getApiErrorMessage(error, "Please try again."),
			});
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
		handleBlur,
		handleReset,
		handleSubmit,
		handleResendLink,
		initiateMutation,
		resendLinkMutation,
	};
};

/* -------------------------------------------------------------------------- */
/* Bulk import                                                                 */
/* -------------------------------------------------------------------------- */

type UseMedicalClaimInitiationImportOptions = {
	onImportSuccess?: () => void | Promise<void>;
};

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_DURATION_MS = 10 * 60_000;

/**
 * Bulk initiation from an Excel/CSV file:
 *  1. The file is parsed and every row validated IN THE BROWSER (same zod
 *     schema as the single form + duplicate checks) and shown in a preview.
 *  2. Only valid rows are uploaded (a clean xlsx is generated), so nothing
 *     is created or emailed for rows HR hasn't fixed.
 *  3. The import job is polled until it completes; the result summary and
 *     any server-side row errors are shown.
 */
export function useMedicalClaimInitiationImport({
	onImportSuccess,
}: UseMedicalClaimInitiationImportOptions = {}) {
	const { showToast } = useToast();
	const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
	const [importFile, setImportFile] = React.useState<FileUploadValue | null>(null);
	const [importFileError, setImportFileError] = React.useState<string>();
	const [parsedFile, setParsedFile] = React.useState<ParsedInitiationFile | null>(null);
	const [isParsing, setIsParsing] = React.useState(false);
	const [isImporting, setIsImporting] = React.useState(false);
	const [progress, setProgress] = React.useState<MedicalClaimImportProgress>();
	const pollTimerRef = React.useRef<number | undefined>(undefined);
	const isMountedRef = React.useRef(true);

	React.useEffect(
		() => () => {
			isMountedRef.current = false;
			window.clearTimeout(pollTimerRef.current);
		},
		[],
	);

	const resetSelection = React.useCallback(() => {
		setImportFile(null);
		setImportFileError(undefined);
		setParsedFile(null);
	}, []);

	const openImportModal = React.useCallback(() => {
		resetSelection();
		setIsImportModalOpen(true);
	}, [resetSelection]);

	const closeImportModal = React.useCallback(() => {
		if (isImporting) return;
		setIsImportModalOpen(false);
		resetSelection();
	}, [isImporting, resetSelection]);

	const handleImportFileChange = React.useCallback(async (value: FileUploadValue | null) => {
		setImportFile(value);
		setImportFileError(undefined);
		setParsedFile(null);
		if (!value?.file) return;

		setIsParsing(true);
		try {
			const parsed = await parseInitiationImportFile(value.file);
			if (!isMountedRef.current) return;
			setParsedFile(parsed);
			if (parsed.fileErrors.length) setImportFileError(parsed.fileErrors[0]);
		} catch {
			setImportFileError("This file could not be read. Upload an .xlsx, .xls or .csv file.");
		} finally {
			if (isMountedRef.current) setIsParsing(false);
		}
	}, []);

	const pollStatus = React.useCallback(
		async (jobId: string, startedAt: number, skippedRows: number): Promise<void> => {
			const result = await medicalClaimApi.getInitiationImportStatus(jobId);
			if (!isMountedRef.current) return;

			const nextProgress: MedicalClaimImportProgress = {
				status: result.status,
				totalRows: 0,
				processedRows: 0,
				failedRows: 0,
				...result.progress,
				errors: result.errors ?? [],
				failedReason: result.failedReason,
				skippedRows,
			};
			setProgress(nextProgress);

			if (result.status === "completed") {
				setIsImporting(false);
				const initiated = nextProgress.processedRows;
				const failed = nextProgress.failedRows + skippedRows;
				showToast({
					type: initiated === 0 ? "error" : "success",
					title: "Import finished",
					description: `${initiated} claim${initiated === 1 ? "" : "s"} initiated${failed ? `, ${failed} row${failed === 1 ? "" : "s"} not imported` : ""}.`,
				});
				await onImportSuccess?.();
				return;
			}
			if (result.status === "failed") {
				setIsImporting(false);
				showToast({
					type: "error",
					title: "Import failed",
					description: result.failedReason ?? "The import could not be completed.",
				});
				return;
			}
			if (Date.now() - startedAt > MAX_POLL_DURATION_MS) {
				setIsImporting(false);
				setProgress((current) =>
					current
						? {
								...current,
								failedReason:
									"The import is still running. Check the listing in a few minutes.",
							}
						: current,
				);
				return;
			}

			pollTimerRef.current = window.setTimeout(() => {
				void pollStatus(jobId, startedAt, skippedRows).catch((pollError) => {
					if (!isMountedRef.current) return;
					setIsImporting(false);
					setProgress((current) =>
						current
							? {
									...current,
									status: "failed",
									failedReason: getApiErrorMessage(
										pollError,
										"Unable to retrieve the import status.",
									),
								}
							: current,
					);
				});
			}, POLL_INTERVAL_MS);
		},
		[onImportSuccess, showToast],
	);

	const handleImportFile = React.useCallback(async () => {
		if (isImporting) return;
		const selectedFile = importFile?.file;
		if (!selectedFile) {
			setImportFileError("Please select an Excel file.");
			return;
		}
		if (!parsedFile) {
			setImportFileError("The file is still being checked. Please wait a moment.");
			return;
		}
		if (parsedFile.fileErrors.length) {
			setImportFileError(parsedFile.fileErrors[0]);
			return;
		}
		if (parsedFile.validCount === 0) {
			setImportFileError("No valid rows to import. Fix the errors shown below and upload again.");
			return;
		}

		const formData = new FormData();
		formData.append("file", buildInitiationImportFile(parsedFile.rows, selectedFile.name));

		try {
			setIsImporting(true);
			setImportFileError(undefined);
			setProgress({
				status: "waiting",
				totalRows: parsedFile.validCount,
				processedRows: 0,
				failedRows: 0,
				errors: [],
				skippedRows: parsedFile.invalidCount,
			});

			const { jobId } = await medicalClaimApi.enqueueInitiationImport(formData);
			setIsImportModalOpen(false);
			resetSelection();
			await pollStatus(jobId, Date.now(), parsedFile.invalidCount);
		} catch (error) {
			setIsImporting(false);
			setProgress(undefined);
			setImportFileError(
				getApiErrorMessage(
					error,
					"Unable to import the selected file. Please check the template and try again.",
				),
			);
		}
	}, [importFile?.file, isImporting, parsedFile, pollStatus, resetSelection]);

	const clearProgress = React.useCallback(() => {
		if (!isImporting) setProgress(undefined);
	}, [isImporting]);

	const canImport = Boolean(
		importFile?.file &&
			parsedFile &&
			!parsedFile.fileErrors.length &&
			parsedFile.validCount > 0 &&
			!isParsing,
	);

	return {
		isImportModalOpen,
		importFile,
		importFileError,
		parsedFile,
		isParsing,
		canImport,
		progress,
		isImporting,

		openImportModal,
		closeImportModal,
		handleImportFileChange,
		handleImportFile,
		clearProgress,
	};
}
