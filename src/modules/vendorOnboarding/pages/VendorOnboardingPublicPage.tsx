import * as React from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import PublicPagesLayout from "../../../layout/PublicPagesLayout";
import VendorCreationFormOne from "../forms/VendorCreationFormOne";
import { useVendorCreationForm } from "../hooks/useVendorCreationForm";
import Card from "../../../components/common/Card";

const PUBLIC_VENDOR_SESSION_KEY = "vendor-onboarding-session-code";
const PUBLIC_SESSION_END_DELAY_MS = 2500;

const getSavedSessionCode = (): string => {
	if (typeof window === "undefined") {
		return "";
	}

	return window.sessionStorage.getItem(PUBLIC_VENDOR_SESSION_KEY)?.trim() ?? "";
};

const saveSessionCode = (token: string): void => {
	if (typeof window === "undefined" || !token) {
		return;
	}

	window.sessionStorage.setItem(PUBLIC_VENDOR_SESSION_KEY, token);
};

const clearSessionCode = (): void => {
	if (typeof window === "undefined") {
		return;
	}

	window.sessionStorage.removeItem(PUBLIC_VENDOR_SESSION_KEY);
};

const VendorOnboardingPublicPage = () => {
	const navigate = useNavigate();

	const { token } = useParams<{
		token?: string;
	}>();

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
		if (!normalizedToken) {
			return;
		}

		saveSessionCode(normalizedToken);
	}, [normalizedToken]);
	const {
		formOneValues,
		formOneErrors,
		mutationLoading,
		isLoading,
		isError,
		handleFormOneChange,
		handleVendorSubmitForm,
	} = useVendorCreationForm({
		role: "EXTERNAL_VENDOR",
		isPublicForm: true,
		token: resolvedToken,
		onSuccess: () => {
			setSubmitted(true);
		},
	});

	React.useEffect(() => {
		if (!submitted) {
			return;
		}

		const timerId = window.setTimeout(() => {
			clearSessionCode();

			navigate("/vendor-form/submitted", {
				replace: true,
			});
		}, PUBLIC_SESSION_END_DELAY_MS);

		return () => {
			window.clearTimeout(timerId);
		};
	}, [navigate, submitted]);

	if (!resolvedToken) {
		return <Navigate to="/vendor-form/invalid-link" replace />;
	}

	if (isLoading) {
		return (
			<PublicPagesLayout className="public-page-status">
				<Card
					padding="spacious"
					// title={!children ? showHeader && title : null}
					// subtitle={!children ? showHeader && description : null}
				>
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

	if (isError) {
		return (
			<PublicPagesLayout className="public-page-status">
				<Card padding="spacious">
					<div className="public-page-status-content" role="alert">
						<div>
							<h2 className="public-page-status-title">
								Link validation failed
							</h2>

							<p className="public-page-status-description">
								The vendor onboarding validation request failed. Check the
								browser Network tab for the exact response.
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
			<VendorCreationFormOne
				mode="edit"
				canEdit
				values={formOneValues}
				errors={formOneErrors}
				onChange={handleFormOneChange}
				onSubmit={handleVendorSubmitForm}
				loading={mutationLoading}
			/>
		</PublicPagesLayout>
	);
};

export default VendorOnboardingPublicPage;
