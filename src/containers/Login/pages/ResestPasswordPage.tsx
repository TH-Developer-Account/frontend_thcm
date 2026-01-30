import { AuthLayout } from "../../../layout/AuthLayout";
import { ResetPasswordForm } from "../authforms/ResetPasswordForm";
// import { useState } from "react";

export const ResetPasswordPage = () => {

  return (
    <AuthLayout>
      <h2 className="mb-4 text-xl md:text-xl font-semibold tracking-tight text-gray-900">Reset your Password</h2>
      <ResetPasswordForm />
    </AuthLayout>
  );
};
