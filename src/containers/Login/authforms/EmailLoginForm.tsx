import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/useAuth";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/FormElements/FormInput";
import { EMAIL_REGEX } from "../../Login/constant";
import PasswordInput from "../../../components/FormElements/PasswordInput";
import { useToast } from "../../../context/AuthContext";

type Errors = {
	email?: string;
	password?: string;
};

const EmailLoginForm = () => {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Errors>({});
	const { login } = useAuth();
	const navigate = useNavigate();
	const { showToast } = useToast();
	const validateForm = () => {
		const newErrors: Errors = {};

		if (!formData.email) {
			newErrors.email = "Please fill in the email field";
		} else if (!EMAIL_REGEX.test(formData.email)) {
			newErrors.email = "Invalid email format";
		}

		if (!formData.password) {
			newErrors.password = "Please fill in the password field";
		}

		setErrors(newErrors);

		// ✅ if no errors, form is valid
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		setErrors((prev) => {
			if (!prev[name as keyof Errors]) return prev;

			const newErrors = { ...prev };
			delete newErrors[name as keyof Errors];
			return newErrors;
		});
	};

	const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		// 🚫 Stop here if validation fails
		if (!validateForm()) return;
		setLoading(true);
		try {
			const result = await login(formData.email, formData.password);
			// ✅ Check if password reset is required
			if (result.requiresPasswordReset) {
				navigate("/reset-password");
			} else {
				navigate("/");
			}
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
			setLoading(false);
		}
	};

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		setErrors((prev) => {
			const newErrors = { ...prev };

			if (name === "email") {
				if (!value) {
					newErrors.email = "Please fill in the email field";
				} else if (!EMAIL_REGEX.test(value)) {
					newErrors.email = "Invalid email format";
				} else {
					delete newErrors.email;
				}
			}

			if (name === "password") {
				if (!value) {
					newErrors.password = "Please fill in the password field";
				} else {
					delete newErrors.password;
				}
			}

			return newErrors;
		});
	};

	return (
		<form className="space-y-4">
			<FormInput
				name="email"
				label="Email"
				placeholder="john@mail.com"
				value={formData.email}
				onChange={handleChange}
				onBlur={handleBlur}
				required
				error={errors?.email}
			/>
			<PasswordInput
				name="password"
				label="Password"
				value={formData.password}
				onChange={handleChange}
				error={errors.password}
				required
				placeholder="Enter your password"
			/>

			<div className="flex justify-end">
				<a
					href="/forgot-password"
					className="text-sm text-blue-600 hover:underline brand"
				>
					Forgot password?
				</a>
			</div>

			<Button text="Sign In" onClick={handleSubmit} disabled={loading} />
		</form>
	);
};
export default EmailLoginForm;
