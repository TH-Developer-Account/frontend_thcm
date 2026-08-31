import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import OtpInput from "../../../components/forms/OtpInput";
import { useGuestAuth } from "../../../context/Auth/useGuestAuth";
import { MOBILE_REGEX } from "../constant";

type MobileStep = "enterMobile" | "verifyOtp";

const GuestMobileLoginForm = () => {
	const navigate = useNavigate();
	const { sendOtp, verifyOtp } = useGuestAuth();

	const [step, setStep] = useState<MobileStep>("enterMobile");
	const [mobile, setMobile] = useState("");
	const [otp, setOtp] = useState("");
	const [loading, setLoading] = useState(false);
	const [otpTimerActive, setOtpTimerActive] = useState(true);
	const [secondsLeft, setSecondsLeft] = useState(30);

	const handleMobileChange = (event: ChangeEvent<HTMLInputElement>) => {
		setMobile(event.target.value.replace(/\D/g, ""));
	};

	const handleSendOtp = async () => {
		if (!MOBILE_REGEX.test(mobile)) return false;

		setLoading(true);
		try {
			await sendOtp(mobile);
			setStep("verifyOtp");
			return true;
		} catch {
			return false; // toast already shown by GuestAuthProvider
		} finally {
			setLoading(false);
		}
	};

	const handleMobileSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		await handleSendOtp();
	};

	const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (otp.length !== 6) return;

		setLoading(true);
		try {
			await verifyOtp(mobile, otp);
			navigate("/guest/medi-claim/create");
		} catch {
			// toast already shown by GuestAuthProvider
		} finally {
			setLoading(false);
		}
	};

	const handleResendOtp = async () => {
		if (otpTimerActive || loading) return;
		const sent = await handleSendOtp();
		if (sent) setOtp("");
	};

	if (step === "verifyOtp") {
		return (
			<form className="auth-form" onSubmit={handleOtpSubmit}>
				<div className="auth-otp-intro">
					<p className="auth-otp-label">Verification code</p>
					<p className="auth-otp-description">
						Enter the code sent to <strong>{mobile}</strong>
					</p>
				</div>

				<OtpInput
					length={6}
					onChange={setOtp}
					onTimerChange={(seconds, active) => {
						setSecondsLeft(seconds);
						setOtpTimerActive(active);
					}}
				/>

				<Button
					type="submit"
					appearance="cta"
					variant="brand"
					text={loading ? "Verifying..." : "Verify OTP"}
					disabled={loading || otp.length !== 6}
					fullWidth
				/>

				<div className="auth-inline-actions">
					<button
						type="button"
						className="auth-text-button"
						onClick={handleResendOtp}
						disabled={otpTimerActive || loading}
					>
						{otpTimerActive ? `Resend in ${secondsLeft}s` : "Resend OTP"}
					</button>

					<button
						type="button"
						className="auth-text-button"
						onClick={() => {
							setStep("enterMobile");
							setMobile("");
							setOtp("");
						}}
					>
						Change mobile number
					</button>
				</div>
			</form>
		);
	}

	return (
		<form className="auth-form" onSubmit={handleMobileSubmit} noValidate>
			<FormInput
				name="mobile"
				label="Mobile number"
				type="tel"
				inputMode="numeric"
				autoComplete="tel"
				placeholder="Enter 10-digit mobile number"
				value={mobile}
				onChange={handleMobileChange}
				required
			/>

			<p className="auth-field-helper">
				A one-time password will be sent to your registered mobile number.
			</p>

			<Button
				text={loading ? "Sending OTP..." : "Continue"}
				disabled={loading || !MOBILE_REGEX.test(mobile)}
				fullWidth
				type="submit"
				appearance="cta"
				variant="brand"
			/>
		</form>
	);
};

export default GuestMobileLoginForm;
