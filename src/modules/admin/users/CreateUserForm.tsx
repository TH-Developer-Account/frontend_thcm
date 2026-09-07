import Button from "../../../components/common/Button";
import Checkbox from "../../../components/forms/Checkbox";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";
import DatePickerInput from "../../../components/common/DatePickerInput";
import type { FormEvent } from "react";
import type { UserFormField, UserType } from "./user-management.types";
import type { UsersController } from "./useUsersData";
import Card from "../../../components/common/Card";

interface UserFormProps {
	controller: UsersController;
}

type TextField = Exclude<
	UserFormField,
	"isDefaultContact" | "isActive" | "userType" | "joinedOn"
>;

type TextFieldConfig = {
	name: TextField;
	label: string;
	type?: "text" | "email" | "password" | "tel" | "date";
};

const TEXT_FIELDS: TextFieldConfig[] = [
	{ name: "employeeCode", label: "Employee Code" },
	{ name: "firstName", label: "First Name" },
	{ name: "lastName", label: "Last Name" },
	{ name: "internalId", label: "Internal ID" },
	{ name: "bydId", label: "BYD ID" },
	{ name: "s4Id", label: "S4 ID" },
	{ name: "tallyId", label: "Tally ID" },
	{ name: "c4cId", label: "C4C ID" },
	{ name: "password", label: "Password", type: "password" },
	{ name: "phoneNumber", label: "Phone Number", type: "tel" },
	{ name: "email", label: "Email ID", type: "email" },
	{ name: "region", label: "Region" },
	{ name: "address", label: "Address" },
	{ name: "zone", label: "Zone" },
	{ name: "branch", label: "Branch" },
	{ name: "department", label: "Department" },
	{ name: "role", label: "Role" },
	{ name: "designation", label: "Designation" },
	{ name: "vertical", label: "Vertical" },
	{ name: "bpInternalCode", label: "BP Internal Code" },
	{ name: "managerCode1", label: "Manager Code 1" },
	{ name: "managerCode2", label: "Manager Code 2" },
];

const USER_TYPE_OPTIONS: Array<{ label: string; value: UserType }> = [
	{ label: "Select", value: "Select" },
	{ label: "THCM Employee", value: "THCM" },
	{ label: "Dealer", value: "DEALER" },
	{ label: "Customer", value: "CUSTOMER" },
];

// form.joinedOn is stored as a "YYYY-MM-DD" string (see mapUserToForm /
// mapUserFormToCreatePayload), but DatePickerInput works with real Date
// objects. These two helpers bridge that boundary.
const parseJoinedOn = (value: string): Date | undefined => {
	if (!value) return undefined;

	const parsed = new Date(`${value}T00:00:00`);
	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const formatJoinedOn = (date: Date | undefined): string => {
	if (!date) return "";

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
};

export function CreateUserForm({ controller }: UserFormProps) {
	const {
		pageMode,
		form,
		fieldErrors,
		isCreating,
		isUpdating,
		handleFormChange,
		handleCancelForm,
		handleSubmitUser,
	} = controller;

	const isEditMode = pageMode === "edit";
	const isSaving = isCreating || isUpdating;

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		void handleSubmitUser();
	};

	return (
		<Card
			padding="spacious"
			// title={
			// 	<div>
			// 		<h2 className="text-lg font-semibold text-gray-900">
			// 			{isEditMode ? "Edit User" : "Create User"}
			// 		</h2>
			// 		<p className="text-sm text-gray-500">
			// 			{isEditMode
			// 				? "Update the user master information. Leave password blank to keep it unchanged."
			// 				: "Enter the complete user master information."}
			// 		</p>
			// 	</div>
			// }
			footer={
				<div className="flex justify-end gap-2 ">
					<Button
						type="button"
						text="Cancel"
						variant="outline"
						disabled={isSaving}
						onClick={handleCancelForm}
						size="sm"
					/>
					<Button
						type="submit"
						text={
							isSaving
								? "Saving..."
								: isEditMode
									? "Update User"
									: "Create User"
						}
						variant="brand"
						disabled={isSaving}
						size="sm"
						form="user-management-form"
					/>
				</div>
			}
		>
			<form
				id="user-management-form"
				onSubmit={handleSubmit}
				className="user-management-form"
			>
				<div>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{TEXT_FIELDS.map(({ name, label, type = "text" }) => (
							<FormInput
								key={name}
								name={name}
								label={label}
								type={type}
								value={form[name]}
								// required={name !== "password" || !isEditMode}
								disabled={isSaving}
								error={fieldErrors[name]}
								onChange={(event) => handleFormChange(name, event.target.value)}
							/>
						))}

						<DatePickerInput
							label="Joined On"
							mode="single"
							value={parseJoinedOn(form.joinedOn)}
							onChange={(nextValue) =>
								handleFormChange(
									"joinedOn",
									formatJoinedOn(
										nextValue instanceof Date ? nextValue : undefined,
									),
								)
							}
							placeholder="Select joining date"
							disabled={isSaving}
							disablePast={!isEditMode}
							error={fieldErrors.joinedOn}
						/>

						<SelectInput<{ label: string; value: UserType }>
							inputId="user-type"
							name="userType"
							label="User Type"
							options={USER_TYPE_OPTIONS}
							value={
								USER_TYPE_OPTIONS.find(
									(option) => option.value === form.userType,
								) ?? null
							}
							isDisabled={isSaving}
							error={fieldErrors.userType}
							onChange={(option) =>
								handleFormChange("userType", option?.value ?? "THCM")
							}
						/>
						<div className="mt-4 items-center flex">
							<Checkbox
								name="isDefaultContact"
								label="Default Contact"
								checked={form.isDefaultContact}
								disabled={isSaving}
								onChange={(checked) =>
									handleFormChange("isDefaultContact", checked)
								}
							/>
							<Checkbox
								name="isActive"
								label="Active"
								checked={form.isActive}
								disabled={isSaving}
								onChange={(checked) => handleFormChange("isActive", checked)}
							/>
						</div>
					</div>
				</div>
				{/* 
				{formError ? (
					<p className="mt-3 text-sm text-red-600" role="alert">
						{formError}
					</p>
				) : null} */}
			</form>
		</Card>
	);
}
