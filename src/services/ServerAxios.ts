// src/api/axios.ts
import axios from "axios";
import { emitTokenRefreshed } from "./tokenEvents";

// export const API_BASE_URL = "https://thcmconnect.tatahitachi.co.in/api/v1";
export const API_BASE_URL = "http://localhost:9000/api/v1";

// Single source of truth for where an unauthenticated user gets sent.
// Previously this pointed at "/web/login", a route that doesn't exist in
// this app's router (LoginPage is mounted at "/login" — see guestRoutes /
// AuthLayout's own link). That mismatch is what produced the "auth page
// refresh error": any expired-session redirect (session refresh failure,
// or a stolen/revoked token) sent the browser to a dead route instead of
// back to the sign-in screen.
const LOGIN_ROUTE = "/login";
const REFRESH_ENDPOINT = "/auth/refresh";

export const ServerAxios = axios.create({
	baseURL: API_BASE_URL,
	withCredentials: true, // Critical for httpOnly cookies
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
	refreshSubscribers.forEach((callback) => callback(token));
	refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
	refreshSubscribers.push(callback);
};

const redirectToLogin = () => {
	localStorage.removeItem("authToken");
	if (!window.location.pathname.startsWith(LOGIN_ROUTE)) {
		window.location.href = LOGIN_ROUTE;
	}
};

ServerAxios.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("authToken");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

// Response interceptor
ServerAxios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		// The refresh call itself failing with 401 must never be retried —
		// otherwise it recurses into itself indefinitely (refresh -> 401 ->
		// "retry" the refresh -> 401 -> ...). This was silently possible
		// before because only the *original* request's _retry flag was
		// checked, never the refresh request's own.
		const isRefreshCall = originalRequest?.url?.includes(REFRESH_ENDPOINT);

		// Handle 401 (expired access token)
		if (
			error.response?.status === 401 &&
			!originalRequest?._retry &&
			!isRefreshCall
		) {
			if (isRefreshing) {
				// Queue this request until refresh completes
				return new Promise((resolve) => {
					addRefreshSubscriber((token: string) => {
						originalRequest.headers.Authorization = `Bearer ${token}`;
						resolve(ServerAxios(originalRequest));
					});
				});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				// Call refresh endpoint (sends httpOnly cookie automatically)
				const { data } = await ServerAxios.post(
					`${API_BASE_URL}${REFRESH_ENDPOINT}`,
					{},
					{ withCredentials: true },
				);

				const newAccessToken = data.accessToken;
				localStorage.setItem("authToken", newAccessToken);

				emitTokenRefreshed(newAccessToken);

				isRefreshing = false;
				onRefreshed(newAccessToken);

				// Retry original request with new token
				originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
				return ServerAxios(originalRequest);
			} catch (refreshError) {
				// Refresh failed (403 from stolen token detection or expired refresh token)
				isRefreshing = false;
				refreshSubscribers = [];

				redirectToLogin();

				return Promise.reject(refreshError);
			}
		}

		// The refresh call itself came back 401/403 — session is unrecoverable.
		if (
			isRefreshCall &&
			(error.response?.status === 401 || error.response?.status === 403)
		) {
			isRefreshing = false;
			refreshSubscribers = [];
			redirectToLogin();
			return Promise.reject(error);
		}

		// Handle 403 (revoked/stolen token) - logout immediately
		if (error.response?.status === 403) {
			redirectToLogin();
		}

		return Promise.reject(error);
	},
);
