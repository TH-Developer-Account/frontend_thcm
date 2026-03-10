import { useState } from "react";
import Button from "../../components/common/Button";
import FormInput from "../../components/FormElements/FormInput";
import { Modal } from "../../components/common/Modal";
import { useAuth } from "../../context/Auth/useAuth";
import ProfileCardRenderer from "../common/ProfileCardRenderer";

interface PersonalInfoProps {
	userRole: "ADMIN" | "MANAGER" | "VIEWER";
}

const UserInfoCard = ({ userRole }: PersonalInfoProps) => {
	const [open, setOpen] = useState(false);
	const isViewer = userRole === "VIEWER";
	const { user } = useAuth();
	const [values, setValues] = useState({});

	const fields = [
		{ label: "First Name", value: user?.first_name },
		{ label: "Last Name", value: user?.last_name },
		{ label: "Email", value: user?.email },
		{ label: "Phone", value: user?.phone_number },
		{ label: "Bio", value: "Team Manager", span: 2 },
	];
	const handleChange = (field: string, value: string) => {
		setValues((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSave = () => {
		console.log("Saving changes...", values);
		setOpen(false);
	};

	return (
		<>
			<ProfileCardRenderer
				title="User Info"
				fields={fields}
				editable={!isViewer}
				onEdit={() => setOpen(true)}
			/>

			{/* Modal */}
			<Modal open={open} onClose={() => setOpen(false)}>
				<div className="relative w-full max-w-[600px] rounded-3xl bg-white p-6 mx-auto h-full overflow-y-auto">
					<div className="mb-6">
						<h4 className="text-2xl font-semibold text-gray-800">
							Edit Personal Information
						</h4>
						<p className="text-sm text-gray-500">
							Update your personal details below.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
						<FormInput
							name="firstName"
							label="First Name"
							value={user?.first_name}
							onChange={(e) => handleChange("firstName", e.target.value)}
						/>

						<FormInput
							name="lastName"
							label="Last Name"
							value={user?.last_name}
							onChange={(e) => handleChange("lastName", e.target.value)}
						/>

						<FormInput
							name="email"
							label="Email"
							value={user?.email}
							onChange={(e) => handleChange("email", e.target.value)}
						/>

						<FormInput
							name="phone"
							label="Phone"
							value={user?.phone_number}
							onChange={(e) => handleChange("phone", e.target.value)}
						/>

						<div className="lg:col-span-2">
							<FormInput
								name="bio"
								label="Bio"
								value="Team Manager"
								onChange={(e) => handleChange("bio", e.target.value)}
							/>
						</div>
					</div>

					{/* Footer Buttons */}
					{!isViewer && (
						<div className="flex items-center gap-3 mt-8 lg:justify-end">
							<Button text="Cancel" onClick={() => setOpen(false)} />
							<Button text="Save Changes" onClick={handleSave} />
						</div>
					)}
				</div>
			</Modal>
		</>
	);
};

export default UserInfoCard;
