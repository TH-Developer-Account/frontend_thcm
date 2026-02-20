import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/Auth/useAuth";
import { API_BASE_URL } from "../../../services/ServerAxios";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/FormElements/FormInput";
import OtpInput from "../../../components/FormElements/OtpInput";
import { MOBILE_REGEX, api_routes } from "../../Login/constant";
import { useToast } from "../../../context/Auth/AuthContext";

type MobileStep = "enterMobile" | "verifyOtp";

const MobileLoginForm = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [mobileStep, setMobileStep] = useState<MobileStep>("enterMobile");
  const [isResendOtp, setIsResendOtp] = useState(false);
  const [otpTimerActive, setOtpTimerActive] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [state, setState] = useState({
    loading: false,
    mobile: "",
    otp: "",
    error: "",
    otpTimer: "",
  });
  const { showToast } = useToast();

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
      await axios.post(`${API_BASE_URL}${api_routes.send_otp}`, {
        phone_number: state.mobile,
      });
      setMobileStep("verifyOtp");
      showToast({
        type: "success",
        title: "Success",
        description: "OTP sent successfully",
      });
    } catch (err: unknown) {
      console.error("OTP verification error:", err);

      let message = "User not found";

      if (axios.isAxiosError(err)) {
        // API responded with an error message
        message =
          err.response?.data?.message || err.message || "Something went wrong";
      } else if (err instanceof Error) {
        message = err.message;
      }

      showToast({
        type: "error",
        title: "Error",
        description: message,
      });
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
      const response = await axios.post(
        `${API_BASE_URL}${api_routes.verify_otp}`,
        {
          phone_number: state.mobile,
          otp: state.otp,
        },
      );

      const { user, accessToken } = response.data;
      localStorage.setItem("authToken", accessToken);
      setUser(user);
      navigate("/");
      showToast({
        type: "success",
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (err: unknown) {
      console.error("OTP verification error:", err);

      let message = "Invalid OTP";

      if (axios.isAxiosError(err)) {
        // API responded with an error message
        message =
          err.response?.data?.message || err.message || "Something went wrong";
      } else if (err instanceof Error) {
        message = err.message;
      }

      showToast({
        type: "error",
        title: "Error",
        description: message,
      });
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  // Resend OTP Functionality
  const handleResendOTP = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsResendOtp(true);
    if (!MOBILE_REGEX.test(state.mobile)) {
      setState((prev) => ({
        ...prev,
        error: "Enter a valid 10-digit mobile number",
      }));
      return;
    }
    try {
      setState((prev) => ({ ...prev, loading: true }));
      await axios.post(`${API_BASE_URL}${api_routes.send_otp}`, {
        phone_number: state.mobile,
      });
      setMobileStep("verifyOtp");
      showToast({
        type: "success",
        title: "Success",
        description: "OTP sent successfully",
      });
    } catch (err: unknown) {
      console.error("OTP verification error:", err);

      let message = "User not found";

      if (axios.isAxiosError(err)) {
        // API responded with an error message
        message =
          err.response?.data?.message || err.message || "Something went wrong";
      } else if (err instanceof Error) {
        message = err.message;
      }

      showToast({
        type: "error",
        title: "Error",
        description: message,
      });
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleVerifyResendOtp = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    if (state.otp.length !== 6) {
      setState((prev) => ({ ...prev, error: "Enter valid OTP" }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true }));
      const response = await axios.post(
        `${API_BASE_URL}${api_routes.verify_otp}`,
        {
          phone_number: state.mobile,
          otp: state.otp,
        },
      );

      const { user, accessToken } = response.data;
      localStorage.setItem("authToken", accessToken);
      setUser(user);
      navigate("/");
      showToast({
        type: "success",
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (err: unknown) {
      console.error("OTP verification error:", err);

      let message = "Invalid OTP";

      if (axios.isAxiosError(err)) {
        // API responded with an error message
        message =
          err.response?.data?.message || err.message || "Something went wrong";
      } else if (err instanceof Error) {
        message = err.message;
      }

      showToast({
        type: "error",
        title: "Error",
        description: message,
      });
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <React.Fragment>
      {mobileStep === "enterMobile" && (
        <form className="space-y-4">
          <FormInput
            name="mobile"
            label="Mobile Number"
            placeholder="Enter your mobile number"
            value={state.mobile}
            onChange={handleMobileChange}
            error={state.error}
            required
          />
          <Button
            text="Continue"
            disabled={!MOBILE_REGEX.test(state.mobile)}
            onClick={handleContinue}
            fullWidth
          />
        </form>
      )}

      {mobileStep === "verifyOtp" && (
        <form className="space-y-4">
          <div className="text-sm text-gray-600">
            Enter the OTP sent to{" "}
            <span className="font-semibold">{state.mobile}</span>
          </div>

          <OtpInput
            length={6}
            onChange={handleOtpChange}
            onTimerChange={(seconds, active) => {
              setSecondsLeft(seconds);
              setOtpTimerActive(active);
            }}
          />

          {isResendOtp ? (
            <Button
              text="Verify OTP"
              onClick={handleVerifyResendOtp}
              fullWidth
            />
          ) : (
            <Button text="Verify OTP" onClick={handleVerifyOtp} fullWidth />
          )}
          <div className="">
            <span className="text-xs">
              Didn't recieve a code?{" "}
              <button
                type="button"
                className="text-xs  hover:underline text-center cursor-pointer mb-1 brand"
                onClick={handleResendOTP}
                disabled={otpTimerActive}
              >
                {otpTimerActive ? `Resend in ${secondsLeft}s` : "Resend OTP"}
              </button>
            </span>

            <br />
            <button
              type="button"
              className="text-sm  hover:underline text-center cursor-pointer mt-0 brand"
              onClick={() => {
                setMobileStep("enterMobile");
                setState((prev) => ({
                  ...prev,
                  mobile: "",
                  otp: "",
                  error: "",
                  otpTimer: "",
                }));
              }}
            >
              Change mobile number
            </button>
          </div>
        </form>
      )}
    </React.Fragment>
  );
};
export default MobileLoginForm;
