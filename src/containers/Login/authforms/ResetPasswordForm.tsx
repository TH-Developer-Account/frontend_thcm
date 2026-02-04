import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ServerAxios } from "../../../services/ServerAxios";
import { useAuth } from "../../../context/useAuth";
import Button from "../../../components/common/Button";
import { PasswordPolicy } from "../constant";
import PasswordInput from "../../../components/FormElements/PasswordInput";

interface Errors {
	password?: string;
	confirmPassword?: string;
	general?: string;
}

const ResetPasswordForm = () => {
	const navigate = useNavigate();
	const { token } = useParams<{ token: string }>();
	const { resetPassword } = useAuth();
	const [state, setState] = useState({
		oldPassword: "",
		newPassword: "",
		confirmPassword: "",
		errors: {} as Errors,
		loading: false,
		showFocus: false,
	});

	const {
		oldPassword,
		newPassword,
		confirmPassword,
		errors,
		loading,
		showFocus,
	} = state;
	// ✅ Password policy validation
	const isValid = useMemo(
		() => PasswordPolicy.every((rule) => rule.test(newPassword)),
		[newPassword],
	);

	const validate = (): boolean => {
		const newErrors: Errors = {};

		if (!newPassword) {
			newErrors.password = "Password is required";
		} else if (!isValid) {
			newErrors.password = "Password does not meet policy requirements";
		}

		if (!confirmPassword) {
			newErrors.confirmPassword = "Please confirm your password";
		} else if (confirmPassword !== newPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		setState((prev) => ({ ...prev, errors: newErrors }));
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		setState((prev) => ({
			...prev,
			[name]: value,
			errors: { ...prev.errors, [name]: undefined },
		}));
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!validate()) return;

		setState((prev) => ({ ...prev, loading: true }));

		try {
			if (!token) {
				resetPassword(oldPassword, newPassword);
			} else {
				await ServerAxios.post(`/auth/reset-password/${token}`, {
					newPassword,
				});
			}
			setState({
				oldPassword: "",
				newPassword: "",
				confirmPassword: "",
				errors: {},
				loading: false,
				showFocus: false,
			});
			navigate("/login");
		} catch (err) {
			console.log("Error====>", err);
			setState((prev) => ({
				...prev,
				loading: false,
				errors: { general: "Something went wrong. Please try again." },
			}));
		}
	};

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			<div className="form-head mb-4">
				{/* Logo */}
				<div className="logos flex justify-center items-center mb-4">
					<img
						src="src\assets\resetpwd.png"
						alt="logo"
						className="text-center w-[100px]"
					/>
				</div>
				<h2 className=" text-xl md:text-xl font-semibold tracking-tight text-gray-900">
					Reset your Password?
				</h2>
				<p className="">Please enter your password</p>
			</div>
			{/* Old Password */}
			{!token && (
				<div className="relative">
					<PasswordInput
						name="oldPassword"
						label="Old Password"
						placeholder="Enter your old password"
						value={oldPassword}
						onChange={handleChange}
						error={errors.password}
						required
						className={
							isValid ? "border-green-500 focus:ring-green-500 pr-10" : ""
						}
					/>
				</div>
			)}
			{/* New Password */}
			<div className="relative">
				<PasswordInput
					label="New Password"
					name="newPassword"
					placeholder="Enter your new password"
					value={newPassword}
					onChange={handleChange}
					error={errors.password}
					onFocus={
						showFocus
							? undefined
							: () => setState((prev) => ({ ...prev, showFocus: true }))
					}
					required
					className={
						isValid ? "border-green-500 focus:ring-green-500 pr-10" : ""
					}
				/>
			</div>
			{showFocus && !isValid && (
				<>
					{/* Password rules */}
					<ul className="mt-2 space-y-1 text-xs grid grid-cols-1 md:grid-cols-2 transition-colors duration-200 ease-in-out">
						{PasswordPolicy.map((rule, index) => (
							<li
								key={index}
								className={`flex items-center gap-2 ${
									rule.test(newPassword) ? "text-green-600" : "text-gray-500"
								}`}
							>
								<span>{rule.test(newPassword) ? "✔" : "•"}</span>
								{rule.label}
							</li>
						))}
					</ul>
				</>
			)}

			<PasswordInput
				name="confirmPassword"
				label="Confirm New Password"
				placeholder="Confirm your new password"
				value={confirmPassword}
				onChange={handleChange}
				error={errors.confirmPassword}
				required
			/>
			{errors.general && (
				<p className="text-sm text-red-600 text-left">{errors.general}</p>
			)}
			<Button
				text={loading ? "Saving..." : "Change Password"}
				className=""
				type="submit"
				disabled={loading || !isValid}
			/>
		</form>
	);
};
export default ResetPasswordForm;
