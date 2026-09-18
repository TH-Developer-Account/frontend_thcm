import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Circle, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";
import { ServerAxios } from "../../../services/ServerAxios";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { PasswordPolicy } from "../constant";
import {
	buildResetPasswordSchema,
	type ResetPasswordFormValues,
} from "../../../schemas/authForms.schema";

const ResetPasswordForm = () => {
	const navigate = useNavigate();
	const { token } = useParams<{ token: string }>();
	const { resetPassword } = useAuth();
	const { showToast } = useToast();

	const [generalError, setGeneralError] = useState<string | undefined>();
	const [showPolicy, setShowPolicy] = useState(false);

	// Rules differ depending on entry point (see schema file): an
	// authenticated "change password" needs the current password, a
	// tokenized reset link does not.
	const resetPasswordSchema = useMemo(
		() => buildResetPasswordSchema(!token),
		[token],
	);

	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm<ResetPasswordFormValues>({
		resolver: zodResolver(resetPasswordSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
	});

	const newPasswordValue = useWatch({ control, name: "newPassword" });
	const oldPasswordValue = useWatch({ control, name: "oldPassword" });
	const confirmPasswordValue = useWatch({ control, name: "confirmPassword" });

	const isPasswordValid = useMemo(
		() => PasswordPolicy.every((rule) => rule.test(newPasswordValue)),
		[newPasswordValue],
	);

	const onSubmit = async (values: ResetPasswordFormValues) => {
		setGeneralError(undefined);

		try {
			if (token) {
				await ServerAxios.post(`/auth/reset-password/${token}`, {
					newPassword: values.newPassword,
				});
			} else {
				await resetPassword(values.oldPassword, values.newPassword);
			}

			showToast({
				type: "success",
				title: "Password updated",
				description: "Your password has been changed successfully.",
			});

			navigate("/login");
		} catch (error: unknown) {
			const message = getApiErrorMessage(
				error,
				"Unable to update your password.",
			);

			setGeneralError(message);

			showToast({
				type: "error",
				title: "Password update failed",
				description: message,
			});
		}
	};

	return (
		<>
			<header className="auth-form-header">
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

			<form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
				<div className="auth-form-fields">
					{!token ? (
						<FormInput
							type="password"
							label="Current password"
							placeholder="Enter current password"
							error={errors.oldPassword?.message}
							success={Boolean(oldPasswordValue) && !errors.oldPassword}
							autoComplete="current-password"
							required
							{...register("oldPassword")}
						/>
					) : null}

					<FormInput
						type="password"
						label="New password"
						placeholder="Enter new password"
						onFocus={() => setShowPolicy(true)}
						error={errors.newPassword?.message}
						success={isPasswordValid}
						autoComplete="new-password"
						required
						{...register("newPassword")}
					/>

					{!isPasswordValid && showPolicy ? (
						<ul className="auth-password-policy">
							{PasswordPolicy.map((rule) => {
								const passed = rule.test(newPasswordValue);

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
						type="password"
						label="Confirm new password"
						placeholder="Re-enter new password"
						error={errors.confirmPassword?.message}
						success={
							confirmPasswordValue.length > 0 && !errors.confirmPassword
						}
						autoComplete="new-password"
						required
						{...register("confirmPassword")}
					/>
					{/*
					 * The mismatch message used to also be duplicated in a
					 * separate <div> right below the field, on top of
					 * FormInput's own error text under the input — the exact
					 * double-message bug already fixed in TextareaInput.
					 * fieldState now owns this message once, via
					 * errors.confirmPassword above.
					 */}
				</div>

				{generalError ? (
					<p className="auth-form-error" role="alert">
						{generalError}
					</p>
				) : null}

				<Button
					text={isSubmitting ? "Updating password..." : "Update password"}
					disabled={isSubmitting || !isPasswordValid}
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
