import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/useAuth";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/FormElements/FormInput";
import { EMAIL_REGEX } from "../../Login/constant";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => {
      if (!prev[name as keyof Errors]) return prev; // nothing to clear

      const newErrors = { ...prev };
      delete newErrors[name as keyof Errors];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      // ✅ Check if password reset is required
      if (result.requiresPasswordReset) {
        navigate("/reset-password");
      } else {
        navigate("/");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
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
        error={errors?.email}
      />

      <FormInput
        name="password"
        label="Password"
        placeholder="Enter your password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors?.password}
      />

      <div className="flex justify-end">
        <a
          href="/forgot-password"
          className="text-sm text-blue-600 hover:underline"
        >
          Forgot password?
        </a>
      </div>

      <Button text="Sign In" onClick={handleSubmit} disabled={loading} />
    </form>
  );
};
export default EmailLoginForm;
