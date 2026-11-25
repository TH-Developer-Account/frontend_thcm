import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { normalizeEmail } from "../../../utils/format";
import {
	emailLoginSchema,
	type EmailLoginFormValues,
} from "../../../schemas/authForms.schema";

const EmailLoginForm = () => {
	const navigate = useNavigate();
	const { login } = useAuth();
	const { showToast } = useToast();

	// Persistent inline copy of the failure: a toast alone disappears and is
	// easy to miss (design-system rule: toasts never carry the only message).
	const [formError, setFormError] = useState<string | undefined>();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<EmailLoginFormValues>({
		resolver: zodResolver(emailLoginSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: { email: "", password: "" },
	});

	const onSubmit = async (values: EmailLoginFormValues) => {
		setFormError(undefined);

		try {
			// Sanitize at the API boundary, not the field — the input keeps
			// showing exactly what the user typed.
			const result = await login(normalizeEmail(values.email), values.password);

			navigate(result.requiresPasswordReset ? "/reset-password" : "/");
		} catch (error: unknown) {
			const message = getApiErrorMessage(
				error,
				"Unable to sign in. Check your credentials.",
			);

			setFormError(message);

			showToast({
				type: "error",
				title: "Sign-in failed",
				description: message,
			});
		}
	};

	return (
		<form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
			<div className="auth-form-fields">
				<FormInput
					label="Email address"
					type="email"
					placeholder="name@company.com"
					required
					error={errors.email?.message}
					autoComplete="email"
					{...register("email")}
				/>

				<FormInput
					label="Password"
					type="password"
					placeholder="Enter your password"
					required
					error={errors.password?.message}
					autoComplete="current-password"
					data-lpignore="true"
					data-1p-ignore="true"
					{...register("password")}
				/>
			</div>

			<div className="auth-form-options">
				<Link to="/forgot-password" className="auth-text-link">
					Forgot password?
				</Link>
			</div>

			{formError ? (
				<p className="auth-form-error" role="alert">
					{formError}
				</p>
			) : null}

			<Button
				text={isSubmitting ? "Signing in..." : "Sign in"}
				disabled={isSubmitting}
				fullWidth
				type="submit"
				appearance="cta"
				variant="brand"
			/>
		</form>
	);
};

export default EmailLoginForm;
