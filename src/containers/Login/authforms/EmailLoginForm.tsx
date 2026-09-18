import {
	useState,
	type ChangeEvent,
	type FocusEvent,
	type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { EMAIL_REGEX } from "../../Login/constant";

type EmailLoginData = {
	email: string;
	password: string;
};

type EmailLoginErrors = {
	email?: string;
	password?: string;
};

const EmailLoginForm = () => {
	const navigate = useNavigate();
	const { login } = useAuth();
	const { showToast } = useToast();

	const [formData, setFormData] = useState<EmailLoginData>({
		email: "",
		password: "",
	});

	const [errors, setErrors] = useState<EmailLoginErrors>({});

	const [loading, setLoading] = useState(false);

	const validateForm = () => {
		const nextErrors: EmailLoginErrors = {};

		if (!formData.email.trim()) {
			nextErrors.email = "Email is required";
		} else if (!EMAIL_REGEX.test(formData.email.trim())) {
			nextErrors.email = "Enter a valid email address";
		}

		if (!formData.password) {
			nextErrors.password = "Password is required";
		}

		setErrors(nextErrors);

		return Object.keys(nextErrors).length === 0;
	};

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;

		setFormData((current) => ({
			...current,
			[name]: value,
		}));

		setErrors((current) => ({
			...current,
			[name]: undefined,
		}));
	};

	const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
		const { name, value } = event.target;

		setErrors((current) => {
			const nextErrors = { ...current };

			if (name === "email") {
				if (!value.trim()) {
					nextErrors.email = "Email is required";
				} else if (!EMAIL_REGEX.test(value.trim())) {
					nextErrors.email = "Enter a valid email address";
				} else {
					delete nextErrors.email;
				}
			}

			if (name === "password") {
				if (!value) {
					nextErrors.password = "Password is required";
				} else {
					delete nextErrors.password;
				}
			}

			return nextErrors;
		});
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!validateForm()) return;

		setLoading(true);

		try {
			const result = await login(formData.email.trim(), formData.password);

			navigate(result.requiresPasswordReset ? "/reset-password" : "/");
		} catch (error: unknown) {
			/*
			 * Previously this only handled the case where `login` threw a
			 * plain Error and showed its .message — but axios errors (the
			 * actual shape thrown for a rejected /login request) carry the
			 * backend's real reason ("Invalid credentials", "Account
			 * locked", etc.) in error.response.data.message, not in
			 * error.message. That meant real sign-in failures either fell
			 * through to a generic "Unable to sign in" string or, for
			 * anything not an Error instance, were silently swallowed with
			 * no toast at all. Route through the same centralized helper
			 * every other mutation in this app uses so the backend's actual
			 * message reaches the user.
			 */
			showToast({
				type: "error",
				title: "Sign-in failed",
				description: getApiErrorMessage(
					error,
					"Unable to sign in. Check your credentials.",
				),
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="auth-form" onSubmit={handleSubmit} noValidate>
			<div className="auth-form-fields">
				<FormInput
					name="email"
					label="Email address"
					type="email"
					placeholder="name@company.com"
					value={formData.email}
					onChange={handleChange}
					onBlur={handleBlur}
					required
					error={errors.email}
					autoComplete="email"
				/>

				<FormInput
					name="password"
					label="Password"
					type="password"
					placeholder="Enter your password"
					value={formData.password}
					onChange={handleChange}
					onBlur={handleBlur}
					required
					error={errors.password}
					autoComplete="current-password"
					data-lpignore="true"
					data-1p-ignore="true"
				/>
			</div>

			<div className="auth-form-options">
				<Link to="/forgot-password" className="auth-text-link">
					Forgot password?
				</Link>
			</div>

			<Button
				text={loading ? "Signing in..." : "Sign in"}
				disabled={loading}
				fullWidth
				type="submit"
				appearance="cta"
				variant="brand"
			/>
		</form>
	);
};

export default EmailLoginForm;
