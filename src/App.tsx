// src/App.jsx
import AppRoutes from "./routes/AppRoutes";
import { useAuth } from "./context/Auth/useAuth";
import FullScreenLoader from "./components/common/FullScreenLoader";

export default function App() {
	// App.tsx or your router root
	const { isLoading } = useAuth();

	if (isLoading) return <FullScreenLoader />;
	return <AppRoutes />;
}
