import * as React from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, LoaderCircle, Mail, TriangleAlert } from "lucide-react";

import Card from "../../../components/common/Card";
import PublicPageStatusCard from "../../../components/common/PublicPageStatusCard";
import PublicPagesLayout from "../../../layout/PublicPagesLayout";
import VendorCreationFormOne from "../forms/VendorCreationFormOne";
import {
	VendorCreationFormProvider,
	useVendorCreationForm,
} from "../hooks/useVendorCreationForm";
import { getPublicPageStatusContent } from "../../../content/publicPageStatus.content";

const PUBLIC_VENDOR_SESSION_KEY = "vendor-onboarding-session-code";
const PUBLIC_SESSION_END_DELAY_MS = 2500;

const getSavedSessionCode = (): string => {
	if (typeof window === "undefined") return "";
	return window.sessionStorage.getItem(PUBLIC_VENDOR_SESSION_KEY)?.trim() ?? "";
};

const saveSessionCode = (token: string): void => {
	if (typeof window !== "undefined" && token) {
		window.sessionStorage.setItem(PUBLIC_VENDOR_SESSION_KEY, token);
	}
};

const clearSessionCode = (): void => {
	if (typeof window !== "undefined") {
		window.sessionStorage.removeItem(PUBLIC_VENDOR_SESSION_KEY);
	}
};

const statusContent = getPublicPageStatusContent("vendorOnboarding");

const VendorOnboardingPublicPage = () => {
	const navigate = useNavigate();
	const { token } = useParams<{ token?: string }>();
	const normalizedToken = token?.trim() ?? "";
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

	const form = useVendorCreationForm({
		isPublicForm: true,
		token: resolvedToken,
		onSuccess: () => setSubmitted(true),
	});

	React.useEffect(() => {
		if (!submitted) return;

		const timerId = window.setTimeout(() => {
			clearSessionCode();
			navigate("/vendor-form/submitted", { replace: true });
		}, PUBLIC_SESSION_END_DELAY_MS);

		return () => window.clearTimeout(timerId);
	}, [navigate, submitted]);

	if (!resolvedToken) {
		return <Navigate to="/vendor-form/invalid-link" replace />;
	}

	if (form.isLoading) {
		return (
			<PublicPagesLayout className="public-page-status">
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

	if (form.isError) {
		return (
			<PublicPagesLayout className="public-page-status">
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

	if (submitted) {
		return (
			<PublicPagesLayout className="public-page-status">
				<PublicPageStatusCard
					variant="success"
					Icon={CheckCircle2}
					title={statusContent.submitted.title}
					description={statusContent.submitted.description}
					notice={{
						title: statusContent.submitted.noticeTitle,
						description: statusContent.submitted.noticeDescription,
						Icon: Mail,
					}}
					securityNote={statusContent.submitted.securityNote}
					role="status"
				/>
			</PublicPagesLayout>
		);
	}

	return (
		<PublicPagesLayout>
			<Card title="Domestic Vendor Onboarding Form">
				<VendorCreationFormProvider value={form}>
					<VendorCreationFormOne
						mode="edit"
						canEdit
						requireDpdpConsent
						onSubmit={form.handleVendorSubmitForm}
						onSaveDraft={form.handleVendorDraftSubmitForm}
					/>
				</VendorCreationFormProvider>
			</Card>
		</PublicPagesLayout>
	);
};

export default VendorOnboardingPublicPage;
