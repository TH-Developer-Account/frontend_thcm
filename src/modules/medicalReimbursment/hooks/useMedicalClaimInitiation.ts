import * as React from "react";
import { useMemo } from "react";
import { useForm, type SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";

import { useToast } from "../../../context/Auth/AuthContext";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import {
	DEFAULT_COUNTRY_CODE,
	joinMobile,
	splitMobile,
} from "../../../utils/phone";
import {
	useInitiateMedicalClaimMutation,
	useMedicalClaimDetailQuery,
	useResendMedicalClaimLinkMutation,
} from "./useMedicalClaimMutations";
import type {
	MedicalClaimImportProgress,
	MedicalClaimInitiationPayload,
	MedicalClaimInitiationValues,
	ParsedInitiationFile,
} from "../types/medicalClaimInitiation.types";
import type { MedicalClaimDetail } from "../types/medicalClaimListing.types";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import { medicalClaimApi } from "../api/medicalClaim.api";
import {
	medicalClaimInitiationFormSchema,
	toNationalMobile,
	type MedicalClaimInitiationFormValues,
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
	status: response?.status ?? undefined,
	referenceNumber: response?.referenceNumber ?? "",
});

/**
 * Stored claim (mobile = "9845012345" or a legacy "+919845012345") -> form
 * values (countryCode = "+91", mobile = "9845012345"). Every path that fills
 * the form (defaults, detail load, reset) goes through this one function.
 */
const toFormValues = (
	source: MedicalClaimInitiationValues,
): MedicalClaimInitiationFormValues => {
	const { countryCode, mobile } = splitMobile(source.mobile ?? "");

	return {
		employeeName: source.employeeName ?? "",
		ticketNumber: source.ticketNumber ?? "",
		email: source.email ?? "",
		countryCode,
		mobile,
		status: source.status,
		referenceNumber: source.referenceNumber,
	};
};

/** Single-claim initiation (create) and the initiation detail view (resend). */
export const useMedicalClaimInitiation = ({
	claimId,
	initialValues,
	shouldFetchDetails = false,
	onSubmitSuccess,
}: UseMedicalClaimInitiationArgs = {}) => {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const params = useParams<{
		id?: string;
		claimId?: string;
		initiationId?: string;
	}>();
	const resolvedClaimId =
		claimId ?? params.initiationId ?? params.claimId ?? params.id ?? "";
	const initialResolvedValues = useMemo(
		() => ({ ...EMPTY_VALUES, ...initialValues }),
		[initialValues],
	);

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isDirty, isSubmitting: isFormSubmitting },
	} = useForm<MedicalClaimInitiationFormValues>({
		resolver: zodResolver(medicalClaimInitiationFormSchema),
		// Validate on every keystroke so errors appear as the user types.
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: toFormValues(initialResolvedValues),
	});

	const detailQuery = useMedicalClaimDetailQuery(
		resolvedClaimId,
		shouldFetchDetails,
	);
	const initiateMutation = useInitiateMedicalClaimMutation();
	const resendLinkMutation = useResendMedicalClaimLinkMutation();

	React.useEffect(() => {
		if (!shouldFetchDetails || !detailQuery.data) return;
		reset(toFormValues(mapDetailToForm(detailQuery.data)));
	}, [detailQuery.data, shouldFetchDetails, reset]);

	React.useEffect(() => {
		if (shouldFetchDetails) return;
		reset(toFormValues(initialResolvedValues));
	}, [initialResolvedValues, shouldFetchDetails, reset]);

	const isSubmitting = isFormSubmitting || initiateMutation.isPending;

	const handleReset = () => {
		reset();
	};

	/** Called by handleSubmit when validation fails: keep the old summary toast. */
	const onInvalid: SubmitErrorHandler<MedicalClaimInitiationFormValues> = (
		fieldErrors,
	) => {
		const firstMessage = Object.values(fieldErrors)
			.map((error) => (error as { message?: string } | undefined)?.message)
			.find(Boolean);
		showToast({
			type: "error",
			title: "Please fix the highlighted fields",
			description: firstMessage ?? "Please check the details and try again.",
		});
	};

	const onValid = async (formValues: MedicalClaimInitiationFormValues) => {
		if (initiateMutation.isPending) return;

		// The split fields are recombined here so the API payload shape is
		// unchanged: `mobile` is still a single string.
		const nationalMobile = toNationalMobile(
			formValues.countryCode,
			formValues.mobile,
		);
		const payload: MedicalClaimInitiationPayload = {
			employeeName: formValues.employeeName,
			ticketNumber: formValues.ticketNumber,
			email: formValues.email,
			// India: the 10-digit national number — the same form the guest
			// login, the public claim form and the bulk import use, so the guest
			// identity (keyed by mobile) always matches. Other countries keep
			// the full "+<country code><national number>".
			mobile:
				formValues.countryCode === DEFAULT_COUNTRY_CODE
					? nationalMobile
					: joinMobile(formValues.countryCode, nationalMobile),
		};

		try {
			const response = await initiateMutation.mutateAsync(payload);
			await onSubmitSuccess?.();
			const mailFailed = response?.mailSent === false;
			showToast({
				type: mailFailed ? "error" : "success",
				title: mailFailed
					? "Claim initiated — email not sent"
					: "Submitted successfully",
				description:
					response?.message ??
					"The medical claim was initiated and the access link was sent successfully.",
			});
			reset(toFormValues(EMPTY_VALUES));
			navigate("/medi-claim/listing?tab=initiation");
		} catch (error) {
			// The current backend saves the claim BEFORE emailing the link, so
			// a server error (e.g. mail failure) can still have created it.
			// Refresh the list and warn, so nobody retries into a duplicate.
			const status = (error as { response?: { status?: number } })?.response
				?.status;
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
					response?.message ??
					"The medical claim access link was re-sent successfully.",
			});
		} catch (error) {
			showToast({
				type: "error",
				title: "Unable to re-send link",
				description: getApiErrorMessage(error, "Please try again."),
			});
		}
	};

	return {
		register,
		control,
		errors,
		isDirty,
		isSubmitting,
		isResendingLink: resendLinkMutation.isPending,
		isDetailLoading: detailQuery.isLoading,
		handleReset,
		// Exposed raw (not pre-applied): the form calls
		// `handleSubmit(onValid, onInvalid)` inline in its event handlers.
		handleSubmit,
		onValid,
		onInvalid,
		handleResendLink,
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
 *     schema as the single form + duplicate checks).
 *  2. Only valid rows are uploaded (a clean xlsx is generated), so nothing
 *     is created or emailed for rows HR hasn't fixed.
 *  3. The import job is polled until it completes; the result summary and
 *     any server-side row errors are shown.
 */
export function useMedicalClaimInitiationImport({
	onImportSuccess,
}: UseMedicalClaimInitiationImportOptions = {}) {
	const { showToast } = useToast();
	const [importFile, setImportFile] = React.useState<FileUploadValue | null>(
		null,
	);
	const [importFileError, setImportFileError] = React.useState<string>();
	const [parsedFile, setParsedFile] =
		React.useState<ParsedInitiationFile | null>(null);
	const [isParsing, setIsParsing] = React.useState(false);
	const [isImporting, setIsImporting] = React.useState(false);
	const [progress, setProgress] = React.useState<MedicalClaimImportProgress>();
	const pollTimerRef = React.useRef<number | undefined>(undefined);
	const isMountedRef = React.useRef(true);

	React.useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
			window.clearTimeout(pollTimerRef.current);
		};
	}, []);

	const resetSelection = React.useCallback(() => {
		setImportFile(null);
		setImportFileError(undefined);
		setParsedFile(null);
	}, []);

	const handleImportFileChange = React.useCallback(
		async (value: FileUploadValue | null) => {
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
				setImportFileError(
					"This file could not be read. Upload an .xlsx, .xls or .csv file.",
				);
			} finally {
				if (isMountedRef.current) setIsParsing(false);
			}
		},
		[],
	);

	const pollStatus = React.useCallback(
		async (
			jobId: string,
			startedAt: number,
			skippedRows: number,
		): Promise<void> => {
			const result = await medicalClaimApi.getInitiationImportStatus(jobId);
			if (!isMountedRef.current) return;

			const nextProgress: MedicalClaimImportProgress = {
				status: result.status,
				...result.progress,
				totalRows: result.progress?.totalRows ?? 0,
				processedRows: result.progress?.processedRows ?? 0,
				failedRows: result.progress?.failedRows ?? 0,
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
					description:
						result.failedReason ?? "The import could not be completed.",
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
			setImportFileError(
				"The file is still being checked. Please wait a moment.",
			);
			return;
		}
		if (parsedFile.fileErrors.length) {
			setImportFileError(parsedFile.fileErrors[0]);
			return;
		}
		if (parsedFile.validCount === 0) {
			setImportFileError(
				"No valid rows to import. Fix the errors shown below and upload again.",
			);
			return;
		}

		const formData = new FormData();
		formData.append(
			"file",
			buildInitiationImportFile(parsedFile.rows, selectedFile.name),
		);

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
		importFile,
		importFileError,
		isParsing,
		canImport,
		progress,
		isImporting,

		handleImportFileChange,
		handleImportFile,
		clearProgress,
	};
}
