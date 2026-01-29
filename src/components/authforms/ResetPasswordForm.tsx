import { useState } from "react";
import { Button } from "../common/formElements/Button";
import FormInput from "../common/formElements/FormInput";


export const ResetPasswordForm = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "oldPassword") {
      setOldPassword(value);
    } else if (name === "newPassword") {
      setNewPassword(value);
    } else if (name === "confirmPassword") {
      setConfirmPassword(value);
    }
    console.log(name, value);
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const resetPasswordData = { oldPassword, newPassword, confirmPassword };
       await fetch("/api/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(resetPasswordData),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("Success:", data);
            // Handle successful login 
          })
          .catch((error) => {
            console.error("Error:", error);
            // Handle login error
          }); 
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }
  return (
        <form className="space-y-4">
          <FormInput
            name="oldPassword"
            label="Old Password"
            placeholder="Enter your old password"
            type="password"
            value={oldPassword}
            onChange={handleChange}
          />

          <FormInput
            name="newPassword"
            label="New Password"
            placeholder="Enter your new password"
            type="password"
            value={newPassword}
            onChange={handleChange}
          />

          <FormInput
            name="confirmPassword"
            label="Confirm New Password"
            placeholder="Confirm your new password"
            type="password"
            value={confirmPassword}
            onChange={handleChange}
          />
          <div className="flex justify-end">
            <a href="#" className="text-sm text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>

          <Button text="Sign In" onClick={handleSubmit} />
        </form>
  );
};