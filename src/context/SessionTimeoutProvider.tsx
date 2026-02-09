import { useState } from "react";
import { useIdleTimer } from "../hooks/useIdleTimer";
import { useLocation } from "react-router-dom";
import { Modal } from "../components/common/Modal";
import { Alert } from "../components/common/Alert";
import { useAuth } from "./useAuth";

const IDLE_TIMEOUT = 1 * 60 * 1000; // 1 minute
// const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

// Add all the matching EXEMPTED PATHS
const EXEMPTED_PATHS = ["/login", "/reset", "/forgot-password"];

export const SessionTimeoutProvider: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => {
	const [showModal, setShowModal] = useState(false);
	const location = useLocation();
	const { logout } = useAuth();

	const isExemptedRoute = EXEMPTED_PATHS.some((path) =>
		location.pathname.startsWith(path),
	);

	useIdleTimer({
		idleTime: IDLE_TIMEOUT,
		onIdle: () => {
			if (isExemptedRoute) return;
			setShowModal(true);
		},
	});

	const handleContinue = async () => {
		setShowModal(false);
	};

	return (
		<>
			{children}

			<Modal open={showModal} onClose={handleContinue}>
				<Alert
					variant="info"
					title="You're idle"
					description="You have been inactive. Your session will expire soon."
					primaryAction={{
						label: "Continue",
						onClick: handleContinue,
					}}
					secondaryAction={{
						label: "Log out",
						onClick: logout,
					}}
				/>
			</Modal>
		</>
	);
};
