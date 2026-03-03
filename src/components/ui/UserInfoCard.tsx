import { useState } from "react";
import Button from "../../components/common/Button";
import FormInput from "../../components/FormElements/FormInput";
import { Modal } from "../../components/common/Modal";
import { Pencil } from "lucide-react";
import { useAuth } from "../../context/Auth/useAuth";

interface PersonalInfoProps {
	userRole: "ADMIN" | "MANAGER" | "VIEWER";
}

const UserInfoCard = ({ userRole }: PersonalInfoProps) => {
	const [open, setOpen] = useState(false);
	const isViewer = userRole === "VIEWER";
	const { user } = useAuth();
	const [values, setValues] = useState({
		firstName: "Musharof",
		lastName: "Chowdhury",
		email: "randomuser@pimjo.com",
		phone: "+09 363 398 46",
		bio: "Team Manager",
	});

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
			{/* Card */}
			<div className="p-5 border border-gray-200 rounded-2xl lg:p-6 bg-white text-left shadow-sm">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
					<div className="w-full">
						<h2 className="text-lg font-semibold text-gray-800 lg:mb-6">
							Personal Information
						</h2>

						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7">
							<div>
								<p className="mb-2 text-xs text-gray-500">First Name</p>
								<p className="text-sm font-medium text-gray-800">
									{user?.first_name}
								</p>
							</div>

							<div>
								<p className="mb-2 text-xs text-gray-500">Last Name</p>
								<p className="text-sm font-medium text-gray-800">
									{user?.last_name}
								</p>
							</div>

							<div>
								<p className="mb-2 text-xs text-gray-500">Email</p>
								<p className="text-sm font-medium text-gray-800">
									{user?.email}
								</p>
							</div>

							<div>
								<p className="mb-2 text-xs text-gray-500">Phone</p>
								<p className="text-sm font-medium text-gray-800">
									{user?.phone_number}
								</p>
							</div>

							<div className="lg:col-span-2">
								<p className="mb-2 text-xs text-gray-500">Bio</p>
								<p className="text-sm font-medium text-gray-800">
									{values.bio}
								</p>
							</div>
						</div>
					</div>

					{/* Edit Button */}
					{!isViewer && (
						<Button
							text="Edit"
							onClick={() => setOpen(true)}
							Icon={Pencil}
							iconPosition="right"
							className="lg:w-auto"
							status="brand"
						/>
					)}
				</div>
			</div>

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
								value={values.bio}
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
