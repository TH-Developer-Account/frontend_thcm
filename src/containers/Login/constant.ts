export const EMAIL_REGEX = /\S+@\S+\.\S+/;
export const MOBILE_REGEX = /^[6-9]\d{9}$/;

export const api_routes = {
  login_api_route: "/api/login",
  forgot_password_api_route: "/auth/forgot-password",
  reset_password_api_route: "/api/reset-password",
  register_api_route: "/api/register",
  verify_email_api_route: "/api/verify-email",
};

// passwordPolicy.ts
export const PasswordPolicy = [
  {
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    label: "One uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: "One lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    label: "One number",
    test: (value: string) => /\d/.test(value),
  },
  {
    label: "One special character",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
];
