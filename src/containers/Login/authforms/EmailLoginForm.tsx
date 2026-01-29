import { useState } from "react";
import { Button } from "../common/formElements/Button";
import FormInput from "../common/formElements/FormInput";


export const EmailLoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    } 
    console.log(name, value);
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const loginData = { email, password };
       await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
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
    setEmail("");
    setPassword("");
  }
  return (
        <form className="space-y-4">
          <FormInput
            name="email"
            label="Email"
            placeholder="john@mail.com"
            value={email}
            onChange={handleChange}
          />

          <FormInput
            name="password"
            label="Password"
            placeholder="Enter your password"
            type="password"
            value={password}
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