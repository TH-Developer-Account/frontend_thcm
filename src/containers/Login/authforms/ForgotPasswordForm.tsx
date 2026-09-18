import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import { useToast } from "../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../services/ServerAxios";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { normalizeEmail } from "../../../utils/format";
import { api_routes } from "../constant";
import {
	forgotPasswordSchema,
	type ForgotPasswordFormValues,
} from "../../../schemas/authForms.schema";

const ForgotPasswordForm = () => {
	const { showToast } = useToast();

	const [submitted, setSubmitted] = useState(false);
	const [submittedEmail, setSubmittedEmail] = useState("");

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ForgotPasswordFormValues>({
		resolver: zodResolver(forgotPasswordSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: { email: "" },
	});

	const onSubmit = async (values: ForgotPasswordFormValues) => {
		const email = normalizeEmail(values.email);

		try {
			const response = await ServerAxios.post(
				api_routes.forgot_password_api_route,
				{ email },
			);

			setSubmittedEmail(email);
			setSubmitted(true);

			showToast({
				type: "success",
				title: "Reset link sent",
				description:
					response.data.message ||
					"If the email exists, a password reset link has been sent.",
			});
		} catch (error: unknown) {
			showToast({
				type: "error",
				title: "Request failed",
				description: getApiErrorMessage(
					error,
					"Unable to send the password reset link.",
				),
			});
		}
	};

	if (submitted) {
		return (
			<div className="auth-result">
				<div className="auth-result-icon">
					<CheckCircle2 aria-hidden="true" size={28} strokeWidth={1.75} />
				</div>

				<header className="auth-form-header">
					<p className="auth-form-eyebrow">Request accepted</p>

					<h2 className="auth-form-title">Check your email</h2>

					<p className="auth-form-description">
						If an account is registered for <strong>{submittedEmail}</strong>,
						a password reset link has been sent.
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

			<form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
				<FormInput
					type="email"
					label="Email address"
					placeholder="name@company.com"
					error={errors.email?.message}
					autoComplete="email"
					required
					{...register("email")}
				/>

				<Button
					type="submit"
					appearance="cta"
					variant="brand"
					text={isSubmitting ? "Sending link..." : "Send reset link"}
					disabled={isSubmitting}
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
