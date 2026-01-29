import { AuthLayout } from "../layout/AuthLayout";
import { useState } from "react";
import { EmailLoginForm } from "../components/authforms/EmailLoginForm";
import { MobileLoginForm } from "../components/authforms/MobileLoginForm";

type Tab = "email" | "mobile";
type MobileStep = "enterMobile" | "verifyOtp";

export const LoginLayout = () => {
  const [activeTab, setActiveTab] = useState<Tab>("email");
  const [mobileStep, setMobileStep] = useState<MobileStep>("enterMobile");

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "mobile") {
      setMobileStep("enterMobile");
    }
  };
  
  
  return (
    <AuthLayout>
      <div className="logos flex justify-center mb-8">
        <img src="/th-brand-logo.png" alt="logo" className="text-center w-[120px]"/>
      </div>

      {/* Tabs */}
      <div className="flex mb-6 border-b border-gray-200">
        <button
          className={`flex-1 py-2 font-bold text-sm  transition-colors duration-00 ease-in-out cursor-pointer ${
            activeTab === "email"
              ? "text-gray-900 border-b-2 border-[#f35a00]"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => handleTabChange("email")}
        >
          Email Login
        </button>
        <button
          className={`flex-1 py-2 font-bold text-sm transition-colors duration-200 ease-in-out cursor-pointer ${
            activeTab === "mobile"
              ? "text-gray-900 border-b-2 border-[#f35a00]"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => handleTabChange("mobile")}
        >
          Mobile Login
        </button>
      </div>

      {/* Email Login Form */}
      {activeTab === "email" && (
       <EmailLoginForm />
      )}

      {/* Mobile Login Form */}
      {activeTab === "mobile" && (
       <MobileLoginForm />
      )}

      {/* Sign Up Link */}
      <p className="text-sm text-gray-500 text-center mt-6">
        Don’t have an account?{" "}
        <a href="#" className="text-blue-600 hover:underline">
          Sign up
        </a>
      </p>
      {/* <div className="errorMessage">
        {mobileError && <p className="text-red-500 text-sm mt-2">{mobileError}</p>}
      </div> */}
    </AuthLayout>
  );
};