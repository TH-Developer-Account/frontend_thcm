import { useState, useEffect, type ReactNode } from "react";
import axios from "axios";

import { GuestAuthContext } from "./GuestAuthContext";
import type { Guest } from "./GuestAuthContext";
import { useToast } from "../Auth/AuthContext";
import { GuestAxios } from "../../services/GuestAxios";

const GUEST_TOKEN_KEY = "guestAuthToken";

const guest_api_routes = {
  send_otp: "/guest/send-otp",
  verify_otp: "/guest/verify-otp",
  login: "/guest/login",
};

interface GuestAuthProviderProps {
  children: ReactNode;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function GuestAuthProvider({ children }: GuestAuthProviderProps) {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // No "/guest/me" endpoint exists yet — see prior discussion. `guest`
  // starts null even with a valid stored token until the next successful
  // login call populates it.
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const sendOtp = async (mobile: string) => {
    try {
      await GuestAxios.post(guest_api_routes.send_otp, { mobile });
      showToast({
        type: "success",
        title: "OTP sent",
        description: "A verification code was sent to your mobile number.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Unable to send OTP",
        description: getErrorMessage(error, "Failed to send OTP"),
      });
      throw error;
    }
  };

  const verifyOtp = async (mobile: string, otp: string) => {
    try {
      const { data } = await GuestAxios.post(guest_api_routes.verify_otp, {
        mobile,
        otp,
      });

      localStorage.setItem(GUEST_TOKEN_KEY, data.accessToken);
      setGuest(data.guest);

      showToast({
        type: "success",
        title: "Signed in",
        description: "You have logged in successfully.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Verification failed",
        description: getErrorMessage(error, "Invalid OTP"),
      });
      throw error;
    }
  };

  const loginWithPassword = async (email: string, password: string) => {
    try {
      const { data } = await GuestAxios.post(guest_api_routes.login, {
        email,
        password,
      });

      localStorage.setItem(GUEST_TOKEN_KEY, data.accessToken);
      setGuest(data.guest);

      showToast({
        type: "success",
        title: "Signed in",
        description: "You have logged in successfully.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Sign-in failed",
        description: getErrorMessage(error, "Invalid credentials"),
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(GUEST_TOKEN_KEY);
    setGuest(null);
    window.location.href = "/guest/login";
  };

  return (
    <GuestAuthContext.Provider
      value={{
        guest,
        isLoading,
        sendOtp,
        verifyOtp,
        loginWithPassword,
        logout,
      }}
    >
      {children}
    </GuestAuthContext.Provider>
  );
}
