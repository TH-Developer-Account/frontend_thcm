import { useState } from "react";

import { AuthLayout } from "../../../layout/AuthLayout";
import GuestEmailLoginForm from "../authforms/GuestEmailLoginForm";
import GuestMobileLoginForm from "../authforms/GuestMobileLoginForm";
import { AuthMethodTabs, type AuthMethod } from "../components/AuthMethodTabs";
import logo from "../../../assets/thcm-logo/th-brand-logo.png";

const GuestLoginPage = () => {
  const [activeTab, setActiveTab] = useState<AuthMethod>("email");

  return (
    <AuthLayout
      eyebrow="Secure access"
      title="Control every operation from one system"
      description="Access marketing, administration, master data, dealer, and service workflows from a unified enterprise platform."
    >
      <header className="auth-form-header">
        <div className="auth-mobile-logo">
          <img src={logo} alt="Tata Hitachi" />
        </div>

        <p className="auth-form-eyebrow">Welcome back</p>

        <h1 className="auth-form-title">Sign in to your account</h1>

        <p className="auth-form-description">
          Enter your registered credentials to continue.
        </p>
      </header>

      <AuthMethodTabs value={activeTab} onChange={setActiveTab}>
        {activeTab === "email" ? (
          <GuestEmailLoginForm />
        ) : (
          <GuestMobileLoginForm />
        )}
      </AuthMethodTabs>
    </AuthLayout>
  );
};

export default GuestLoginPage;
