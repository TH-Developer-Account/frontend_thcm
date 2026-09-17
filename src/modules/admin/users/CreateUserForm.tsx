import { useState } from "react";
import { Pencil } from "lucide-react";

import EditableCard, {
	type EditableCardField,
} from "../../../components/common/EditableCard";
import Checkbox from "../../../components/forms/Checkbox";
import SelectInput from "../../../components/forms/SelectInput";
import DatePickerInput from "../../../components/common/DatePickerInput";
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
		startInEditMode,
		handleFormChange,
		handleSubmitUser,
		handleCancelForm,
	} = controller;

	// "view" is now the single route for both looking at and editing an
	// existing user — EditableCard owns the actual display/edit toggle
	// internally. "create" always renders its cards already in edit mode.
	const isCreateMode = pageMode === "create";
	const isDetailMode = pageMode === "view";
	const isSaving = isCreating || isUpdating;

	// Cancelling out of "create" should return to the list. Cancelling out
	// of editing an existing user just drops back to viewing them — which,
	// since edit/view now share one route, EditableCard already does on its
	// own by resetting local state. We only need to step in for "create".
	const handleCancelEditing = () => {
		if (isCreateMode) {
			handleCancelForm();
		}
	};

	const [profileImage, setProfileImage] = useState<FileUploadValue | null>(
		null,
	);

	const displayValues: FormValues =
		isDetailMode && selectedUser ? mapUserToForm(selectedUser) : form;

	if (isDetailMode && isLoadingSelectedUser && !selectedUser) {
		return (
			<section className="profile-page" aria-label="User profile">
				<p>Loading user…</p>
			</section>
		);
	}

	if (isDetailMode && !isLoadingSelectedUser && !selectedUser) {
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
		// Password: create only. Not shown for an existing user — an
		// edit-mode password reset should go through a dedicated "reset
		// password" action rather than living in this form.
		...(isCreateMode
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
					// Only restrict to future dates while creating a brand new
					// user. Editing an existing user needs to allow their
					// actual (often past) joining date.
					disablePast={isCreateMode}
					error={fieldErrors.joinedOn}
				/>
			),
		},

		// Show status for an existing user only. New users are active by
		// default, so creation does not need a status control.
		{
			id: "status-flags",
			label: "Status",
			visibleInDisplay: isDetailMode,
			visibleInEdit: isDetailMode,
			displayValue: (
				<div className="flex items-center gap-2">
					<Badge variant={displayValues.isActive ? "success" : "secondary"}>
						{displayValues.isActive ? "Active" : "Inactive"}
					</Badge>
				</div>
			),
			render: ({ draft, disabled, setFieldValue }) => (
				<div className="flex min-h-11 mt-6 items-center">
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

	const organizationFields: EditableCardField<FormValues>[] = [
		{
			name: "region",
			label: "Region",
			required: true,
			error: fieldErrors.region,
		},
		{
			name: "address",
			label: "Address",
			required: true,
			error: fieldErrors.address,
		},
		{
			name: "zone",
			label: "Zone",
			required: true,
			error: fieldErrors.zone,
		},
		{
			name: "branch",
			label: "Branch",
			required: true,
			error: fieldErrors.branch,
		},
		{
			name: "department",
			label: "Department",
			required: true,
			error: fieldErrors.department,
		},
		{
			name: "role",
			label: "Role",
			required: true,
			error: fieldErrors.role,
		},
		{
			name: "designation",
			label: "Designation",
			required: true,
			error: fieldErrors.designation,
		},
		{
			name: "vertical",
			label: "Vertical",
			required: true,
			error: fieldErrors.vertical,
		},
		{
			name: "managerCode1",
			label: "Manager Code 1",
			required: true,
			error: fieldErrors.managerCode1,
		},
		{
			name: "managerCode2",
			label: "Manager Code 2",
			required: true,
			error: fieldErrors.managerCode2,
		},
		{
			name: "bydId",
			label: "BYD ID",
			required: true,
			error: fieldErrors.bydId,
		},
		{
			name: "s4Id",
			label: "S4 ID",
			required: true,
			error: fieldErrors.s4Id,
		},
		{
			name: "tallyId",
			label: "Tally ID",
			required: true,
			error: fieldErrors.tallyId,
		},
		{
			name: "c4cId",
			label: "C4C ID",
			required: true,
			error: fieldErrors.c4cId,
		},
	];

	const saveSection = async (values: FormValues) => {
		const valuesWithAvatar: FormValues = {
			...values,
			avatar: profileImage?.file ?? null,
		};

		(Object.keys(valuesWithAvatar) as Array<keyof FormValues>).forEach(
			(key) => {
				handleFormChange(key as UserFormField, valuesWithAvatar[key] as never);
			},
		);

		return handleSubmitUser(valuesWithAvatar);
	};

	const fullName =
		[displayValues.firstName, displayValues.lastName]
			.filter(Boolean)
			.join(" ") || "New User";

	// Single header used for both editing and read-only display. `editing`
	// comes from EditableCard itself (via the function form of `title`),
	// since that's the only place the current isEditing state actually
	// lives now that display/edit share one route.
	const renderProfileHeader = (editing: boolean) => (
		<div className="profile-summary">
			<div
				className={
					editing
						? "profile-summary-avatar profile-summary-avatar-editable"
						: "profile-summary-avatar"
				}
			>
				<Avatar
					firstName={displayValues.firstName}
					lastName={displayValues.lastName}
					imageUrl={profileImage?.url ?? ""}
					size="lg"
				/>

				{editing ? (
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

	// Create always starts (and stays) in edit mode. On the view route,
	// EditableCard starts read-only unless the person arrived via the
	// table's "Edit User" action (startInEditMode), which opens both cards
	// straight into editing rather than making them click Edit again.
	const defaultEditing = isCreateMode || startInEditMode;

	return (
		<section className="profile-page" aria-label="User profile">
			<div className="profile-page-sections">
				<EditableCard
					key={`basic-${selectedUser?.id ?? "create"}`}
					value={displayValues}
					fields={basicInfoFields}
					saving={isSaving}
					onSubmit={saveSection}
					onCancel={handleCancelEditing}
					title={renderProfileHeader}
					className="[&>div:first-child]:border-b-0"
					// Only the view route needs its own Edit button — create
					// is already open for editing with nothing to toggle.
					editable={isDetailMode}
					defaultEditing={defaultEditing}
				/>

				{/* Organization Details only appears once the user actually
				    exists (view mode) — plain "create" never had a user id to
				    save this against yet. */}
				{!isCreateMode ? (
					<EditableCard
						key={`organization-${selectedUser?.id ?? "create"}`}
						title="Organization Details"
						editTitle="Edit Organization Details"
						value={displayValues}
						fields={organizationFields}
						saving={isSaving}
						onSubmit={saveSection}
						onCancel={handleCancelEditing}
						editable={isDetailMode}
						defaultEditing={defaultEditing}
					/>
				) : null}
			</div>
		</section>
	);
}
