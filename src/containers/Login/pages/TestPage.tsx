import { useState } from "react";
import { Alert } from "../../../components/common/Alert";
import { Modal } from "../../../components/common/Modal";
import { Toast } from "../../../components/common/Toast";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import Card from "../../../components/common/Card";

export const TestPage = () => {
	const [open, setOpen] = useState(false);

	return (
		<PageSectionLayout>
			<Modal
				open={open}
				title="Confirm Action"
				onClose={() => setOpen(false)}
				mode="shell"
				size="sm"
				dialogRole="alertdialog"
				ariaLabel="Delete profile confirmation"
			>
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
			<Card>
				<button
					className="rounded bg-blue-600 px-4 py-2 text-white"
					onClick={() => setOpen(true)}
				>
					Open Modal
				</button>
				<Toast
					id="1"
					type="success"
					title="Congratulations!"
					description="Your OS has been updated to the latest version."
					onClose={() => setOpen(false)}
					className="mt-4"
				/>
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
			</Card>
		</PageSectionLayout>
	);
};
