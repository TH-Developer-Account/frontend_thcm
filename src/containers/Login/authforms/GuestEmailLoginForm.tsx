import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import { useGuestAuth } from "../../../context/Auth/useGuestAuth";
import { EMAIL_REGEX } from "../../Login/constant";

type GuestEmailLoginData = {
  email: string;
  password: string;
};

const GuestEmailLoginForm = () => {
  const navigate = useNavigate();
  const { loginWithPassword } = useGuestAuth();

  const [formData, setFormData] = useState<GuestEmailLoginData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<GuestEmailLoginData>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const nextErrors: Partial<GuestEmailLoginData> = {};

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await loginWithPassword(formData.email.trim(), formData.password);
      navigate("/guest/vendor-onboarding");
    } catch {
      // toast already shown by GuestAuthProvider
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-form-fields">
        <FormInput
          name="email"
          label="Email address"
          type="email"
          placeholder="name@company.com"
          value={formData.email}
          onChange={handleChange}
          required
          error={errors.email}
          autoComplete="email"
        />

        <FormInput
          name="password"
          label="Password"
          type="password"
          placeholder="Enter the password from your email"
          value={formData.password}
          onChange={handleChange}
          required
          error={errors.password}
          autoComplete="current-password"
        />
      </div>

      <Button
        text={loading ? "Signing in..." : "Sign in"}
        disabled={loading}
        fullWidth
        type="submit"
        appearance="cta"
        variant="brand"
      />
    </form>
  );
};

export default GuestEmailLoginForm;
