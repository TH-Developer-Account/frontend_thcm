import { useState } from "react";
import { Alert } from "../../../components/common/Alert";
import { Modal } from "../../../components/common/Modal";
import { Toast } from "../../../components/common/Toast";
import { AuthLayout } from "../../../layout/AuthLayout";

export const TestPage = () => {
	const [open, setOpen] = useState(false);

	return (
		<AuthLayout className="max-w-[800px]">
			<button
				className="rounded bg-blue-600 px-4 py-2 text-white"
				onClick={() => setOpen(true)}
			>
				Open Modal
			</button>

			<Modal open={open} title="Confirm Action" onClose={() => setOpen(false)}>
				<Alert
					variant="success"
					title="Success!"
					description="Your changes have been saved successfully."
					primaryAction={{
						label: "Stay",
						onClick: () => setOpen(true),
					}}
					secondaryAction={{
						label: "Leave",
						onClick: () => setOpen(false),
					}}
				/>
			</Modal>
			<div className="fixed top-4 right-4 z-50 space-y-3">
				<Toast
					id="1"
					type="success"
					title="Congratulations!"
					description="Your OS has been updated to the latest version."
					onClose={() => setOpen(false)}
					className="mt-4"
				/>
			</div>
			<Toast
				id="2"
				type="info"
				title="Information!"
				description="Your OS has been updated to the latest version."
				onClose={() => setOpen(false)}
				className="mt-4"
			/>

			<Toast
				id="3"
				type="warning"
				title="Warning!"
				description="Your OS has been updated to the latest version."
				onClose={() => setOpen(false)}
				className="mt-4"
			/>

			<Toast
				id="4"
				type="error"
				title="Error!"
				description="Your OS has been updated to the latest version."
				onClose={() => setOpen(false)}
				className="mt-4"
			/>
		</AuthLayout>
	);
};
