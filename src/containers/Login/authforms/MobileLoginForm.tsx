import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/useAuth";
import ServerAxios from "../../../services/ServerAxios";
import { Button } from "../../../components/common/Button";
import FormInput from "../../../components/FormElements/FormInput";
import OtpInput from "../../../components/FormElements/OtpInput";
import { MOBILE_REGEX } from "../../Login/constant";

type MobileStep = "enterMobile" | "verifyOtp";

export const MobileLoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mobileStep, setMobileStep] = useState<MobileStep>("enterMobile");
  const [state, setState] = useState({
    loading: false,
    mobile: "",
    otp: "",
    error: "",
  });

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({
      ...prev,
      mobile: e.target.value,
      error: "", // clear error when user types
    }));
  };

  const handleOtpChange = (value: string) => {
    setState((prev) => ({ ...prev, otp: value }));
  };

  const handleContinue = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!MOBILE_REGEX.test(state.mobile)) {
      setState((prev) => ({
        ...prev,
        error: "Enter a valid 10-digit mobile number",
      }));
      return;
    }
    try {
      setState((prev) => ({ ...prev, loading: true }));
      await ServerAxios.post("/auth/mobile/send-otp", { mobile: state.mobile });
      setMobileStep("verifyOtp");
    } catch (err) {
      console.error("Send OTP error:", err);
      setState((prev) => ({
        ...prev,
        error: "Failed to send OTP",
      }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleVerifyOtp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (state.otp.length !== 6) {
      setState((prev) => ({ ...prev, error: "Enter valid OTP" }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true }));
      const response = await ServerAxios.post("/verify-otp", {
        mobile: state.mobile,
        otp: state.otp,
      });

      const { user, accessToken } = response.data;

      // 🔥 save globally
      login(user, accessToken);

      navigate("/");
    } catch (err: unknown) {
      console.error("OTP verification error:", err);
      setState((prev) => ({
        ...prev,
        error: "Invalid OTP",
      }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <>
      {mobileStep === "enterMobile" && (
        <form className="space-y-4">
          <FormInput
            name="mobile"
            label="Mobile Number"
            placeholder="Enter your mobile number"
            value={state.mobile}
            onChange={handleMobileChange}
            error={state.error}
          />
          <Button
            text="Continue"
            disabled={!MOBILE_REGEX.test(state.mobile)}
            onClick={handleContinue}
          />
        </form>
      )}

      {mobileStep === "verifyOtp" && (
        <form className="space-y-4">
          <div className="text-sm text-gray-600">
            Enter the OTP sent to{" "}
            <span className="font-semibold">{state.mobile}</span>
          </div>

          <OtpInput length={6} onChange={handleOtpChange} />

          <Button text="Verify OTP" onClick={handleVerifyOtp} />

          <button
            type="button"
            className="text-sm text-blue-600 hover:underline text-center"
            onClick={() => setMobileStep("enterMobile")}
          >
            Change mobile number
          </button>
        </form>
      )}
    </>
  );
};
