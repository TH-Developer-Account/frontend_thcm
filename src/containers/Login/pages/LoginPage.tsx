import { useState } from "react";

import { AuthLayout } from "../../../layout/AuthLayout";
import EmailLoginForm from "../authforms/EmailLoginForm";
import MobileLoginForm from "../authforms/MobileLoginForm";
import { AuthMethodTabs, type AuthMethod } from "../components/AuthMethodTabs";

const LoginPage = () => {
	const [activeTab, setActiveTab] = useState<AuthMethod>("email");

	return (
		<AuthLayout
			eyebrow="Secure access"
			title="Control every operation from one system"
			description="Access marketing, administration, master data, dealer, and service workflows from a unified enterprise platform."
		>
			<header className="auth-form-header">
				<p className="auth-form-eyebrow">Welcome back</p>

				<h1 className="auth-form-title">Sign in to your account</h1>

				<p className="auth-form-description">
					Enter your registered credentials to continue.
				</p>
			</header>

			<AuthMethodTabs value={activeTab} onChange={setActiveTab}>
				{activeTab === "email" ? <EmailLoginForm /> : <MobileLoginForm />}
			</AuthMethodTabs>
		</AuthLayout>
	);
};

export default LoginPage;
