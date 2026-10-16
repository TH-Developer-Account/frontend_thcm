import * as React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, LoaderCircle, Mail, TriangleAlert } from "lucide-react";

import PublicPageStatusCard from "../../../components/common/PublicPageStatusCard";
import PublicPagesLayout from "../../../layout/PublicPagesLayout";
import ReimbursementClaimForm from "../components/ReimbursementClaimForm";
import type {
	ReimbursementClaimFormValues,
	ReimbursementClaimSubmission,
} from "../types/reimbursementClaim.types";
import {
	usePublicMedicalClaimQuery,
	useSavePublicMedicalClaimDraftMutation,
	useSubmitPublicMedicalClaimMutation,
} from "../hooks/useMedicalClaimMutations";
import { useMedicalClaimPermissions } from "../hooks/useMedicalClaimPermissions";
import { useGradeOptions } from "../hooks/useGradeOptions";
import { getPublicPageStatusContent } from "../../../content/publicPageStatus.content";
import { buildMedicalClaimFormData } from "../helpers/reimbursementClaimForm.helper";
import {
	deriveAnnualCap,
	toMedicalClaimFormValues,
	toMedicalClaimLineItems,
} from "../helpers/medicalClaimListing.mapper";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { normalizeIndianMobile } from "../../guest/guestAuth/guestLogin.schemas";

/** Shown in the middle of the public header (not in the form card). */
const PAGE_TITLE = "Non-Hospitalization Reimbursement Claim Form";

/** Guest portal login (router path, so it works on every host/basename). */
const GUEST_LOGIN_PATH = "/guest/login";

const PUBLIC_MEDICAL_CLAIM_SESSION_KEY = "medical-claim-session-code";
const PUBLIC_SESSION_END_DELAY_MS = 2500;

const statusContent = getPublicPageStatusContent("medicalClaim");

// sessionStorage can throw (private mode, blocked storage) — never let that
// break the page; the token in the URL is the primary source anyway.
const getSavedSessionCode = (): string => {
	try {
		return (
			window.sessionStorage.getItem(PUBLIC_MEDICAL_CLAIM_SESSION_KEY)?.trim() ??
			""
		);
	} catch {
		return "";
	}
};

const saveSessionCode = (token: string): void => {
	try {
		if (token)
			window.sessionStorage.setItem(PUBLIC_MEDICAL_CLAIM_SESSION_KEY, token);
	} catch {
		/* ignore */
	}
};

const clearSessionCode = (): void => {
	try {
		window.sessionStorage.removeItem(PUBLIC_MEDICAL_CLAIM_SESSION_KEY);
	} catch {
		/* ignore */
	}
};

interface ReimbursementClaimPublicPageProps {
	/** Storybook / tests: render without the API. */
	initialValues?: Partial<ReimbursementClaimFormValues>;
	submitClaim?: (
		submission: ReimbursementClaimSubmission,
	) => void | Promise<void>;
	saveDraft?: (
		submission: ReimbursementClaimSubmission,
	) => void | Promise<void>;
}

/**
 * First-touch claim form for the retired employee (emailed link
 * /medical-claim-form/:token). They fill + save drafts + submit; they never
 * see or touch line-item review columns.
 */
const ReimbursementClaimPublicPage = ({
	initialValues,
	submitClaim,
	saveDraft,
}: ReimbursementClaimPublicPageProps) => {
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

	const isStandalone = Boolean(initialValues);

	const claimQuery = usePublicMedicalClaimQuery(
		resolvedToken,
		!isStandalone && Boolean(resolvedToken),
	);
	const submitMutation = useSubmitPublicMedicalClaimMutation();
	const draftMutation = useSavePublicMedicalClaimDraftMutation();

	React.useEffect(() => {
		if (!submitted) return;
		const timerId = window.setTimeout(
			clearSessionCode,
			PUBLIC_SESSION_END_DELAY_MS,
		);
		return () => window.clearTimeout(timerId);
	}, [submitted]);

	const publicClaim = claimQuery.data;

	const permissions = useMedicalClaimPermissions({
		context: "public",
		status: publicClaim?.status,
	});

	const { gradeOptions } = useGradeOptions(
		{ kind: "public", token: resolvedToken },
		{ grade: publicClaim?.grade, derivedCap: deriveAnnualCap(publicClaim) },
		!isStandalone,
	);

	const resolvedInitialValues = React.useMemo(
		() =>
			initialValues ??
			(publicClaim ? toMedicalClaimFormValues(publicClaim) : undefined),
		[initialValues, publicClaim],
	);
	const resolvedInitialLineItems = React.useMemo(
		() => (publicClaim ? toMedicalClaimLineItems(publicClaim) : []),
		[publicClaim],
	);

	// The backend creates the guest login from these on submit and later
	// matches OTP / password logins EXACTLY — so send the same normalised
	// form the login screen sends (10-digit mobile, lower-case email).
	const contact = React.useMemo(
		() => ({
			mobile: publicClaim?.mobile
				? normalizeIndianMobile(publicClaim.mobile)
				: publicClaim?.mobile,
			email: publicClaim?.email?.trim().toLowerCase() ?? publicClaim?.email,
		}),
		[publicClaim?.email, publicClaim?.mobile],
	);

	const ensureToken = () => {
		if (!resolvedToken) {
			throw new Error("The medical claim link is invalid or incomplete.");
		}
	};

	const handleSubmit = async (submission: ReimbursementClaimSubmission) => {
		if (submitClaim) {
			await submitClaim(submission);
		} else {
			ensureToken();
			if (!contact.mobile?.trim()) {
				throw new Error(
					"Your mobile number is missing from this claim. Please contact HR to update it, then use the link again.",
				);
			}
			await submitMutation.mutateAsync({
				token: resolvedToken,
				formData: buildMedicalClaimFormData(submission, {
					mode: "submit",
					contact,
					existingBills: publicClaim?.bills,
				}),
			});
		}
		setSubmitted(true);
	};

	const handleSaveDraft = async (submission: ReimbursementClaimSubmission) => {
		if (saveDraft) {
			await saveDraft(submission);
			return;
		}
		ensureToken();
		await draftMutation.mutateAsync({
			token: resolvedToken,
			formData: buildMedicalClaimFormData(submission, {
				mode: "draft",
				contact,
				existingBills: publicClaim?.bills,
			}),
		});
	};

	if (submitted) {
		return (
			<PublicPagesLayout className="public-page-status" title={PAGE_TITLE}>
				<PublicPageStatusCard
					variant="success"
					Icon={CheckCircle2}
					title={statusContent.submitted.title}
					description={statusContent.submitted.description}
					notice={{
						title: statusContent.submitted.noticeTitle,
						description:
							"Your guest portal login details are emailed to you after your first claim. Log in to track this claim and reply if HR asks for clarification.",
						Icon: Mail,
					}}
					securityNote={statusContent.submitted.securityNote}
					// After submitting, the ex-employee tracks the claim in the guest
					// portal (login details are emailed on the first submit).
					action={{
						label: "Log in to track your claim",
						to: GUEST_LOGIN_PATH,
					}}
					role="status"
				/>
			</PublicPagesLayout>
		);
	}

	if (!isStandalone && !resolvedToken) {
		return (
			<PublicPagesLayout className="public-page-status" title={PAGE_TITLE}>
				<PublicPageStatusCard
					variant="warning"
					Icon={TriangleAlert}
					title={statusContent.linkInvalid.title}
					description={statusContent.linkInvalid.description}
					help={statusContent.linkInvalid.help}
					role="alert"
				/>
			</PublicPagesLayout>
		);
	}

	if (!isStandalone && claimQuery.isLoading) {
		return (
			<PublicPagesLayout className="public-page-status" title={PAGE_TITLE}>
				<PublicPageStatusCard
					variant="loading"
					Icon={LoaderCircle}
					title={statusContent.validating.title}
					description={statusContent.validating.description}
					role="status"
					ariaBusy
				/>
			</PublicPagesLayout>
		);
	}

	if (!isStandalone && (claimQuery.isError || !publicClaim)) {
		// The backend explains why ("already used — log in instead", "invalid").
		return (
			<PublicPagesLayout className="public-page-status" title={PAGE_TITLE}>
				<PublicPageStatusCard
					variant="warning"
					Icon={TriangleAlert}
					title={statusContent.linkInvalid.title}
					description={getApiErrorMessage(
						claimQuery.error,
						statusContent.linkInvalid.description,
					)}
					help={statusContent.linkInvalid.help}
					action={{ label: "Go to guest login", to: GUEST_LOGIN_PATH }}
					role="alert"
				/>
			</PublicPagesLayout>
		);
	}

	return (
		<PublicPagesLayout title={PAGE_TITLE}>
			<ReimbursementClaimForm
				referenceNumber={publicClaim?.referenceNumber}
				mode={permissions.mode}
				canEdit={permissions.canEditClaim}
				actorRole={permissions.actorRole}
				canApprove={false}
				canClarify={false}
				canReviewLineItems={false}
				hideReviewColumns={permissions.hideReviewColumns}
				gradeOptions={gradeOptions}
				initialValues={resolvedInitialValues}
				initialLineItems={resolvedInitialLineItems}
				statusLabel={publicClaim?.status}
				actionText="Submit Claim"
				submitSuccessMessage="Your medical claim has been submitted for approval."
				onSubmit={permissions.canSubmit ? handleSubmit : undefined}
				onSaveDraft={permissions.canSaveDraft ? handleSaveDraft : undefined}
			/>
		</PublicPagesLayout>
	);
};

export default ReimbursementClaimPublicPage;
