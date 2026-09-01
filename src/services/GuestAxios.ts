import axios from "axios";
import { API_BASE_URL } from "./ServerAxios";

// Deliberately NOT reusing ServerAxios's interceptors — those read
// "authToken" and, on 401, attempt staff-session recovery (/auth/refresh,
// /users/me). Neither applies to a guest session, and running that
// recovery flow against a guest 401 is actively wrong: it wastes calls
// and could interfere with a staff session's own token in the same tab.
export const GuestAxios = axios.create({
  baseURL: API_BASE_URL,
});

GuestAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("guestAuthToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a genuine 401 (expired/invalid guest session), the only correct
// recovery is re-OTP or re-login — there's no refresh token to fall
// back on (see guestAuth.services.ts). Clear the stale token and bounce
// to login rather than retrying anything.
GuestAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("guestAuthToken");
      window.location.href = "/web/guest/login";
    }
    return Promise.reject(error);
  },
);
