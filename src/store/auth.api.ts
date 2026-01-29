export interface LoginPayload {
    email: string;
    password: string;
  }
  
  export interface LoginResponse {
    token: string;
    user: {
      id: string;
      email: string;
    };
  }
  
  export const loginApi = async (
    payload: LoginPayload
  ): Promise<LoginResponse> => {
    const response = await fetch("https://example.com/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  
    if (!response.ok) {
      throw new Error("Invalid credentials");
    }
  
    return response.json();
  };
  