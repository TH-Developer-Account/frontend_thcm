import { useState } from "react";

import { AuthLayout } from "../../../layout/AuthLayout";
import EmailLoginForm from "../authforms/EmailLoginForm";
import MobileLoginForm from "../authforms/MobileLoginForm";

type LoginTab = "email" | "mobile";

const LoginPage = () => {
	const [activeTab, setActiveTab] = useState<LoginTab>("email");

	return (
		<AuthLayout
			eyebrow="Secure access"
			title="Control every operation from one system"
			description="Access marketing, administration, master data, dealer, and service workflows from a unified enterprise platform."
		>
			<header className="auth-form-header">
				<div className="auth-mobile-logo">
					<img src="/th-brand-logo.png" alt="Tata Hitachi" />
				</div>

				<p className="auth-form-eyebrow">Welcome back</p>

				<h2 className="auth-form-title">Sign in to your account</h2>

				<p className="auth-form-description">
					Enter your registered credentials to continue.
				</p>
			</header>

			<div className="auth-tabs" role="tablist" aria-label="Login method">
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === "email"}
					className={[
						"auth-tab",
						activeTab === "email" ? "auth-tab-active" : "",
					]
						.filter(Boolean)
						.join(" ")}
					onClick={() => setActiveTab("email")}
				>
					Email
				</button>

				<button
					type="button"
					role="tab"
					aria-selected={activeTab === "mobile"}
					className={[
						"auth-tab",
						activeTab === "mobile" ? "auth-tab-active" : "",
					]
						.filter(Boolean)
						.join(" ")}
					onClick={() => setActiveTab("mobile")}
				>
					Mobile
				</button>
			</div>

			<div className="auth-tab-panel">
				{activeTab === "email" ? <EmailLoginForm /> : <MobileLoginForm />}
			</div>
		</AuthLayout>
	);
};

export default LoginPage;
