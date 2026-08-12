import * as React from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import Card from "../../../components/common/Card";
import PublicPagesLayout from "../../../layout/PublicPagesLayout";
import VendorCreationFormOne from "../../vendorOnboarding/forms/VendorCreationFormOne";
import { usePublicVendorOnboardingForm } from "./usePublicVendorOnboardingForm";

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

	const form = usePublicVendorOnboardingForm({
		token: resolvedToken,
		onSubmitted: () => setSubmitted(true),
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
				<Card padding="spacious">
					<div aria-busy="true" className="public-page-status-content">
						<span aria-hidden="true" className="public-page-status-spinner" />
						<div>
							<h2 className="public-page-status-title">
								Validating onboarding link
							</h2>
							<p className="public-page-status-description" role="status">
								We are confirming that this vendor onboarding link is valid.
							</p>
						</div>
					</div>
				</Card>
			</PublicPagesLayout>
		);
	}

	if (form.isError) {
		return (
			<PublicPagesLayout className="public-page-status">
				<Card padding="spacious">
					<div className="public-page-status-content" role="alert">
						<div>
							<h2 className="public-page-status-title">
								Link validation failed
							</h2>
							<p className="public-page-status-description">
								The vendor onboarding link is invalid or no longer available.
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
							<h2 className="public-page-status-title">Form submitted</h2>
							<p className="public-page-status-description">
								Tata Hitachi will review the information provided. This secure
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
			<Card>
				<VendorCreationFormOne
					mode="edit"
					canEdit
					values={form.formOneValues}
					errors={form.formOneErrors}
					initialDocuments={form.documents}
					requireDocuments
					requireDpdpConsent
					loading={form.mutationLoading}
					onChange={form.handleFormOneChange}
					onSubmit={form.handleSubmit}
					onSaveDraft={form.handleSaveDraft}
				/>
			</Card>
		</PublicPagesLayout>
	);
};

export default VendorOnboardingPublicPage;
