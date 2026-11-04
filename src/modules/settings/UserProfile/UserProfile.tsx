import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";

import EditableCard, {
	type EditableCardField,
} from "../../../components/common/EditableCard";
import { useAuth } from "../../../context/Auth/useAuth";
import { useToast } from "../../../context/Auth/AuthContext";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import {
	userProfileSchema,
	type UserProfileFormValues,
} from "./userProfile.schema";
import { mapProfileFormToPayload } from "./userProfile.mapper";
import { useUpdateCurrentUser } from "./userProfile.api";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { useUserInfo } from "../../../common/common.app.helper";
import { useMasterData } from "../../../hooks/useMasterData";
import type { MasterOption } from "../../admin/Masters/masterData.types";
import SelectInput from "../../../components/forms/SelectInput";

type UserRole = "ADMIN" | "MANAGER" | "VIEWER";

type ProfileValues = UserProfileFormValues & {
	email: string;
	zone: string;
	branch: string;
};

type FieldErrors = Partial<Record<keyof UserProfileFormValues, string>>;

type UserProfileProps = { userRole?: UserRole };

// Same matching rule as CreateUserForm / useMasterLabels: id, code or label.
const findOption = (options: MasterOption[], stored: string) =>
	options.find(
		(o) => o.value === stored || o.code === stored || o.label === stored,
	) ?? null;

/*
 * Social links block (SocialLink component, display field, four URL fields)
 * is still hidden — restore from version control when needed.
 */

export default function UserProfile({ userRole = "ADMIN" }: UserProfileProps) {
	const { user, setUser } = useAuth();
	const { branchLabel, departmentId, departmentLabel } = useUserInfo();
	const { data: masters, isLoading: isLoadingMasters } = useMasterData();
	const departmentOptions: MasterOption[] = masters?.departments ?? [];
	const designationOptions: MasterOption[] = masters?.designations ?? [];

	const { showToast } = useToast();
	const updateProfile = useUpdateCurrentUser();
	const isViewer = userRole === "VIEWER";

	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

	// CHANGED: zones come straight from /users/me (array of names), the same
	// source the admin screen's read-only Zone display uses.
	const zoneText = user?.zones?.length ? user.zones.join(", ") : "";

	const profileValues = useMemo<ProfileValues>(
		() => ({
			firstName: user?.first_name ?? "",
			lastName: user?.last_name ?? "",
			email: user?.email ?? "",
			phone: user?.phone_number ?? "",
			designationId: user?.designationId ?? "", // CHANGED
			zone: zoneText, // CHANGED
			branch: user?.branch || branchLabel,
			department: departmentId || (user?.department ?? ""),
		}),
		[
			user?.first_name,
			user?.last_name,
			user?.email,
			user?.phone_number,
			user?.designationId,
			user?.department,
			user?.branch,
			zoneText,
			branchLabel,
			departmentId,
		],
	);

	const designationLabel =
		findOption(designationOptions, profileValues.designationId)?.label ??
		user?.designation ??
		"";

	const fullName =
		[profileValues.firstName, profileValues.lastName]
			.filter(Boolean)
			.join(" ") || "User";

	const initials =
		[profileValues.firstName, profileValues.lastName]
			.filter(Boolean)
			.map((name) => name.charAt(0).toUpperCase())
			.join("") || "U";

	const profileFields: EditableCardField<ProfileValues>[] = [
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
		{ name: "email", label: "Email Address", type: "email", disabled: true },
		{ name: "phone", label: "Phone", type: "tel", error: fieldErrors.phone },
		// CHANGED: master select writing designationId, like the admin form.
		{
			id: "designation",
			name: "designationId",
			label: "Designation",
			displayValue: designationLabel || "--",
			render: ({ draft, disabled, setFieldValue }) => (
				<SelectInput<MasterOption>
					inputId="profile-designation"
					name="designationId"
					label="Designation"
					placeholder="Select designation"
					options={designationOptions}
					value={findOption(designationOptions, draft.designationId)}
					isDisabled={disabled || isLoadingMasters}
					error={fieldErrors.designationId}
					onChange={(option) =>
						setFieldValue("designationId", (option?.value ?? "") as never)
					}
				/>
			),
		},
		{
			id: "department",
			name: "department",
			label: "Department",
			displayValue: departmentLabel || "--",
			render: ({ draft, disabled, setFieldValue }) => (
				<SelectInput<MasterOption>
					inputId="profile-department"
					name="department"
					label="Department"
					placeholder="Select department"
					options={departmentOptions}
					value={findOption(departmentOptions, draft.department)}
					isDisabled={disabled || isLoadingMasters}
					error={fieldErrors.department}
					onChange={(option) =>
						setFieldValue("department", (option?.value ?? "") as never)
					}
				/>
			),
		},
		// CHANGED: displayValue falls back to "--" when no zones are assigned.
		{
			name: "zone",
			label: "Zone",
			disabled: true,
			displayValue: profileValues.zone || "--",
		},
		{ name: "branch", label: "Branch", disabled: true },
	];

	const saveProfile = async (values: ProfileValues): Promise<boolean> => {
		const result = userProfileSchema.safeParse(values);

		if (!result.success) {
			const errors: FieldErrors = {};
			for (const issue of result.error.issues) {
				const key = issue.path[0];
				if (typeof key === "string" && !(key in errors)) {
					errors[key as keyof UserProfileFormValues] = issue.message;
				}
			}
			setFieldErrors(errors);
			return false;
		}

		setFieldErrors({});

		try {
			const response = await updateProfile.mutateAsync(
				mapProfileFormToPayload(result.data),
			);
			const updated = response.user;

			setUser((current) =>
				current
					? {
							...current,
							first_name: updated.first_name,
							last_name: updated.last_name,
							phone_number: updated.phone_number ?? "",
							designationId: updated.designationId ?? "", // CHANGED
							designation: updated.designation ?? "",
							department: updated.department ?? "",
						}
					: current,
			);

			showToast({
				type: "success",
				title: "Success",
				description: response.message ?? "Profile updated successfully.",
			});
			return true;
		} catch (error) {
			showToast({
				type: "error",
				title: "Unable to save",
				description: getApiErrorMessage(
					error,
					"Something went wrong while saving your profile.",
				),
			});
			return false;
		}
	};

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="User Profile"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "User profile location",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{ label: "User profile" },
					],
					separator: "›",
				}}
			/>
			<section className="profile-page" aria-labelledby="profile-page-title">
				<div className="profile-page-sections">
					<EditableCard
						title="User Information"
						editTitle="Edit User Information"
						editSubtitle="Update your name, phone number, designation and department."
						value={profileValues}
						fields={profileFields}
						editable={!isViewer}
						saving={updateProfile.isPending}
						onSubmit={saveProfile}
						onCancel={() => setFieldErrors({})}
						header={
							<div className="profile-summary">
								<div className="profile-summary-avatar">
									{user?.profile_image ? (
										<img src={user.profile_image} alt={`${fullName} profile`} />
									) : (
										<span aria-hidden="true">{initials}</span>
									)}
								</div>
								<div className="profile-summary-content">
									<div className="profile-summary-heading">
										<h3 className="profile-summary-name">{fullName}</h3>
										{designationLabel ? (
											<span className="profile-summary-role">
												{designationLabel}
											</span>
										) : null}
									</div>
									<div className="profile-summary-details">
										{departmentLabel ? (
											<span className="profile-summary-detail">
												<Building2 size={14} aria-hidden="true" />
												<span>{departmentLabel}</span>
											</span>
										) : null}
									</div>
								</div>
							</div>
						}
					/>
				</div>
			</section>
		</PageSectionLayout>
	);
}
