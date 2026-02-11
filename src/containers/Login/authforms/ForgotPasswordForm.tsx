import React, { useState } from "react";
import { ServerAxios } from "../../../services/ServerAxios";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/FormElements/FormInput";
import { EMAIL_REGEX } from "../constant";
import { api_routes } from "../constant";
import { useToast } from "../../../context/AuthContext";

type Errors = {
	email?: string;
};

const ForgotPasswordForm = () => {
	const [state, setState] = useState({
		email: "",
		loading: false,
		errors: {} as Errors,
		showSendMailStatus: false,
	});
	const { showToast } = useToast();
	const [errors, setErrors] = useState<Errors>({});

	const validateForm = () => {
		const newErrors: Errors = {};

		if (!state.email) {
			newErrors.email = "Please fill in the email field";
		} else if (!EMAIL_REGEX.test(state.email)) {
			newErrors.email = "Invalid email format";
		}
		setErrors(newErrors);

		// ✅ if no errors, form is valid
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setState((prev) => ({ ...prev, [name]: value }));
		setState((prev) => {
			if (!prev.errors[name as keyof Errors]) return prev; // nothing to clear

			const newErrors = { ...prev.errors };
			delete newErrors[name as keyof Errors];
			return { ...prev, errors: newErrors };
		});
	};

	const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		if (!validateForm()) return;
		setState((prev) => ({ ...prev, loading: true }));
		try {
			// API Route is defined in constant.ts
			const response = await ServerAxios.post(
				api_routes.forgot_password_api_route,
				{
					email: state.email,
				},
			);
			setState((prev) => ({ ...prev, showSendMailStatus: true }));
			showToast({
				type: "success",
				title: "Success",
				description:
					response.data.message ||
					"If the email exists, a password reset link has been sent.", // ✅ FROM API
			});
		} catch (err: unknown) {
			const message =
				err instanceof Error
					? err.message
					: typeof err === "string"
						? err
						: "Invalid OTP";
			showToast({
				type: "error",
				title: "Error",
				description: message,
			});
		} finally {
			setState((prev) => ({ ...prev, loading: false }));
		}
	};

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		setState((prev) => {
			const newErrors = { ...prev.errors };

			if (name === "email") {
				if (!value) {
					newErrors.email = "Please fill in the email field";
				} else if (!EMAIL_REGEX.test(value)) {
					newErrors.email = "Invalid email format";
				} else {
					delete newErrors.email;
				}
			}

			return {
				...prev,
				errors: newErrors,
			};
		});
	};

	return (
		<React.Fragment>
			{!state.showSendMailStatus ? (
				<form className="space-y-4">
					<div className="form-head mb-4">
						{/* Logo */}
						<div className="logos flex justify-center items-center mb-4">
							<img
								src="src\assets\sendlink.png"
								alt="logo"
								className="text-center w-[100px]"
							/>
						</div>
						<h2 className=" text-xl md:text-xl font-semibold tracking-tight text-gray-900">
							Forgot your Password?
						</h2>
						<p className="">Please enter your email</p>
					</div>
					<FormInput
						name="email"
						label="Email"
						placeholder="john@mail.com"
						value={state.email}
						onChange={handleChange}
						onBlur={handleBlur}
						error={errors?.email}
					/>

					<Button
						text="Send Reset Link"
						onClick={handleSubmit}
						disabled={state.loading}
					/>
				</form>
			) : (
				<form className="space-y-4">
					<div className="form-head mb-4">
						{/* Logo */}
						<div className="logos flex justify-center items-center mb-4">
							<img
								src="src\assets\mailsent.png"
								alt="logo"
								className="text-center w-[120px]"
							/>
						</div>
						<h2 className=" text-xl md:text-xl font-semibold tracking-tight text-gray-900">
							Check your Email
						</h2>
						<p className="">
							A link has been sent to your email, please check.
						</p>
						<a href="/login">
							<Button text="Back to login" className="mt-6" />
						</a>
					</div>
				</form>
			)}
		</React.Fragment>
	);
};
export default ForgotPasswordForm;
