import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";

import EditableCard, {
	type EditableCardField,
} from "../../../components/common/EditableCard";
import Checkbox from "../../../components/forms/Checkbox";
import SelectInput from "../../../components/forms/SelectInput";
import DatePickerInput from "../../../components/common/DatePickerInput";
import type { GradeOption, UserType } from "./user-management.types";
import type { UsersController } from "./useUsersData";
import {
	BASIC_INFO_FIELDS,
	ORGANIZATION_REQUIRED_FIELDS,
} from "./useUsersData";
import { mapUserToForm } from "./user-management.utils";

import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import { Badge } from "../../../components/common/Badge";
import Avatar from "../../../components/common/Avatar";
import { formatDateOnly } from "../../../utils/format";
import type { BusinessPartnerOption } from "./BusinessPartnerAsyncSelect";
import BusinessPartnerAsyncSelect from "./BusinessPartnerAsyncSelect";

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
	{ label: "EG-3", value: "EG-3" },
	{ label: "EG-4", value: "EG-4" },
	{ label: "TM-5", value: "TM-5" },
	{ label: "TM-4", value: "TM-4" },
	{ label: "TM-3", value: "TM-3" },
	{ label: "TM-2", value: "TM-2" },
	{ label: "TM-1", value: "TM-1" },
	{ label: "TM-0", value: "TM-0" },
	{ label: "TS-2", value: "TS-2" },
	{ label: "TS-1", value: "TS-1" },
	{ label: "TE-3", value: "TE-3" },
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

	// The form itself only carries businessPartnerId (a string) — the label
	// needed for display isn't part of UserFormValues, so we track the
	// chosen option (id + label) locally, seeded from the already-known BP
	// on an existing user.
	const [selectedBpOption, setSelectedBpOption] =
		useState<BusinessPartnerOption | null>(
			selectedUser?.businessPartner
				? {
						value: selectedUser.businessPartner.id,
						label: selectedUser.businessPartner.bpName,
						officeType: selectedUser.businessPartner.officeType,
					}
				: null,
		);

	// Re-seed whenever we land on a different user (or move from create
	// into the freshly-created user's view route) so the field doesn't
	// show a stale selection from whatever was previously loaded.
	useEffect(() => {
		setSelectedBpOption(
			selectedUser?.businessPartner
				? {
						value: selectedUser.businessPartner.id,
						label: selectedUser.businessPartner.bpName,
						officeType: selectedUser.businessPartner.officeType,
					}
				: null,
		);
	}, [selectedUser?.id, selectedUser?.businessPartner]);

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
		// ...(isCreateMode
		// 	? [
		// 			{
		// 				name: "password" as const,
		// 				label: "Password",
		// 				visibleInDisplay: false,
		// 				error: fieldErrors.password,
		// 			},
		// 		]
		// 	: []),

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

		// Business Partner — optional for every user type. Search-as-you-type
		// against the /business-partner endpoint, via the shared
		// BusinessPartnerAsyncSelect control (it only fetches once there's
		// actual input, and never while the field is disabled/read-only).
		{
			id: "businessPartner",
			name: "businessPartnerId",
			label: "Business Partner",
			required: isCreateMode,
			displayValue: displayValues.businessPartnerId
				? (selectedUser?.businessPartner?.bpName ??
					displayValues.businessPartnerId)
				: "--",
			render: ({ draft, disabled, setFieldValue }) => {
				const currentValue: BusinessPartnerOption | null =
					draft.businessPartnerId
						? selectedBpOption?.value === draft.businessPartnerId
							? selectedBpOption
							: selectedUser?.businessPartner?.id === draft.businessPartnerId
								? {
										value: selectedUser.businessPartner.id,
										label: selectedUser.businessPartner.bpName,
										officeType: selectedUser.businessPartner.officeType,
									}
								: {
										value: draft.businessPartnerId,
										label: draft.businessPartnerId,
									}
						: null;

				return (
					<BusinessPartnerAsyncSelect
						name="businessPartnerId"
						label="Business Partner"
						placeholder="Search business partner..."
						value={currentValue}
						isDisabled={disabled}
						required={isCreateMode}
						error={fieldErrors.businessPartnerId}
						onChange={(option) => {
							setSelectedBpOption(option);
							setFieldValue(
								"businessPartnerId",
								(option?.value ?? "") as never,
							);
						}}
					/>
				);
			},
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
			required: !isCreateMode,
			render: ({ draft, disabled, setFieldValue }) => (
				<DatePickerInput
					label={`Joined On${!isCreateMode ? " *" : ""}`}
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

	// `section` tells handleSubmitUser which card this save came from, so
	// it only validates — and only reports field errors for — that card's
	// own fields. Both cards call this same function, just with a
	// different section: they must NOT share one whole-form validation
	// pass, or saving one card can fail (and surface errors) because of
	// the OTHER card's fields, which is what was happening before.
	const saveSection = async (
		section: "basic" | "organization",
		values: FormValues,
	) => {
		const valuesWithAvatar: FormValues = {
			...values,
			avatar: profileImage?.file ?? null,
		};

		// Only touch this card's own fields here. Looping over every key
		// (including the other card's) would call handleFormChange for
		// fields that didn't change, which also clears that field's error —
		// silently wiping the other card's still-valid errors on an
		// unrelated save.
		const sectionFieldNames =
			section === "basic" ? BASIC_INFO_FIELDS : ORGANIZATION_REQUIRED_FIELDS;

		sectionFieldNames.forEach((key) => {
			handleFormChange(key, valuesWithAvatar[key] as never);
		});
		// avatar lives outside both section field lists (it's synced via the
		// profile header, not either EditableCard), so sync it explicitly.
		handleFormChange("avatar", valuesWithAvatar.avatar as never);

		return handleSubmitUser(valuesWithAvatar, section);
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
					onSubmit={(values) => saveSection("basic", values)}
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
						onSubmit={(values) => saveSection("organization", values)}
						onCancel={handleCancelEditing}
						editable={isDetailMode}
						defaultEditing={defaultEditing}
					/>
				) : null}
			</div>
		</section>
	);
}
