import { useState } from "react";
import Button from "../common/Button";
import { Modal } from "../common/Modal";
import FormInput from "../FormElements/FormInput";
import { useAuth } from "../../context/Auth/useAuth";
import ProfileCardRenderer from "../common/ProfileCardRenderer";

interface UserMetaFormProps {
	userRole: "ADMIN" | "MANAGER" | "VIEWER";
}
const UserMetaCard = ({ userRole }: UserMetaFormProps) => {
	const [open, setOpen] = useState(false);
	const handleSave = () => {
		console.log("Saving changes...");
		setOpen(false);
	};

	const isViewer = userRole === "VIEWER";
	const { user } = useAuth();

	const fields = [
		{ label: "Facebook", value: "https://www.facebook.com/PimjoHQ" },
		{ label: "X.com", value: "https://x.com/PimjoHQ" },
		{ label: "LinkedIn", value: "https://www.linkedin.com/company/pimjo" },
		{ label: "Instagram", value: "https://instagram.com/PimjoHQ" },
	];
	return (
		<>
			<ProfileCardRenderer
				header={{
					avatar: "/user.png",
					title: `${user?.first_name} ${user?.last_name}`,
					subtitle: "Team Manager • Arizona, United States",
				}}
				fields={fields}
				editable={!isViewer}
				onEdit={() => setOpen(true)}
			/>

			{/* Modal */}
			<Modal open={open} onClose={() => setOpen(false)}>
				<div className="max-w-[600px] mx-auto p-6 bg-white rounded-xl text-sm">
					{/* HEADER */}
					<div className="px-8 pt-6 pb-4 mb-4 border-b border-gray-100">
						<h4 className="text-2xl font-semibold text-gray-800">
							Edit Profile
						</h4>
						<p className="text-sm text-gray-500">
							Update your details to keep your profile up-to-date.
						</p>
					</div>

					{/* BODY (Scrollable) */}
					<div className="x">
						<form className="space-y-8">
							<div className="grid md:grid-cols-2 grid-cols-1 gap-4">
								<FormInput
									name="facebook"
									label="Facebook"
									type="text"
									value="https://www.facebook.com/PimjoHQ"
								/>
								<FormInput
									name="twitter"
									label="X.com"
									type="text"
									value="https://x.com/PimjoHQ"
								/>
								<FormInput
									name="linkedin"
									label="LinkedIn"
									type="text"
									value="https://www.linkedin.com/company/pimjo"
								/>
								<FormInput
									name="instagram"
									label="Instagram"
									type="text"
									value="https://instagram.com/PimjoHQ"
								/>
							</div>
						</form>
					</div>

					{/* FOOTER (Sticky) */}
					<div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-gray-100 bg-white">
						<Button
							text="Cancel"
							onClick={() => setOpen(false)}
							status="brand"
						/>
						<Button text="Save Changes" onClick={handleSave} status="brand" />
					</div>
				</div>
			</Modal>
		</>
	);
};
export default UserMetaCard;
