import { Button } from "../../../components/common/Button";
import { useState } from "react";
import FormInput from "../../../components/FormElements/FormInput";
import OtpInput from "../../../components/FormElements/OtpInput";

type MobileStep = "enterMobile" | "verifyOtp";

export const MobileLoginForm = () => {
  const [mobileStep, setMobileStep] = useState<MobileStep>("enterMobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [mobileError, setMobileError] = useState("");
  const handleOtpChange = (value: string) => {
    setOtp(value);
  };
  const isValidMobile = (mobile: string) => {
    return /^[6-9]\d{9}$/.test(mobile);
  };

  return (
    <>
      {mobileStep === "enterMobile" && (
        <form className="space-y-4">
          <FormInput
            name="mobile"
            label="Mobile Number"
            placeholder="Enter your mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
          <Button
            text="Continue"
            disabled={!isValidMobile(mobile)}
            onClick={(e) => {
              e.preventDefault();
              setMobile("");
              if (!isValidMobile(mobile)) {
                setMobileError("Enter a valid 10-digit mobile number");
                return;
              }
              setMobileError("");
              setMobileStep("verifyOtp");
            }}
          />
        </form>
      )}
      {mobileStep === "verifyOtp" && (
        <form className="space-y-4">
          <div className="text-sm text-gray-600">
            Enter the OTP sent to{" "}
            <span className="font-semibold">{mobile}</span>
          </div>
          <OtpInput length={6} onChange={handleOtpChange} />
          <Button
            text="Verify OTP"
            onClick={(e) => {
              e.preventDefault();
              // 🔥 call verifyOtp API here
            }}
          />
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
