import {
	useState,
	type ChangeEvent,
	type FocusEvent,
	type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import { useToast } from "../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../services/ServerAxios";
import { EMAIL_REGEX, api_routes } from "../constant";

type ForgotPasswordErrors = {
	email?: string;
};

type ForgotPasswordState = {
	email: string;
	loading: boolean;
	submitted: boolean;
};

const ForgotPasswordForm = () => {
	const { showToast } = useToast();

	const [state, setState] = useState<ForgotPasswordState>({
		email: "",
		loading: false,
		submitted: false,
	});

	const [errors, setErrors] = useState<ForgotPasswordErrors>({});

	const validateForm = () => {
		const nextErrors: ForgotPasswordErrors = {};

		if (!state.email.trim()) {
			nextErrors.email = "Email is required";
		} else if (!EMAIL_REGEX.test(state.email.trim())) {
			nextErrors.email = "Enter a valid email address";
		}

		setErrors(nextErrors);

		return Object.keys(nextErrors).length === 0;
	};

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		setState((current) => ({
			...current,
			email: event.target.value,
		}));

		setErrors({});
	};

	const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
		const value = event.target.value.trim();

		if (!value) {
			setErrors({
				email: "Email is required",
			});
		} else if (!EMAIL_REGEX.test(value)) {
			setErrors({
				email: "Enter a valid email address",
			});
		} else {
			setErrors({});
		}
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!validateForm()) return;

		setState((current) => ({
			...current,
			loading: true,
		}));

		try {
			const response = await ServerAxios.post(
				api_routes.forgot_password_api_route,
				{
					email: state.email.trim(),
				},
			);

			setState((current) => ({
				...current,
				submitted: true,
			}));

			showToast({
				type: "success",
				title: "Reset link sent",
				description:
					response.data.message ||
					"If the email exists, a password reset link has been sent.",
			});
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: "Unable to send the password reset link.";

			showToast({
				type: "error",
				title: "Request failed",
				description: message,
			});
		} finally {
			setState((current) => ({
				...current,
				loading: false,
			}));
		}
	};

	if (state.submitted) {
		return (
			<div className="auth-result">
				<div className="auth-result-icon">
					<CheckCircle2 aria-hidden="true" size={28} strokeWidth={1.75} />
				</div>

				<header className="auth-form-header">
					<p className="auth-form-eyebrow">Request accepted</p>

					<h2 className="auth-form-title">Check your email</h2>

					<p className="auth-form-description">
						If an account is registered for <strong>{state.email}</strong>, a
						password reset link has been sent.
					</p>
				</header>

				<Link to="/login" className="auth-primary-link">
					Back to sign in
				</Link>
			</div>
		);
	}

	return (
		<>
			<header className="auth-form-header">
				<div className="auth-mobile-logo">
					<img src="/th-brand-logo.png" alt="Tata Hitachi" />
				</div>

				<p className="auth-form-eyebrow">Password recovery</p>

				<h2 className="auth-form-title">Forgot your password?</h2>

				<p className="auth-form-description">
					Enter your registered email address and we will send you a secure
					reset link.
				</p>
			</header>

			<form className="auth-form" onSubmit={handleSubmit} noValidate>
				<FormInput
					name="email"
					type="email"
					label="Email address"
					placeholder="name@company.com"
					value={state.email}
					onChange={handleChange}
					onBlur={handleBlur}
					error={errors.email}
					autoComplete="email"
					required
				/>

				<Button
					type="submit"
					appearance="cta"
					variant="brand"
					text={state.loading ? "Sending link..." : "Send reset link"}
					disabled={state.loading}
					fullWidth
				/>

				<Link to="/login" className="auth-secondary-link">
					Back to sign in
				</Link>
			</form>
		</>
	);
};

export default ForgotPasswordForm;
