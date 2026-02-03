// src/context/AuthContext.tsx
import { createContext } from "react";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ requiresPasswordReset: boolean }>;
  logout: () => void;
  resetPassword: (currentPassword: string, newPassword: string) => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
