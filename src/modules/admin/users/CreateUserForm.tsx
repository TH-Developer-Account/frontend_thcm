import { useState } from "react";

import EditableCard, {
	type EditableCardField,
} from "../../../components/common/EditableCard";
import Checkbox from "../../../components/forms/Checkbox";
import SelectInput from "../../../components/forms/SelectInput";
import DatePickerInput from "../../../components/common/DatePickerInput";

import type { UserFormField, UserType } from "./user-management.types";
import type { UsersController } from "./useUsersData";

import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import { Badge } from "../../../components/common/Badge";
import { Pencil } from "lucide-react";
import Avatar from "../../../components/common/Avatar";

interface UserFormProps {
	controller: UsersController;
}

type FormValues = UsersController["form"];

const USER_TYPE_OPTIONS: Array<{
	label: string;
	value: UserType;
}> = [
	{ label: "Select", value: "Select" },
	{ label: "THCM Employee", value: "THCM" },
	{ label: "Dealer", value: "DEALER" },
	{ label: "Customer", value: "CUSTOMER" },
];

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
		handleSubmitUser,
	} = controller;

	const isEditMode = pageMode === "edit";
	const isSaving = isCreating || isUpdating;

	const [profileImage, setProfileImage] = useState<FileUploadValue | null>(
		null,
	);

	const basicInfoFields: EditableCardField<FormValues>[] = [
		{
			name: "employeeCode",
			label: "Employee Code",
		},
		{
			name: "firstName",
			label: "First Name",
			required: true,
		},
		{
			name: "lastName",
			label: "Last Name",
			required: true,
		},
		{
			name: "email",
			label: "Email ID",
			type: "email",
			required: true,
		},
		{
			name: "phoneNumber",
			label: "Phone Number",
			type: "tel",
		},
		{
			name: "password",
			label: "Password",
			visibleInDisplay: false,
			placeholder: isEditMode ? "Leave blank to keep unchanged" : undefined,
		},

		{
			id: "userType",
			name: "userType",
			label: "User Type",
			displayValue:
				form.userType && form.userType !== "Select" ? form.userType : "--",
			render: ({ draft, disabled, setFieldValue }) => (
				<SelectInput<{ label: string; value: UserType }>
					inputId="user-type"
					name="userType"
					label="User Type"
					options={USER_TYPE_OPTIONS}
					value={
						USER_TYPE_OPTIONS.find(
							(option) => option.value === draft.userType,
						) ?? null
					}
					isDisabled={disabled}
					error={fieldErrors.userType}
					onChange={(option) =>
						setFieldValue("userType", (option?.value ?? "THCM") as never)
					}
				/>
			),
		},

		{
			id: "joinedOn",
			name: "joinedOn",
			label: "Joined On",
			render: ({ draft, disabled, setFieldValue }) => (
				<DatePickerInput
					label="Joined On"
					mode="single"
					value={parseJoinedOn(draft.joinedOn)}
					onChange={(nextValue) =>
						setFieldValue(
							"joinedOn",
							formatJoinedOn(
								nextValue instanceof Date ? nextValue : undefined,
							) as never,
						)
					}
					placeholder="Select joining date"
					disabled={disabled}
					disablePast={!isEditMode}
					error={fieldErrors.joinedOn}
				/>
			),
		},

		{
			id: "status-flags",
			label: "Status",
			displayValue: (
				<div className="flex items-center gap-2">
					<Badge variant={form.isActive ? "success" : "secondary"}>
						{form.isActive ? "Active" : "Inactive"}
					</Badge>

					{form.isDefaultContact ? (
						<Badge variant="info">Default Contact</Badge>
					) : null}
				</div>
			),
			render: ({ draft, disabled, setFieldValue }) => (
				<div className="flex items-center gap-4">
					<Checkbox
						name="isDefaultContact"
						label="Default Contact"
						checked={draft.isDefaultContact}
						disabled={disabled}
						onChange={(checked) =>
							setFieldValue("isDefaultContact", Boolean(checked))
						}
					/>

					<Checkbox
						name="isActive"
						label="Active"
						checked={draft.isActive}
						disabled={disabled}
						onChange={(checked) => setFieldValue("isActive", Boolean(checked))}
					/>
				</div>
			),
		},
	];

	const externalIdFields: EditableCardField<FormValues>[] = [
		{
			name: "internalId",
			label: "Internal ID",
		},
		{
			name: "bydId",
			label: "BYD ID",
		},
		{
			name: "s4Id",
			label: "S4 ID",
		},
		{
			name: "tallyId",
			label: "Tally ID",
		},
		{
			name: "c4cId",
			label: "C4C ID",
		},
		{
			name: "bpInternalCode",
			label: "BP Internal Code",
		},
	];

	const organizationFields: EditableCardField<FormValues>[] = [
		{
			name: "region",
			label: "Region",
		},
		{
			name: "address",
			label: "Address",
		},
		{
			name: "zone",
			label: "Zone",
		},
		{
			name: "branch",
			label: "Branch",
		},
		{
			name: "department",
			label: "Department",
		},
		{
			name: "role",
			label: "Role",
		},
		{
			name: "designation",
			label: "Designation",
		},
		{
			name: "vertical",
			label: "Vertical",
		},
		{
			name: "managerCode1",
			label: "Manager Code 1",
		},
		{
			name: "managerCode2",
			label: "Manager Code 2",
		},
	];

	const saveSection = async (values: FormValues) => {
		(Object.keys(values) as Array<keyof FormValues>).forEach((key) => {
			handleFormChange(key as UserFormField, values[key] as never);
		});

		await handleSubmitUser();
	};

	const fullName =
		[form.firstName, form.lastName].filter(Boolean).join(" ") || "New User";

	/*
	 * Profile header shared by both view and edit modes.
	 *
	 * The avatar itself is the image preview.
	 * FileUploadField is only responsible for selecting
	 * the image.
	 */
	/*
	 * Avatar-only header used in view mode — no upload UI at all.
	 */
	const profileHeader = (
		<div className="profile-summary">
			<Avatar
				firstName={form.firstName}
				lastName={form.lastName}
				imageUrl={profileImage?.url ?? ""}
				size="lg"
			/>

			<div className="profile-summary-content">
				<div className="profile-summary-heading">
					<h3 className="profile-summary-name">{fullName}</h3>

					<span className="">
						<Badge variant={"info"}>
							{form.userType !== "Select" ? form.userType : "User"}
						</Badge>
					</span>
				</div>
			</div>
		</div>
	);

	/*
	 * Edit mode header — same layout as view mode, but the avatar
	 * circle itself is the upload control (no separate dropzone/preview box).
	 * The FileUploadField's own input is layered invisibly over the circle.
	 */
	const editProfileHeader = (
		<div className="profile-summary">
			<div className="profile-summary-avatar profile-summary-avatar-editable">
				<Avatar
					firstName={form.firstName}
					lastName={form.lastName}
					imageUrl={profileImage?.url ?? ""}
					size="lg"
				/>

				<FileUploadField
					kind="image"
					multiple={false}
					value={profileImage}
					disabled={isSaving}
					onChange={(nextValue) => setProfileImage(nextValue)}
					className="profile-summary-avatar-input"
				/>

				<span className="profile-summary-avatar-edit-badge" aria-hidden="true">
					<Pencil size={12} />
				</span>
			</div>

			<div className="profile-summary-content">
				<div className="profile-summary-heading">
					<h3 className="profile-summary-name">{fullName}</h3>

					<span className="profile-summary-role">
						{form.userType !== "Select" ? form.userType : "User"}
					</span>
				</div>
			</div>
		</div>
	);

	return (
		<section className="profile-page" aria-labelledby="user-form-title">
			<div className="profile-page-sections">
				<EditableCard
					title="Basic Information"
					editTitle="Edit Basic Information"
					value={form}
					fields={basicInfoFields}
					saving={isSaving}
					onSubmit={saveSection}
					header={profileHeader}
					editHeader={editProfileHeader}
				/>

				<EditableCard
					title="External System IDs"
					editTitle="Edit External System IDs"
					// editSubtitle="Update identifiers used to sync this user across systems."
					value={form}
					fields={externalIdFields}
					saving={isSaving}
					onSubmit={saveSection}
				/>

				<EditableCard
					title="Organization Details"
					editTitle="Edit Organization Details"
					// editSubtitle="Update the user's org placement and reporting lines."
					value={form}
					fields={organizationFields}
					saving={isSaving}
					onSubmit={saveSection}
				/>
			</div>
		</section>
	);
}
