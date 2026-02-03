import React, { useState } from "react";
import OtpInput from "../../../components/FormElements/OtpInput";
import Button from "../../../components/common/Button";
import { api_routes } from "../constant";

interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  token?: string;
}

const VerifyOTPForm: React.FC = () => {
  const [otp, setOtp] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleOtpChange = (value: string) => {
    setOtp(value);
    setError("");
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      console.log("Please enter a valid 6-digit OTP")
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(api_routes.verify_otp_api_route, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp }),
      });

      const data: VerifyOtpResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "OTP verification failed");
      }

      console.log("OTP verified successfully");
      console.log("Token:", data.token);

      // 👉 Example actions after success
      // localStorage.setItem("token", data.token!)
      // navigate("/dashboard")

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="form-head flex flex-col items-center text-center">
        <div className="logos flex justify-center items-center mb-4">
          <img
            src="src/assets/sendlink.png"
            alt="logo"
            className="text-center w-[100px]"
          />
        </div>

        <h2 className="text-2xl font-semibold text-gray-900">
          Verify your OTP
        </h2>
        <p>Enter your six-digit OTP</p>
      </div>

      <OtpInput length={6} onChange={handleOtpChange} error={error}/>
      <Button
        text={loading ? "Verifying..." : "Continue"}
        disabled={loading}
        type="submit"
      />
    </form>
  );
};

export default VerifyOTPForm;
