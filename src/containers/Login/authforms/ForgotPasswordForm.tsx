import { useState } from "react";
import ServerAxios from "../../../services/ServerAxios";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/FormElements/FormInput";
import { EMAIL_REGEX } from "../constant";
import { api_routes } from "../constant";

type Errors = {
  email?: string;
};

const ForgotPasswordForm = () => {
  const [state, setState] = useState({
    email: "",
    loading: false,
    errors: {} as Errors,
    showSendMailStatus: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value }));
    setState((prev) => {
      if (!prev.errors[name as keyof Errors]) return prev; // nothing to clear

      const newErrors = { ...prev.errors };
      delete newErrors[name as keyof Errors];
      return { ...prev, errors: newErrors };
    });
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, loading: true }));
    try {
      // API Route is defined in constant.ts
      const response = await ServerAxios.post(
        api_routes.forgot_password_api_route,
        {
          email: state.email,
        },
      );
      setState((prev) => ({ ...prev, showSendMailStatus: true }));
      console.log("Success:", response.data);
    } catch (error: unknown) {
      console.error(" error:", error);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setState((prev) => {
      const newErrors = { ...prev.errors };

      if (name === "email") {
        if (!value) {
          newErrors.email = "Please fill in the email field";
        } else if (!EMAIL_REGEX.test(value)) {
          newErrors.email = "Invalid email format";
        } else {
          delete newErrors.email;
        }
      }

      return {
        ...prev,
        errors: newErrors,
      };
    });
  };

  return (
    <>
      {!state.showSendMailStatus ? (
        <form className="space-y-4">
          <div className="form-head mb-4">
            {/* Logo */}
            <div className="logos flex justify-center items-center mb-4">
              <img
                src="src\assets\sendlink.png"
                alt="logo"
                className="text-center w-[100px]"
              />
            </div>
            <h2 className=" text-xl md:text-xl font-semibold tracking-tight text-gray-900">
              Forgot your Password?
            </h2>
            <p className="">Please enter your email</p>
          </div>
          <FormInput
            name="email"
            label="Email"
            placeholder="john@mail.com"
            value={state.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={state.errors?.email}
          />

          <Button
            text="Send Reset Link"
            onClick={handleSubmit}
            disabled={state.loading}
          />
        </form>
      ) : (
        <form className="space-y-4">
          <div className="form-head mb-4">
            {/* Logo */}
            <div className="logos flex justify-center items-center mb-4">
              <img
                src="src\assets\mailsent.png"
                alt="logo"
                className="text-center w-[120px]"
              />
            </div>
            <h2 className=" text-xl md:text-xl font-semibold tracking-tight text-gray-900">
              Check your Email
            </h2>
            <p className="">
              A link has been sent to your email, please check.
            </p>
            <a href="/login">
              <Button text="Back to login" className="mt-6" />
            </a>
          </div>
        </form>
      )}
    </>
  );
};
export default ForgotPasswordForm;
