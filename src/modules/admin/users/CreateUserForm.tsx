import { useState } from "react";
import { Pencil } from "lucide-react";

import EditableCard, {
	type EditableCardField,
} from "../../../components/common/EditableCard";
import Checkbox from "../../../components/forms/Checkbox";
import SelectInput from "../../../components/forms/SelectInput";
import DatePickerInput from "../../../components/common/DatePickerInput";
import Button from "../../../components/common/Button";
import type {
	GradeOption,
	UserFormField,
	UserType,
} from "./user-management.types";
import type { UsersController } from "./useUsersData";
import { mapUserToForm } from "./user-management.utils";

import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import { Badge } from "../../../components/common/Badge";
import Avatar from "../../../components/common/Avatar";
import { formatDateOnly } from "../../../utils/format";

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

// TODO: replace with real grade options from API/config once available.
const GRADE_OPTIONS: GradeOption[] = [
	{ label: "Select", value: "" },
	{ label: "M1", value: "M1" },
	{ label: "M2", value: "M2" },
	{ label: "M3", value: "M3" },
	{ label: "E1", value: "E1" },
	{ label: "E2", value: "E2" },
	{ label: "E3", value: "E3" },
];

const parseJoinedOn = (value: string): Date | undefined => {
	if (!value) return undefined;

	const parsed = new Date(`${value}T00:00:00`);

	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export function CreateUserForm({ controller }: UserFormProps) {
	const {
		pageMode,
		form,
		fieldErrors,
		isCreating,
		isUpdating,
		selectedUser,
		isLoadingSelectedUser,
		handleFormChange,
		handleSubmitUser,
		handleStartEdit,
	} = controller;

	const isEditMode = pageMode === "edit";
	const isViewMode = pageMode === "view";
	const isFormMode = pageMode === "create" || pageMode === "edit";
	const isSaving = isCreating || isUpdating;

	const isReadOnly = isViewMode;

	const [profileImage, setProfileImage] = useState<FileUploadValue | null>(
		null,
	);

	const displayValues: FormValues =
		(isViewMode || isEditMode) && selectedUser
			? mapUserToForm(selectedUser)
			: form;

	if ((isViewMode || isEditMode) && isLoadingSelectedUser && !selectedUser) {
		return (
			<section className="profile-page" aria-label="User profile">
				<p>Loading user…</p>
			</section>
		);
	}

	if ((isViewMode || isEditMode) && !isLoadingSelectedUser && !selectedUser) {
		return (
			<section className="profile-page" aria-label="User profile">
				<p>User not found.</p>
			</section>
		);
	}

	const basicInfoFields: EditableCardField<FormValues>[] = [
		{
			name: "employeeCode",
			label: "Employee Code",
			required: true,
			error: fieldErrors.employeeCode,
		},
		{
			name: "firstName",
			label: "First Name",
			required: true,
			error: fieldErrors.firstName,
		},
		{
			name: "lastName",
			label: "Last Name",
			required: true,
			error: fieldErrors.lastName,
		},
		{
			name: "email",
			label: "Email ID",
			type: "email",
			required: true,
			error: fieldErrors.email,
		},
		{
			name: "phoneNumber",
			label: "Phone Number",
			type: "tel",
			required: true,
			error: fieldErrors.phoneNumber,
		},
		// Password: create only. Not shown in edit or view — an edit-mode
		// password reset should go through a dedicated "reset password"
		// action rather than living in this form.
		...(pageMode === "create"
			? [
					{
						name: "password" as const,
						label: "Password",
						visibleInDisplay: false,
						error: fieldErrors.password,
					},
				]
			: []),

		{
			id: "userType",
			name: "userType",
			label: "User Type",
			displayValue:
				displayValues.userType && displayValues.userType !== "Select"
					? displayValues.userType
					: "--",
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
			id: "grade",
			name: "grade",
			label: "Grade",
			displayValue: displayValues.grade || "--",
			render: ({ draft, disabled, setFieldValue }) => (
				<SelectInput<GradeOption>
					inputId="user-grade"
					name="grade"
					label="Grade"
					options={GRADE_OPTIONS}
					value={
						GRADE_OPTIONS.find((option) => option.value === draft.grade) ?? null
					}
					isDisabled={disabled}
					error={fieldErrors.grade}
					onChange={(option) =>
						setFieldValue("grade", (option?.value ?? "") as never)
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
							formatDateOnly(
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

		...(isEditMode
			? []
			: [
					{
						id: "status-flags",
						label: "Status",
						displayValue: (
							<div className="flex items-center gap-2">
								<Badge
									variant={displayValues.isActive ? "success" : "secondary"}
								>
									{displayValues.isActive ? "Active" : "Inactive"}
								</Badge>
							</div>
						),
						render: ({ draft, disabled, setFieldValue }) => (
							<div className="flex items-center gap-4">
								<Checkbox
									name="isActive"
									label="Active"
									checked={draft.isActive}
									disabled={disabled}
									onChange={(checked) =>
										setFieldValue("isActive", Boolean(checked))
									}
								/>
							</div>
						),
					} as EditableCardField<FormValues>,
				]),
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
	];

	const saveSection = (values: FormValues) => {
		(Object.keys(values) as Array<keyof FormValues>).forEach((key) => {
			handleFormChange(key as UserFormField, values[key] as never);
		});

		// Pass values directly instead of relying on `form` state having
		// committed by the time this runs — setState above is async, so
		// handleSubmitUser() with no args would read the previous render's
		// (stale) form and could validate/submit against outdated data.
		return handleSubmitUser(values);
	};

	const fullName =
		[displayValues.firstName, displayValues.lastName]
			.filter(Boolean)
			.join(" ") || "New User";

	// Single header used for both editing and read-only display. The avatar
	// upload overlay only shows when the section is actually editable.
	const profileHeader = (
		<div className="profile-summary">
			<div
				className={
					isReadOnly
						? "profile-summary-avatar"
						: "profile-summary-avatar profile-summary-avatar-editable"
				}
			>
				<Avatar
					firstName={displayValues.firstName}
					lastName={displayValues.lastName}
					imageUrl={profileImage?.url ?? ""}
					size="lg"
				/>

				{!isReadOnly ? (
					<>
						<FileUploadField
							kind="image"
							multiple={false}
							value={profileImage}
							disabled={isSaving}
							onChange={(nextValue) => setProfileImage(nextValue)}
							className="profile-summary-avatar-input"
						/>

						<span
							className="profile-summary-avatar-edit-badge"
							aria-hidden="true"
						>
							<Pencil size={12} />
						</span>
					</>
				) : null}
			</div>

			<div className="profile-summary-content">
				<div className="profile-summary-heading">
					<h3 className="profile-summary-name">{fullName}</h3>

					<span className="">
						<Badge variant={"info"}>
							{displayValues.userType !== "Select"
								? displayValues.userType
								: "User"}
						</Badge>
					</span>
				</div>
			</div>
		</div>
	);

	return (
		<section className="profile-page" aria-label="User profile">
			<div className="profile-page-sections">
				<EditableCard
					key={`basic-${selectedUser?.id ?? "create"}`}
					value={displayValues}
					fields={basicInfoFields}
					saving={isSaving}
					onSubmit={saveSection}
					title={profileHeader}
					className="[&>div:first-child]:border-b-0"
					editable={!isReadOnly}
					defaultEditing={isFormMode}
					titleAction={
						isViewMode && selectedUser ? (
							<Button
								type="button"
								text="Edit User"
								Icon={Pencil}
								iconPosition="left"
								variant="secondary"
								size="sm"
								onClick={() => handleStartEdit(selectedUser)}
							/>
						) : undefined
					}
				/>

				{/* Organization Details only appears once the user actually exists
				    — i.e. after Basic Information has been saved once (pageMode
				    becomes "edit" via the post-create redirect) or when viewing.
				    Plain "create" mode never had a user id to save this against. */}
				{pageMode !== "create" ? (
					<EditableCard
						key={`organization-${selectedUser?.id ?? "create"}`}
						title="Organization Details"
						editTitle="Edit Organization Details"
						value={displayValues}
						fields={organizationFields}
						saving={isSaving}
						onSubmit={saveSection}
						editable={!isReadOnly}
						defaultEditing={isFormMode}
					/>
				) : null}
			</div>
		</section>
	);
}
