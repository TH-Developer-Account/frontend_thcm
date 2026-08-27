import * as React from "react";
import {
	Navigate,
	useNavigate,
	useParams,
	useSearchParams,
} from "react-router-dom";

import Card from "../../../components/common/Card";
import { createRemoteFileUploadValue } from "../../../components/ui/FileUpload/fileUpload.helpers";
import PublicPagesLayout from "../../../layout/PublicPagesLayout";
import ReimbursementClaimForm from "../components/ReimbursementClaimForm";
import type {
	ClaimHeadRow,
	CoverageType,
	ReimbursementClaimFormValues,
	ReimbursementClaimSubmission,
} from "../types/reimbursementClaim.types";
import {
	usePublicMedicalClaimQuery,
	useSavePublicMedicalClaimDraftMutation,
	useSubmitPublicMedicalClaimMutation,
} from "../hooks/useMedicalClaimMutations";

const PUBLIC_MEDICAL_CLAIM_SESSION_KEY = "medical-claim-session-code";
const PUBLIC_SESSION_END_DELAY_MS = 2500;

const getSavedSessionCode = (): string => {
	if (typeof window === "undefined") return "";
	return (
		window.sessionStorage.getItem(PUBLIC_MEDICAL_CLAIM_SESSION_KEY)?.trim() ??
		""
	);
};

const saveSessionCode = (token: string): void => {
	if (typeof window !== "undefined" && token) {
		window.sessionStorage.setItem(PUBLIC_MEDICAL_CLAIM_SESSION_KEY, token);
	}
};

const clearSessionCode = (): void => {
	if (typeof window !== "undefined") {
		window.sessionStorage.removeItem(PUBLIC_MEDICAL_CLAIM_SESSION_KEY);
	}
};

interface ReimbursementClaimPublicPageProps {
	initialValues?: Partial<ReimbursementClaimFormValues>;
	submitClaim?: (
		submission: ReimbursementClaimSubmission,
	) => void | Promise<void>;
	saveDraft?: (
		submission: ReimbursementClaimSubmission,
	) => void | Promise<void>;
}

export type MedicalClaimFormSource = {
	formValues?: Partial<ReimbursementClaimFormValues>;
	values?: Partial<ReimbursementClaimFormValues>;
	lineItems?: Array<ClaimHeadRow | PublicBillShape>;
	bills?: PublicBillShape[];
	employeeName?: string | null;
	ticketNumber?: string | null;
	grade?: string | null;
	location?: string | null;
	patientName?: string | null;
	claimCover?: CoverageType | null;
	spouseName?: string | null;
	medicalAdvanceTaken?: string | number | null;
	alreadySettled?: string | number | null;
	mobile?: string | null;
	email?: string | null;
};

type PublicClaimShape = MedicalClaimFormSource;

type PublicBillShape = {
	id?: string | number | null;
	claimHead?: ClaimHeadRow["claimHead"] | null;
	billNo?: string | null;
	billNumber?: string | null;
	billName?: string | null;
	billDate?: string | Date | null;
	amount?: string | number | null;
	patient?: ClaimHeadRow["patient"] | null;
	fileName?: string | null;
	fileUrl?: string | null;
	attachmentUrl?: string | null;
	mimeType?: string | null;
	fileSize?: number | null;
	s3Key?: string | null;
	approvedClaimAmount?: string | number | null;
	approvalStatus?: ClaimHeadRow["approvalStatus"] | null;
	remarks?: string | null;
};

const toDateInputValue = (value: string | Date | null | undefined): string => {
	if (!value) return "";
	if (value instanceof Date) {
		return Number.isNaN(value.getTime())
			? ""
			: value.toISOString().slice(0, 10);
	}
	const normalized = value.trim();
	if (/^\d{4}-\d{2}-\d{2}/.test(normalized)) return normalized.slice(0, 10);
	const parsed = new Date(normalized);
	return Number.isNaN(parsed.getTime())
		? ""
		: parsed.toISOString().slice(0, 10);
};

const getFileNameFromKey = (key?: string | null): string | null => {
	if (!key) return null;
	return key.split(/[\\/]/).pop() || null;
};

const mapPublicBillToLineItem = (
	bill: PublicBillShape,
	index: number,
): ClaimHeadRow => {
	const fileUrl = bill.fileUrl ?? bill.attachmentUrl ?? null;
	const fileName =
		bill.fileName ?? getFileNameFromKey(bill.s3Key) ?? `bill-${index + 1}`;

	return {
		id: String(bill.id ?? `bill-${index + 1}`),
		claimHead: bill.claimHead,
		billNumber: bill.billNumber ?? bill.billNo ?? "",
		billName: bill.billName ?? "",
		patient: bill.patient ?? "SELF",
		billDate: toDateInputValue(bill.billDate),
		amount: String(bill.amount ?? ""),
		file: null,
		fileName,
		attachment: fileUrl
			? createRemoteFileUploadValue({
					id: String(bill.id ?? `bill-${index + 1}`),
					url: fileUrl,
					name: fileName,
					type: bill.mimeType,
					size: bill.fileSize,
					fallbackName: fileName,
				})
			: null,
		approvedClaimAmount: String(bill.approvedClaimAmount ?? bill.amount ?? ""),
		approvalStatus: bill.approvalStatus ?? "PENDING",
		remarks: bill.remarks ?? "",
	} as ClaimHeadRow;
};

const mapPublicLineItem = (
	item: ClaimHeadRow | PublicBillShape,
	index: number,
): ClaimHeadRow => {
	if ("billNumber" in item && !("billNo" in item)) {
		return {
			...item,
			billDate: toDateInputValue(item.billDate),
			amount: String(item.amount ?? ""),
			approvedClaimAmount: String(
				item.approvedClaimAmount ?? item.amount ?? "",
			),
			approvalStatus: item.approvalStatus ?? "PENDING",
			remarks: item.remarks ?? "",
		} as ClaimHeadRow;
	}
	return mapPublicBillToLineItem(item, index);
};

const mapMedicalClaimValues = (
	claim?: MedicalClaimFormSource,
): Partial<ReimbursementClaimFormValues> | undefined => {
	if (!claim) return undefined;
	return (
		claim.formValues ??
		claim.values ?? {
			employeeName: claim.employeeName ?? "",
			ticketNumber: claim.ticketNumber ?? "",
			grade: claim.grade ?? "",
			location: claim.location ?? "",
			patientName: claim.patientName ?? "",
			coverageType: claim.claimCover ?? "",
			spouseName: claim.spouseName ?? "",
			medicalAdvanceAmount: String(claim.medicalAdvanceTaken ?? ""),
			companySettledAmount: String(claim.alreadySettled ?? ""),
		}
	);
};

const mapMedicalClaimLineItems = (
	claim?: MedicalClaimFormSource,
): ClaimHeadRow[] =>
	claim?.lineItems?.map(mapPublicLineItem) ??
	claim?.bills?.map(mapPublicBillToLineItem) ??
	[];

const appendText = (
	formData: FormData,
	name: string,
	value: string | number | boolean | null | undefined,
): void => {
	if (value === undefined || value === null) return;
	formData.append(name, String(value));
};

const appendNonBlankText = (
	formData: FormData,
	name: string,
	value: string | number | null | undefined,
): void => {
	if (value === undefined || value === null || String(value).trim() === "") {
		return;
	}
	formData.append(name, String(value));
};

const resolvePatientName = (values: ReimbursementClaimFormValues): string => {
	const explicitPatientName = values.patientName?.trim();
	if (explicitPatientName) return explicitPatientName;
	if (values.coverageType === "SPOUSE") return values.spouseName.trim();
	return values.employeeName.trim();
};

const appendClaimFields = (
	formData: FormData,
	submission: ReimbursementClaimSubmission,
	publicClaim?: PublicClaimShape,
): void => {
	const { values } = submission;
	appendText(formData, "grade", values.grade);
	appendText(formData, "location", values.location);
	appendText(formData, "patientName", resolvePatientName(values));
	appendText(formData, "claimCover", values.coverageType);
	appendText(formData, "spouseName", values.spouseName);
	appendNonBlankText(
		formData,
		"medicalAdvanceTaken",
		values.medicalAdvanceAmount ?? publicClaim?.medicalAdvanceTaken,
	);
	appendText(formData, "mobile", publicClaim?.mobile ?? "");
	appendText(formData, "email", publicClaim?.email ?? "");
};

const buildSubmitFormData = (
	submission: ReimbursementClaimSubmission,
	publicClaim?: PublicClaimShape,
): FormData => {
	const formData = new FormData();
	appendClaimFields(formData, submission, publicClaim);
	appendText(
		formData,
		"signatureDate",
		submission.values.claimDate
			? `${submission.values.claimDate}T00:00:00.000Z`
			: "",
	);
	appendText(
		formData,
		"declarationAccepted",
		submission.values.declarationAccepted,
	);
	appendText(
		formData,
		"signatureName",
		submission.values.employeeSignature?.trim() ||
			submission.values.employeeName.trim(),
	);

	const files: File[] = [];
	const bills = submission.lineItems.map((item, index) => {
		const amount = Number(item.amount);
		if (!Number.isFinite(amount) || amount <= 0) {
			throw new Error(`Bill #${index + 1} must have a valid amount.`);
		}

		const attachmentIndex = item.file ? files.push(item.file) - 1 : null;
		return {
			id: item.id,
			claimHead: item.claimHead,
			billNo: item.billNumber.trim(),
			billName: item.billName.trim(),
			billDate: item.billDate || undefined,
			amount,
			attachmentIndex,
		};
	});

	formData.append("bills", JSON.stringify(bills));
	files.forEach((file) => formData.append("billAttachments", file, file.name));
	return formData;
};

const buildDraftFormData = (
	submission: ReimbursementClaimSubmission,
	publicClaim?: PublicClaimShape,
): FormData => {
	const formData = new FormData();
	appendClaimFields(formData, submission, publicClaim);

	const files: File[] = [];
	const bills = submission.lineItems.map((item) => {
		const attachmentIndex = item.file ? files.push(item.file) - 1 : null;
		return {
			id: item.id,
			claimHead: item.claimHead,
			billNo: item.billNumber.trim(),
			billName: item.billName.trim(),
			billDate: item.billDate || undefined,
			amount: Number(item.amount) || 0,
			attachmentIndex,
		};
	});

	formData.append("bills", JSON.stringify(bills));
	files.forEach((file) => formData.append("billAttachments", file, file.name));
	return formData;
};

const ReimbursementClaimPublicPage = ({
	initialValues,
	submitClaim,
	saveDraft,
}: ReimbursementClaimPublicPageProps) => {
	const navigate = useNavigate();
	const { token: pathToken = "" } = useParams<{ token?: string }>();
	const [searchParams] = useSearchParams();
	const normalizedToken = (pathToken || searchParams.get("token") || "").trim();
	const [resolvedToken] = React.useState(() => {
		if (normalizedToken) {
			saveSessionCode(normalizedToken);
			return normalizedToken;
		}
		return getSavedSessionCode();
	});
	const [submitted, setSubmitted] = React.useState(false);

	React.useEffect(() => {
		if (normalizedToken) saveSessionCode(normalizedToken);
	}, [normalizedToken]);

	const claimQuery = usePublicMedicalClaimQuery(
		resolvedToken,
		!initialValues && Boolean(resolvedToken),
	);
	const submitMutation = useSubmitPublicMedicalClaimMutation();
	const draftMutation = useSavePublicMedicalClaimDraftMutation();

	React.useEffect(() => {
		if (!submitted) return;
		const timerId = window.setTimeout(() => {
			clearSessionCode();
		}, PUBLIC_SESSION_END_DELAY_MS);
		return () => window.clearTimeout(timerId);
	}, [navigate, submitted]);

	const publicClaim = claimQuery.data as unknown as
		| PublicClaimShape
		| undefined;
	const resolvedInitialValues = React.useMemo(
		() => initialValues ?? mapMedicalClaimValues(publicClaim),
		[initialValues, publicClaim],
	);
	const resolvedInitialLineItems = React.useMemo(
		() => mapMedicalClaimLineItems(publicClaim),
		[publicClaim],
	);

	const handleSubmit = async (
		submission: ReimbursementClaimSubmission,
	): Promise<void> => {
		if (submitClaim) {
			await submitClaim(submission);
		} else {
			if (!resolvedToken) {
				throw new Error("The medical claim link is invalid or incomplete.");
			}
			await submitMutation.mutateAsync({
				token: resolvedToken,
				formData: buildSubmitFormData(submission, publicClaim),
			});
		}
		setSubmitted(true);
	};

	const handleSaveDraft = async (
		submission: ReimbursementClaimSubmission,
	): Promise<void> => {
		if (saveDraft) {
			await saveDraft(submission);
			return;
		}
		if (!resolvedToken) {
			throw new Error("The medical claim link is invalid or incomplete.");
		}
		await draftMutation.mutateAsync({
			token: resolvedToken,
			formData: buildDraftFormData(submission, publicClaim),
		});
	};

	if (!initialValues && !resolvedToken) {
		return <Navigate to="/medical-claim/invalid-link" replace />;
	}

	if (!initialValues && claimQuery.isLoading) {
		return (
			<PublicPagesLayout className="public-page-status">
				<Card padding="spacious">
					<div aria-busy="true" className="public-page-status-content">
						<span aria-hidden="true" className="public-page-status-spinner" />
						<div>
							<h2 className="public-page-status-title">
								Validating medical claim link
							</h2>
							<p className="public-page-status-description" role="status">
								We are confirming that this medical claim link is valid.
							</p>
						</div>
					</div>
				</Card>
			</PublicPagesLayout>
		);
	}

	if (!initialValues && claimQuery.isError) {
		return (
			<PublicPagesLayout className="public-page-status">
				<Card padding="spacious">
					<div className="public-page-status-content" role="alert">
						<div>
							<h2 className="public-page-status-title">
								Link validation failed
							</h2>
							<p className="public-page-status-description">
								The medical claim link is invalid or no longer available.
							</p>
						</div>
					</div>
				</Card>
			</PublicPagesLayout>
		);
	}

	if (submitted) {
		return (
			<PublicPagesLayout className="public-page-status">
				<Card padding="spacious">
					<div className="public-page-status-content" role="status">
						<div>
							<h2 className="public-page-status-title">Claim submitted</h2>
							<p className="public-page-status-description">
								Tata Hitachi will review the information provided. Guest login
								credentials will be sent to you so you can track progress and
								update the claim if clarification is requested. This secure
								session will close automatically.
							</p>
						</div>
					</div>
				</Card>
			</PublicPagesLayout>
		);
	}

	return (
		<PublicPagesLayout>
			<ReimbursementClaimForm
				mode="edit"
				initialValues={resolvedInitialValues}
				initialLineItems={resolvedInitialLineItems}
				actionText="Submit Claim"
				onSubmit={handleSubmit}
				onSaveDraft={handleSaveDraft}
			/>
		</PublicPagesLayout>
	);
};

export default ReimbursementClaimPublicPage;
