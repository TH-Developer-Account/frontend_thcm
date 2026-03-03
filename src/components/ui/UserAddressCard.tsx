import { useState } from "react";
import Button from "../../components/common/Button";
import FormInput from "../../components/FormElements/FormInput";
import { Modal } from "../../components/common/Modal";
import { Pencil } from "lucide-react";

interface UserAddressFormProps {
	userRole: "ADMIN" | "MANAGER" | "VIEWER";
}

const UserAddressCard = ({ userRole }: UserAddressFormProps) => {
	const [open, setOpen] = useState(false);
	const isViewer = userRole === "VIEWER";

	const [values, setValues] = useState({
		country: "United States",
		cityState: "Phoenix, Arizona, United States",
		postalCode: "ERT 2489",
		taxId: "AS4568384",
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
			{/* Address Card */}
			<div className="p-6 bg-white rounded-xl shadow-sm text-left text-sm lg:text-sm text-xs">
				<div className="flex justify-between items-start mb-4">
					<h2 className="font-semibold text-gray-900 text-lg lg:text-xl">
						Address
					</h2>

					{!isViewer && (
						<Button
							text="Edit"
							onClick={() => setOpen(true)}
							Icon={Pencil}
							iconPosition="right"
							status="brand"
						/>
					)}
				</div>

				<div className="grid md:grid-cols-2 grid-cols-1 gap-4">
					<div>
						<p className="text-gray-500 text-xs">Country</p>
						<p className="font-medium text-gray-800">{values.country}</p>
					</div>

					<div>
						<p className="text-gray-500 text-xs">City / State</p>
						<p className="font-medium text-gray-800">{values.cityState}</p>
					</div>

					<div>
						<p className="text-gray-500 text-xs">Postal Code</p>
						<p className="font-medium text-gray-800">{values.postalCode}</p>
					</div>

					<div>
						<p className="text-gray-500 text-xs">TAX ID</p>
						<p className="font-medium text-gray-800">{values.taxId}</p>
					</div>
				</div>
			</div>

			{/* Modal */}
			<Modal open={open} title="Confirm Action" onClose={() => setOpen(false)}>
				<div className="max-w-[600px] mx-auto p-6 bg-white rounded-xl text-sm">
					<h2 className="font-semibold mb-4 text-gray-900 text-lg">
						Edit Address
					</h2>

					<div className="grid md:grid-cols-2 grid-cols-1 gap-4">
						<FormInput
							name="country"
							label="Country"
							value={values.country}
							disabled={isViewer}
							onChange={(e) => handleChange("country", e.target.value)}
						/>

						<FormInput
							name="cityState"
							label="City / State"
							value={values.cityState}
							disabled={isViewer}
							onChange={(e) => handleChange("cityState", e.target.value)}
						/>

						<FormInput
							name="postalCode"
							label="Postal Code"
							value={values.postalCode}
							disabled={isViewer}
							onChange={(e) => handleChange("postalCode", e.target.value)}
						/>

						<FormInput
							name="taxId"
							label="TAX ID"
							value={values.taxId}
							disabled={isViewer}
							onChange={(e) => handleChange("taxId", e.target.value)}
						/>
					</div>

					{!isViewer && (
						<div className="mt-6 flex justify-end gap-3">
							<Button text="Cancel" onClick={() => setOpen(false)} />
							<Button text="Save Changes" onClick={handleSave} />
						</div>
					)}
				</div>
			</Modal>
		</>
	);
};

export default UserAddressCard;
