import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import OtpInput from "../../../components/forms/OtpInput";
import { useGuestAuth } from "../../../context/Auth/useGuestAuth";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { normalizeMobileNumber } from "../../../utils/format";
import { MOBILE_REGEX } from "../constant";
import {
	mobileEntrySchema,
	otpVerifySchema,
	type MobileEntryFormValues,
	type OtpVerifyFormValues,
} from "../../../schemas/authForms.schema";

type MobileStep = "enterMobile" | "verifyOtp";

const GuestMobileLoginForm = () => {
	const navigate = useNavigate();
	const { sendOtp, verifyOtp } = useGuestAuth();

	const [step, setStep] = useState<MobileStep>("enterMobile");
	const [loading, setLoading] = useState(false);
	const [otpTimerActive, setOtpTimerActive] = useState(true);
	const [secondsLeft, setSecondsLeft] = useState(30);
	const [confirmedMobile, setConfirmedMobile] = useState("");
	// Inline copy of the last failure; GuestAuthProvider already toasts.
	const [formError, setFormError] = useState<string | undefined>();

	const mobileForm = useForm<MobileEntryFormValues>({
		resolver: zodResolver(mobileEntrySchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: { mobile: "" },
	});

	const otpForm = useForm<OtpVerifyFormValues>({
		resolver: zodResolver(otpVerifySchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: { otp: "" },
	});

	const mobileValue = useWatch({ control: mobileForm.control, name: "mobile" });
	const otpValue = useWatch({ control: otpForm.control, name: "otp" });

	const requestOtp = async (mobile: string): Promise<boolean> => {
		setLoading(true);
		setFormError(undefined);

		try {
			await sendOtp(mobile);
			setConfirmedMobile(mobile);
			setStep("verifyOtp");
			return true;
		} catch (error: unknown) {
			setFormError(getApiErrorMessage(error, "Unable to send OTP."));
			return false; // toast already shown by GuestAuthProvider
		} finally {
			setLoading(false);
		}
	};

	const onMobileSubmit = async (values: MobileEntryFormValues) => {
		await requestOtp(normalizeMobileNumber(values.mobile));
	};

	const onOtpSubmit = async (values: OtpVerifyFormValues) => {
		setLoading(true);
		setFormError(undefined);

		try {
			await verifyOtp(confirmedMobile, values.otp);
			navigate("/guest/medi-claim/listing");
		} catch (error: unknown) {
			// toast already shown by GuestAuthProvider
			setFormError(getApiErrorMessage(error, "Invalid OTP"));
		} finally {
			setLoading(false);
		}
	};

	const handleResendOtp = async () => {
		if (otpTimerActive || loading) return;

		const sent = await requestOtp(confirmedMobile);

		if (sent) {
			otpForm.reset({ otp: "" });
		}
	};

	const errorBanner = formError ? (
		<p className="auth-form-error" role="alert">
			{formError}
		</p>
	) : null;

	if (step === "verifyOtp") {
		return (
			<form className="auth-form" onSubmit={otpForm.handleSubmit(onOtpSubmit)}>
				<div className="auth-otp-intro">
					<p className="auth-otp-label">Verification code</p>
					<p className="auth-otp-description">
						Enter the code sent to <strong>{confirmedMobile}</strong>
					</p>
				</div>

				<Controller
					control={otpForm.control}
					name="otp"
					render={({ field, fieldState }) => (
						<OtpInput
							length={6}
							value={field.value}
							onChange={field.onChange}
							error={fieldState.error?.message}
							onTimerChange={(seconds, active) => {
								setSecondsLeft(seconds);
								setOtpTimerActive(active);
							}}
						/>
					)}
				/>

				{errorBanner}

				<Button
					type="submit"
					appearance="cta"
					variant="brand"
					text={loading ? "Verifying..." : "Verify OTP"}
					disabled={loading || otpValue.length !== 6}
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
							setConfirmedMobile("");
							setFormError(undefined);
							otpForm.reset({ otp: "" });
							mobileForm.reset({ mobile: "" });
						}}
					>
						Change mobile number
					</button>
				</div>
			</form>
		);
	}

	return (
		<form
			className="auth-form"
			onSubmit={mobileForm.handleSubmit(onMobileSubmit)}
			noValidate
		>
			<FormInput
				label="Mobile number"
				type="tel"
				inputMode="numeric"
				autoComplete="tel"
				placeholder="Enter 10-digit mobile number"
				required
				error={mobileForm.formState.errors.mobile?.message}
				helperText="A one-time password will be sent to your registered mobile number."
				isTooltip={false}
				maxLength={10}
				inputPrefix="+91"
				{...mobileForm.register("mobile", {
					onChange: (event) => {
						event.target.value = event.target.value
							.replace(/\D/g, "")
							.slice(0, 10);
					},
				})}
			/>

			{errorBanner}

			<Button
				text={loading ? "Sending OTP..." : "Continue"}
				disabled={loading || !MOBILE_REGEX.test(mobileValue)}
				fullWidth
				type="submit"
				appearance="cta"
				variant="brand"
			/>
		</form>
	);
};

export default GuestMobileLoginForm;
