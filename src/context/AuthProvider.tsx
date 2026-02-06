import { useState, useEffect } from "react";
import axios from "axios";
import { AuthContext, useToast } from "./AuthContext";
import type { ReactNode } from "react";
import type { User } from "./AuthContext";
import { ServerAxios, API_BASE_URL } from "../services/ServerAxios";
import { api_routes } from "../containers/Login/constant";
import {
	type ApiErrorResponse,
	type LoginSuccessResponse,
	// type ResetPwdSuccessResponse,
} from "./context.types";

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const { showToast } = useToast();
	// Check if user is logged in on mount
	useEffect(() => {
		const checkAuth = async () => {
			const token = localStorage.getItem("authToken");
			if (token) {
				try {
					// Try to fetch current user with existing token
					const { data } = await ServerAxios.get("/users/me"); // You'll need this endpoint
					setUser(data.user);
				} catch (error) {
					// Token invalid, will trigger refresh or logout
					localStorage.removeItem("authToken");
					console.log("ERROR====>", error);
				}
			}
			setIsLoading(false);
		};

		checkAuth();
	}, []);

	type LoginResult = {
		requiresPasswordReset: boolean;
	};

	const login = async (
		email: string,
		password: string,
	): Promise<LoginResult> => {
		try {
			const { data } = await axios.post<LoginSuccessResponse>(
				`${API_BASE_URL}${api_routes.login_api_route}`,
				{ email, password },
			);

			// 🔐 Password reset required
			if (data.requiresPasswordReset) {
				setUser(data.user);

				showToast({
					type: "warning", // 👈 makes sense UX-wise
					title: "Action required",
					description: data.message || "Please reset your password to log in", // ✅ FROM API
				});

				return { requiresPasswordReset: true };
			}

			// ✅ Normal successful login
			if (data.accessToken) {
				localStorage.setItem("authToken", data.accessToken);
			}

			setUser(data.user);

			showToast({
				type: "success",
				title: "Success",
				description: data.message || "Successfully logged in", // ✅ FROM API
			});

			return { requiresPasswordReset: false };
		} catch (err) {
			if (axios.isAxiosError<ApiErrorResponse>(err)) {
				showToast({
					type: "error",
					title: "Login failed",
					description: err.response?.data?.message || "", // ✅ FROM API
				});
			}

			throw err;
		}
	};

	const resetPassword = async (
		currentPassword: string,
		newPassword: string,
	) => {
		try {
			await axios.post(
				`${API_BASE_URL}${api_routes.reset_password_api_route}`,
				{
					email: user?.email,
					currentPassword,
					newPassword,
				},
			);
			showToast({
				type: "success",
				title: "Success",
				description: "Password reset successfully", // ✅ FROM API
			});
			setUser(null);
		} catch (err) {
			console.log("Error while resetting password=====>", err);
			showToast({
				type: "error",
				title: "Error",
				description: "Something was wrong, try again later", // ✅ FROM API
			});
		}
	};

	const logout = async () => {
		try {
			const { data } = await ServerAxios.post("/auth/logout"); // Optional: revoke refresh token on backend
			showToast({
				type: "success",
				title: "Success",
				description: data.message || "Successfully Logged out", // ✅ FROM API
			});
		} catch (error) {
			// showToast({
			// 	type: "error",
			// 	title: "Error",
			// 	description: error || "", // ✅ FROM API
			// });
			console.error("Logout error", error);
		} finally {
			localStorage.removeItem("authToken");
			setUser(null);
			window.location.href = "/login";
		}
	};

	return (
		<AuthContext.Provider
			value={{ user, login, logout, isLoading, resetPassword, setUser }}
		>
			{children}
		</AuthContext.Provider>
	);
}
