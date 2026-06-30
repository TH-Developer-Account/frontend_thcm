import { useState, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import OtpInput from "../../../components/forms/OtpInput";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";
import { API_BASE_URL, ServerAxios } from "../../../services/ServerAxios";
import { MOBILE_REGEX, api_routes } from "../../Login/constant";

type MobileStep = "enterMobile" | "verifyOtp";

type MobileLoginState = {
	loading: boolean;
	mobile: string;
	otp: string;
	error: string;
};

const MobileLoginForm = () => {
	const navigate = useNavigate();
	const { setUser } = useAuth();
	const { showToast } = useToast();

	const [mobileStep, setMobileStep] = useState<MobileStep>("enterMobile");

	const [otpTimerActive, setOtpTimerActive] = useState(true);

	const [secondsLeft, setSecondsLeft] = useState(30);

	const [state, setState] = useState<MobileLoginState>({
		loading: false,
		mobile: "",
		otp: "",
		error: "",
	});

	const getErrorMessage = (error: unknown, fallback: string) => {
		if (axios.isAxiosError(error)) {
			return error.response?.data?.message || error.message || fallback;
		}

		if (error instanceof Error) {
			return error.message;
		}

		return fallback;
	};

	const handleMobileChange = (event: ChangeEvent<HTMLInputElement>) => {
		setState((current) => ({
			...current,
			mobile: event.target.value.replace(/\D/g, ""),
			error: "",
		}));
	};

	const handleOtpChange = (value: string) => {
		setState((current) => ({
			...current,
			otp: value,
			error: "",
		}));
	};

	const sendOtp = async () => {
		if (!MOBILE_REGEX.test(state.mobile)) {
			setState((current) => ({
				...current,
				error: "Enter a valid 10-digit mobile number",
			}));

			return false;
		}

		setState((current) => ({
			...current,
			loading: true,
			error: "",
		}));

		try {
			await ServerAxios.post(`${API_BASE_URL}${api_routes.send_otp}`, {
				phone_number: state.mobile,
			});

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
				description: getErrorMessage(error, "User not found"),
			});

			return false;
		} finally {
			setState((current) => ({
				...current,
				loading: false,
			}));
		}
	};

	const verifyOtp = async () => {
		if (state.otp.length !== 6) {
			setState((current) => ({
				...current,
				error: "Enter the complete 6-digit OTP",
			}));

			return;
		}

		setState((current) => ({
			...current,
			loading: true,
			error: "",
		}));

		try {
			const response = await ServerAxios.post(
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
				title: "Signed in",
				description: "You have logged in successfully.",
			});
		} catch (error: unknown) {
			showToast({
				type: "error",
				title: "Verification failed",
				description: getErrorMessage(error, "Invalid OTP"),
			});
		} finally {
			setState((current) => ({
				...current,
				loading: false,
			}));
		}
	};

	const handleMobileSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		await sendOtp();
	};

	const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		await verifyOtp();
	};

	const handleResendOtp = async () => {
		if (otpTimerActive || state.loading) return;

		const sent = await sendOtp();

		if (sent) {
			setState((current) => ({
				...current,
				otp: "",
			}));
		}
	};

	const handleChangeMobile = () => {
		setMobileStep("enterMobile");

		setState({
			loading: false,
			mobile: "",
			otp: "",
			error: "",
		});
	};

	if (mobileStep === "verifyOtp") {
		return (
			<form className="auth-form" onSubmit={handleOtpSubmit}>
				<div className="auth-otp-intro">
					<p className="auth-otp-label">Verification code</p>

					<p className="auth-otp-description">
						Enter the code sent to <strong>{state.mobile}</strong>
					</p>
				</div>

				<OtpInput
					length={6}
					onChange={handleOtpChange}
					onTimerChange={(seconds, active) => {
						setSecondsLeft(seconds);
						setOtpTimerActive(active);
					}}
				/>

				{state.error ? (
					<p className="auth-form-error" role="alert">
						{state.error}
					</p>
				) : null}

				<Button
					type="submit"
					appearance="cta"
					variant="brand"
					text={state.loading ? "Verifying..." : "Verify OTP"}
					disabled={state.loading || state.otp.length !== 6}
					fullWidth
				/>

				<div className="auth-inline-actions">
					<button
						type="button"
						className="auth-text-button"
						onClick={handleResendOtp}
						disabled={otpTimerActive || state.loading}
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
		<form className="auth-form" onSubmit={handleMobileSubmit} noValidate>
			<FormInput
				name="mobile"
				label="Mobile number"
				type="tel"
				inputMode="numeric"
				autoComplete="tel"
				placeholder="Enter 10-digit mobile number"
				value={state.mobile}
				onChange={handleMobileChange}
				error={state.error}
				required
			/>

			<p className="auth-field-helper">
				A one-time password will be sent to your registered mobile number.
			</p>

			<Button
				text={state.loading ? "Sending OTP..." : "Continue"}
				disabled={state.loading || !MOBILE_REGEX.test(state.mobile)}
				fullWidth
				type="submit"
				appearance="cta"
				variant="brand"
			/>
		</form>
	);
};

export default MobileLoginForm;
