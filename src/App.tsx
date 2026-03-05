// src/App.jsx
import AppRoutes from "./routes/AppRoutes";
import { useAuth } from "./context/Auth/useAuth";

export default function App() {
  // App.tsx or your router root
  const { isLoading } = useAuth();

  if (isLoading) return <p>Loading....</p>;
  return <AppRoutes />;
}
