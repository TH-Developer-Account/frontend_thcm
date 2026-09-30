import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import { useGuestAuth } from "../../../context/Auth/useGuestAuth";
import { normalizeEmail } from "../../../utils/format";
import {
	guestEmailLoginSchema,
	type GuestEmailLoginFormValues,
} from "../../../schemas/authForms.schema";

const GuestEmailLoginForm = () => {
	const navigate = useNavigate();
	const { loginWithPassword } = useGuestAuth();

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
		try {
			await loginWithPassword(normalizeEmail(values.email), values.password);
			navigate("/guest/medi-claim/create");
		} catch {
			// toast already shown by GuestAuthProvider
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
