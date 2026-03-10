import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import "./App.css";
import "./styles/token.css";
import "./styles/theme.css";
import "./styles/typography.css";
import "./styles/globals.css";
import "./styles/color.css";
import "./styles/token.css";
import "./styles/form.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./components/FormElements/input.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/Auth/AuthProvider.tsx";
import ToastProvider from "./components/common/Toast/ToastProvider.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<ToastProvider>
				<AuthProvider>
					<div
						className="container 
						overflow-hidden"
					>
						<App />
					</div>
				</AuthProvider>
			</ToastProvider>
		</BrowserRouter>
	</StrictMode>,
);
