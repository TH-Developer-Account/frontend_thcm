import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import { useGuestAuth } from "../../../context/Auth/useGuestAuth";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { normalizeEmail } from "../../../utils/format";
import {
	guestEmailLoginSchema,
	type GuestEmailLoginFormValues,
} from "../../../schemas/authForms.schema";

const GuestEmailLoginForm = () => {
	const navigate = useNavigate();
	const { loginWithPassword } = useGuestAuth();
	const [formError, setFormError] = useState<string | undefined>();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<GuestEmailLoginFormValues>({
		resolver: zodResolver(guestEmailLoginSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: { email: "", password: "" },
	});

	const onSubmit = async (values: GuestEmailLoginFormValues) => {
		setFormError(undefined);

		try {
			await loginWithPassword(normalizeEmail(values.email), values.password);
			navigate("/guest/medi-claim/listing");
		} catch (error: unknown) {
			// Toast is already shown by GuestAuthProvider; keep an inline copy
			// so the reason stays on screen.
			setFormError(
				getApiErrorMessage(error, "Unable to sign in. Check your credentials."),
			);
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
					placeholder="Enter the password from your email"
					required
					error={errors.password?.message}
					autoComplete="current-password"
					{...register("password")}
				/>
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

export default GuestEmailLoginForm;
