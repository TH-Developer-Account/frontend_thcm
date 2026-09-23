import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import OtpInput from "../../../components/forms/OtpInput";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";
import { API_BASE_URL, ServerAxios } from "../../../services/ServerAxios";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { normalizeMobileNumber } from "../../../utils/format";
import { MOBILE_REGEX, api_routes } from "../../Login/constant";
import {
	mobileEntrySchema,
	otpVerifySchema,
	type MobileEntryFormValues,
	type OtpVerifyFormValues,
} from "../../../schemas/authForms.schema";

type MobileStep = "enterMobile" | "verifyOtp";

const MobileLoginForm = () => {
	const navigate = useNavigate();
	const { hydrateSession } = useAuth();
	const { showToast } = useToast();
	const [mobileStep, setMobileStep] = useState<MobileStep>("enterMobile");
	const [otpTimerActive, setOtpTimerActive] = useState(true);
	const [secondsLeft, setSecondsLeft] = useState(30);
	const [loading, setLoading] = useState(false);

	// The confirmed mobile number carries across steps (needed to display
	// "Enter the code sent to X" on step 2 and as the verify-OTP payload) —
	// this is cross-step data, not validation, so it stays outside both
	// RHF instances rather than trying to share one form across two
	// separately-submitted screens.
	const [confirmedMobile, setConfirmedMobile] = useState("");

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

	// useWatch (a proper subscribable hook) instead of form.watch() — the
	// latter is a plain function call the React Compiler can't safely
	// memoize around.
	const mobileValue = useWatch({ control: mobileForm.control, name: "mobile" });
	const otpValue = useWatch({ control: otpForm.control, name: "otp" });

	const requestOtp = async (mobile: string): Promise<boolean> => {
		setLoading(true);

		try {
			await ServerAxios.post(`${API_BASE_URL}${api_routes.send_otp}`, {
				phone_number: mobile,
			});

			setConfirmedMobile(mobile);
			setMobileStep("verifyOtp");

			showToast({
				type: "success",
				title: "OTP sent",
				description: "A verification code was sent to your mobile number.",
			});

			return true;
		} catch (error: unknown) {
			showToast({
				type: "error",
				title: "Unable to send OTP",
				description: getApiErrorMessage(error, "User not found"),
			});

			return false;
		} finally {
			setLoading(false);
		}
	};

	const onMobileSubmit = async (values: MobileEntryFormValues) => {
		await requestOtp(normalizeMobileNumber(values.mobile));
	};

	const onOtpSubmit = async (values: OtpVerifyFormValues) => {
		setLoading(true);

		try {
			const response = await ServerAxios.post(
				`${API_BASE_URL}${api_routes.verify_otp}`,
				{
					phone_number: confirmedMobile,
					otp: values.otp,
				},
			);

			const { accessToken } = response.data;

			localStorage.setItem("authToken", accessToken);

			// Hydrate the full session (user + permissions) from /users/me — the
			// verify-otp response only guarantees { user, accessToken }, so this
			// reuses the same source of truth a page refresh already relies on,
			// instead of setUser(user) alone leaving permissions empty until reload.
			await hydrateSession();

			navigate("/");

			showToast({
				type: "success",
				title: "Signed in",
				description: "You have logged in successfully.",
			});
		} catch (error: unknown) {
			showToast({
				type: "error",
				title: "Verification failed",
				description: getApiErrorMessage(error, "Invalid OTP"),
			});
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

	const handleChangeMobile = () => {
		setMobileStep("enterMobile");
		setConfirmedMobile("");
		otpForm.reset({ otp: "" });
		mobileForm.reset({ mobile: "" });
	};

	if (mobileStep === "verifyOtp") {
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
						onClick={handleChangeMobile}
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
				maxLength={10}
				inputPrefix="+91"
				{...mobileForm.register("mobile", {
					// Live-strip non-digits and cap at 10 digits as the user
					// types, same as the original handleMobileChange —
					// register's onChange still runs afterward and picks up
					// the sanitized DOM value.
					onChange: (event) => {
						event.target.value = event.target.value
							.replace(/\D/g, "")
							.slice(0, 10);
					},
				})}
			/>

			<p className="auth-field-helper">
				A one-time password will be sent to your registered mobile number.
			</p>

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

export default MobileLoginForm;
