import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Check, Circle, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";
import { ServerAxios } from "../../../services/ServerAxios";
import { PasswordPolicy } from "../constant";

type ResetPasswordErrors = {
	oldPassword?: string;
	newPassword?: string;
	confirmPassword?: string;
	general?: string;
};

type ResetPasswordState = {
	oldPassword: string;
	newPassword: string;
	confirmPassword: string;
	errors: ResetPasswordErrors;
	loading: boolean;
	showPolicy: boolean;
};

const ResetPasswordForm = () => {
	const navigate = useNavigate();
	const { token } = useParams<{ token: string }>();
	const { resetPassword } = useAuth();
	const { showToast } = useToast();

	const [state, setState] = useState<ResetPasswordState>({
		oldPassword: "",
		newPassword: "",
		confirmPassword: "",
		errors: {},
		loading: false,
		showPolicy: false,
	});

	const isPasswordValid = useMemo(
		() => PasswordPolicy.every((rule) => rule.test(state.newPassword)),
		[state.newPassword],
	);

	const validateForm = () => {
		const nextErrors: ResetPasswordErrors = {};

		if (!token && !state.oldPassword) {
			nextErrors.oldPassword = "Current password is required";
		}

		if (!state.newPassword) {
			nextErrors.newPassword = "New password is required";
		} else if (!isPasswordValid) {
			nextErrors.newPassword = "Password does not meet all requirements";
		}

		if (!state.confirmPassword) {
			nextErrors.confirmPassword = "Confirm your new password";
		} else if (state.confirmPassword !== state.newPassword) {
			nextErrors.confirmPassword = "Passwords do not match";
		}

		setState((current) => ({
			...current,
			errors: nextErrors,
		}));

		return Object.keys(nextErrors).length === 0;
	};

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;

		setState((current) => ({
			...current,
			[name]: value,
			errors: {
				...current.errors,
				[name]: undefined,
				general: undefined,
			},
		}));
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!validateForm()) return;

		setState((current) => ({
			...current,
			loading: true,
		}));

		try {
			if (token) {
				await ServerAxios.post(`/auth/reset-password/${token}`, {
					newPassword: state.newPassword,
				});
			} else {
				await resetPassword(state.oldPassword, state.newPassword);
			}

			showToast({
				type: "success",
				title: "Password updated",
				description: "Your password has been changed successfully.",
			});

			navigate("/login");
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: "Unable to update your password.";

			setState((current) => ({
				...current,
				errors: {
					...current.errors,
					general: message,
				},
			}));

			showToast({
				type: "error",
				title: "Password update failed",
				description: message,
			});
		} finally {
			setState((current) => ({
				...current,
				loading: false,
			}));
		}
	};

	return (
		<>
			<header className="auth-form-header">
				<div className="auth-mobile-logo">
					<img src="/th-brand-logo.png" alt="Tata Hitachi" />
				</div>

				<div className="auth-form-icon">
					<ShieldCheck aria-hidden="true" size={24} strokeWidth={1.75} />
				</div>

				<p className="auth-form-eyebrow">Security control</p>

				<h2 className="auth-form-title">
					{token ? "Create a new password" : "Change your password"}
				</h2>

				<p className="auth-form-description">
					Use a secure password that meets all enterprise policy requirements.
				</p>
			</header>

			<form className="auth-form" onSubmit={handleSubmit} noValidate>
				<div className="auth-form-fields">
					{!token ? (
						<FormInput
							name="oldPassword"
							type="password"
							label="Current password"
							placeholder="Enter current password"
							value={state.oldPassword}
							onChange={handleChange}
							error={state.errors.oldPassword}
							autoComplete="current-password"
							required
						/>
					) : null}

					<FormInput
						name="newPassword"
						type="password"
						label="New password"
						placeholder="Enter new password"
						value={state.newPassword}
						onChange={handleChange}
						onFocus={() =>
							setState((current) => ({
								...current,
								showPolicy: true,
							}))
						}
						error={state.errors.newPassword}
						autoComplete="new-password"
						required
					/>

					{state.showPolicy ? (
						<ul className="auth-password-policy">
							{PasswordPolicy.map((rule) => {
								const passed = rule.test(state.newPassword);

								return (
									<li
										key={rule.label}
										className={
											passed
												? "auth-password-rule auth-password-rule-valid"
												: "auth-password-rule"
										}
									>
										{passed ? (
											<Check aria-hidden="true" size={14} />
										) : (
											<Circle aria-hidden="true" size={8} fill="currentColor" />
										)}

										<span>{rule.label}</span>
									</li>
								);
							})}
						</ul>
					) : null}

					<FormInput
						name="confirmPassword"
						type="password"
						label="Confirm new password"
						placeholder="Re-enter new password"
						value={state.confirmPassword}
						onChange={handleChange}
						error={state.errors.confirmPassword}
						autoComplete="new-password"
						required
					/>
				</div>

				{state.errors.general ? (
					<p className="auth-form-error" role="alert">
						{state.errors.general}
					</p>
				) : null}

				<Button
					text={state.loading ? "Updating password..." : "Update password"}
					disabled={state.loading || !isPasswordValid}
					fullWidth
					type="submit"
					appearance="cta"
					variant="brand"
				/>

				<Link to="/login" className="auth-secondary-link">
					Return to sign in
				</Link>
			</form>
		</>
	);
};

export default ResetPasswordForm;
