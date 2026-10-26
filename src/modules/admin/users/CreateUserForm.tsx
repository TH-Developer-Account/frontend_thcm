import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";

import EditableCard, {
	type EditableCardField,
} from "../../../components/common/EditableCard";
import Checkbox from "../../../components/forms/Checkbox";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";
import MultiSelectInput from "../../../components/forms/MultiSelectInput";
import DatePickerInput from "../../../components/common/DatePickerInput";
import { useAuth } from "../../../context/Auth/AuthContext";
import { useMasterData } from "../../../hooks/useMasterData";
import type { GradeOption, UserType } from "./user-management.types";
import type { UsersController } from "./useUsersData";
import {
	BASIC_INFO_FIELDS,
	ORGANIZATION_REQUIRED_FIELDS,
} from "./useUsersData";
import {
	mapUserToForm,
	normalizeMobileInput,
	parseDateOnly,
	toDateOnlyString,
} from "./user-management.utils";
import type { MasterOption } from "../Masters/masterData.types";

import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import { Badge } from "../../../components/common/Badge";
import Avatar from "../../../components/common/Avatar";
import type { BusinessPartnerOption } from "./BusinessPartnerAsyncSelect";
import BusinessPartnerAsyncSelect from "./BusinessPartnerAsyncSelect";
import UserAppAccessPanel from "./UserAppAccessPanel";

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
		validateUserField,
		handleSubmitUser,
		handleCancelForm,
	} = controller;
	const { isSuperAdmin } = useAuth();

	// Branch/Designation/Division/Cost Center pickers and the Zone
	// multi-select are all sourced from the Masters endpoint, the same one
	// MastersPage.tsx reads from — so these dropdowns and the admin's
	// Masters screen are always showing the same governed options. Location
	// is NOT one of these — it's a plain text field below, not master-backed
	// (see user-management.types.ts).
	const { data: masterData } = useMasterData();
	const branchOptions: MasterOption[] = masterData?.branches ?? [];
	const designationOptions: MasterOption[] = masterData?.designations ?? [];
	const divisionOptions: MasterOption[] = masterData?.divisions ?? [];
	const costCenterOptions: MasterOption[] = masterData?.costCenters ?? [];
	const zoneOptions: MasterOption[] = masterData?.zones ?? [];
	const departmentOptions: MasterOption[] = masterData?.departments ?? [];

	// "view" is now the single route for both looking at and editing an
	// existing user — EditableCard owns the actual display/edit toggle
	// internally. "create" always renders its cards already in edit mode.
	const isCreateMode = pageMode === "create";
	const isDetailMode = pageMode === "view";
	const isSaving = isCreating || isUpdating;

	// App Admins can create a user but never edit one afterwards (decision C).
	const canEditExistingUser = isDetailMode && isSuperAdmin;

	const handleCancelEditing = () => {
		if (isCreateMode) {
			handleCancelForm();
		}
	};

	const [profileImage, setProfileImage] = useState<FileUploadValue | null>(
		null,
	);
	// Latest selectable joining date = yesterday (today and future are disabled).
	const getLatestJoiningDate = () => {
		const date = new Date();
		date.setHours(0, 0, 0, 0);
		date.setDate(date.getDate() - 1);
		return date;
	};
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
		// Custom render so the input can (a) mask to 10 digits as you type and
		// (b) run the Zod mobile rule onChange instead of only on submit.
		{
			id: "phoneNumber",
			name: "phoneNumber",
			label: "Phone Number",
			required: true,
			displayValue: displayValues.phoneNumber || "--",
			render: ({ draft, disabled, setFieldValue }) => (
				<FormInput
					name="phoneNumber"
					label="Phone Number"
					type="tel"
					inputMode="numeric"
					autoComplete="tel-national"
					placeholder="10-digit mobile number"
					value={draft.phoneNumber}
					disabled={disabled}
					required
					error={fieldErrors.phoneNumber}
					onChange={(event) => {
						const nextPhone = normalizeMobileInput(event.target.value);
						setFieldValue("phoneNumber", nextPhone as never);
						validateUserField("phoneNumber", nextPhone);
					}}
				/>
			),
		},
		// Password: create only. Not shown for an existing user — an
		// edit-mode password reset should go through a dedicated "reset
		// password" action rather than living in this form.
		// ...(isCreateMode
		// \t? [
		// \t\t\t{
		// \t\t\t\tname: "password" as const,
		// \t\t\t\tlabel: "Password",
		// \t\t\t\tvisibleInDisplay: false,
		// \t\t\t\terror: fieldErrors.password,
		// \t\t\t},
		// \t\t]
		// \t: []),

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
					value={parseDateOnly(draft.joinedOn) ?? undefined}
					onChange={(nextValue) => {
						const nextJoinedOn = toDateOnlyString(
							nextValue instanceof Date ? nextValue : undefined,
						);
						setFieldValue("joinedOn", nextJoinedOn as never);
						validateUserField("joinedOn", nextJoinedOn);
					}}
					placeholder="Select joining date"
					disabled={disabled}
					toDate={getLatestJoiningDate()}
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

	// Helper for the master-backed single-select pickers below (Branch/
	// Designation/Division/Cost Center) — they all share the same shape
	// (options: MasterOption[], value/onChange a *Id field), so this keeps
	// the render callbacks from repeating the same find/onChange boilerplate
	// each time. Location used to be one of these too, before it reverted to
	// plain text.
	const renderMasterSelect = (
		fieldLabel: string,
		options: MasterOption[],
		draftValue: string,
		disabled: boolean,
		error: string | undefined,
		onSelect: (id: string) => void,
	) => (
		<SelectInput<MasterOption>
			inputId={`user-${fieldLabel.toLowerCase().replace(/\s+/g, "-")}`}
			name={fieldLabel}
			label={fieldLabel}
			options={options}
			value={options.find((option) => option.value === draftValue) ?? null}
			isDisabled={disabled}
			error={error}
			onChange={(option) => onSelect(option?.value ?? "")}
		/>
	);

	const organizationFields: EditableCardField<FormValues>[] = [
		// Location is plain free text again — real-world location values vary
		// too much to constrain to a fixed master list (see
		// decisions-and-learnings.md) — so it's an ordinary text field now,
		// the same shape as address/branch/department/role below.
		{
			name: "location",
			label: "Location",
			required: true,
			error: fieldErrors.location,
		},
		{
			name: "address",
			label: "Address",
			required: true,
			error: fieldErrors.address,
		},
		// Branch reverted back to the master-backed Branch dropdown it was
		// before — unlike location, it already had a governed master + admin
		// screen, so it's a renderMasterSelect picker again, not plain text.
		{
			id: "branch",
			name: "branchId",
			label: "Branch",
			required: true,
			displayValue: selectedUser?.branch || "--",
			render: ({ draft, disabled, setFieldValue }) =>
				renderMasterSelect(
					"Branch",
					branchOptions,
					draft.branchId,
					disabled,
					fieldErrors.branchId,
					(id) => setFieldValue("branchId", id as never),
				),
		},
		// A user can cover multiple zones, so this is a multi-select writing
		// to zoneIds (string[]) rather than a single plain-text field.
		{
			id: "zones",
			name: "zoneIds",
			label: "Zone",
			required: true,
			displayValue: selectedUser?.zones?.length
				? selectedUser.zones.join(", ")
				: "--",
			render: ({ draft, disabled, setFieldValue }) => (
				<MultiSelectInput
					inputId="user-zones"
					name="zoneIds"
					label="Zone"
					required
					options={zoneOptions}
					value={zoneOptions.filter((option) =>
						draft.zoneIds.includes(option.value),
					)}
					isDisabled={disabled}
					error={fieldErrors.zoneIds}
					onValueChange={({ value }) =>
						setFieldValue(
							"zoneIds",
							value.map((option) => option.value) as never,
						)
					}
				/>
			),
		},
		{
			id: "department",
			name: "department",
			label: "Department",
			required: true,
			displayValue: selectedUser?.department
				? (departmentOptions.find(
						(o) =>
							o.value === selectedUser.department ||
							o.code === selectedUser.department ||
							o.label === selectedUser.department,
					)?.label ?? selectedUser.department)
				: "--",
			render: ({ draft, disabled, setFieldValue }) => (
				<SelectInput<MasterOption>
					inputId="user-department"
					name="department"
					label="Department"
					options={departmentOptions}
					value={
						departmentOptions.find(
							(o) =>
								o.value === draft.department ||
								o.code === draft.department ||
								o.label === draft.department,
						) ?? null
					}
					isDisabled={disabled}
					error={fieldErrors.department}
					onChange={(option) =>
						setFieldValue("department", (option?.value ?? "") as never)
					}
				/>
			),
		},
		{
			name: "role",
			label: "Role",
			required: false,
			error: fieldErrors.role,
		},
		{
			id: "designation",
			name: "designationId",
			label: "Designation",
			required: true,
			displayValue: selectedUser?.designation || "--",
			render: ({ draft, disabled, setFieldValue }) =>
				renderMasterSelect(
					"Designation",
					designationOptions,
					draft.designationId,
					disabled,
					fieldErrors.designationId,
					(id) => setFieldValue("designationId", id as never),
				),
		},
		{
			id: "division",
			name: "divisionId",
			label: "Division",
			required: true,
			displayValue: selectedUser?.division || "--",
			render: ({ draft, disabled, setFieldValue }) =>
				renderMasterSelect(
					"Division",
					divisionOptions,
					draft.divisionId,
					disabled,
					fieldErrors.divisionId,
					(id) => setFieldValue("divisionId", id as never),
				),
		},
		{
			id: "costCenter",
			name: "costCenterId",
			label: "Cost Center",
			required: true,
			// Cost Center's master option label carries its name, but the
			// User-facing value is the code (see masterData.types.ts) — so the
			// read-only display pulls selectedUser.costCenter (the code) even
			// though the picker itself shows names.
			displayValue: selectedUser?.costCenter || "--",
			render: ({ draft, disabled, setFieldValue }) =>
				renderMasterSelect(
					"Cost Center",
					costCenterOptions,
					draft.costCenterId,
					disabled,
					fieldErrors.costCenterId,
					(id) => setFieldValue("costCenterId", id as never),
				),
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
			required: false,
			error: fieldErrors.managerCode1,
		},
		{
			name: "managerCode2",
			label: "Manager Code 2",
			required: false,
			error: fieldErrors.managerCode2,
		},
		{
			name: "bydId",
			label: "BYD ID",
			required: false,
			error: fieldErrors.bydId,
		},
		{
			name: "s4Id",
			label: "S4 ID",
			required: false,
			error: fieldErrors.s4Id,
		},
		{
			name: "tallyId",
			label: "Tally ID",
			required: false,
			error: fieldErrors.tallyId,
		},
		{
			name: "c4cId",
			label: "C4C ID",
			required: false,
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

		const sectionFieldNames =
			section === "basic" ? BASIC_INFO_FIELDS : ORGANIZATION_REQUIRED_FIELDS;

		sectionFieldNames.forEach((key) => {
			handleFormChange(key, valuesWithAvatar[key] as never);
		});

		handleFormChange("avatar", valuesWithAvatar.avatar as never);

		return handleSubmitUser(valuesWithAvatar, section);
	};

	const fullName =
		[displayValues.firstName, displayValues.lastName]
			.filter(Boolean)
			.join(" ") || "New User";

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
	// EditableCard starts read-only unless a Super Admin arrived via the
	// table's "Edit User" action (startInEditMode), which opens both cards
	// straight into editing rather than making them click Edit again.
	const defaultEditing = isCreateMode || (startInEditMode && isSuperAdmin);

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
					editable={canEditExistingUser}
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
						editable={canEditExistingUser}
						defaultEditing={defaultEditing}
					/>
				) : null}

				{/* Creating a user lands here, so the admin can grant app access
				straight away. */}
				{isDetailMode && selectedUser ? (
					<UserAppAccessPanel user={selectedUser} />
				) : null}
			</div>
		</section>
	);
}
