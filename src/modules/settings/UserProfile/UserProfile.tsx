import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";

import EditableCard, {
	type EditableCardField,
} from "../../../components/common/EditableCard";
import { useAuth } from "../../../context/Auth/useAuth";
import { useToast } from "../../../context/Auth/AuthContext";
// NOTE: path assumed - point this at the project's centralized helper.
/*
 * Social links are hidden for now. To bring them back, restore these imports,
 * the SocialLink component below, the "Social Links" display field and the
 * four URL fields, and add them to the schema/mapper/backend allowlist.
 *
 * import {
 * 	AiOutlineFacebook,
 * 	AiOutlineInstagram,
 * 	AiOutlineLinkedin,
 * 	AiOutlineTwitter,
 * } from "react-icons/ai";
 */
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { PageHeader } from "../../../components/ui/PageHeader";

import {
	userProfileSchema,
	type UserProfileFormValues,
} from "./userProfile.schema";
import { mapProfileFormToPayload } from "./userProfile.mapper";
import { useUpdateCurrentUser } from "./userProfile.api";
import { getApiErrorMessage } from "../../../utils/apiError.helper";

type UserRole = "ADMIN" | "MANAGER" | "VIEWER";

// Email is shown (locked) in the card but is not part of the form schema.
type ProfileValues = UserProfileFormValues & { email: string };

type FieldErrors = Partial<Record<keyof UserProfileFormValues, string>>;

type AddressValues = {
	country: string;
	cityState: string;
	postalCode: string;
	taxId: string;
};

type UserProfileProps = {
	userRole?: UserRole;
};

// Address is locked for now and still shows placeholder data.
const DEFAULT_ADDRESS: AddressValues = {
	country: "United States",
	cityState: "Phoenix, Arizona, United States",
	postalCode: "ERT 2489",
	taxId: "AS4568384",
};

// Address card is read-only; EditableCard requires an onSubmit handler.
const lockedAddressSubmit = async () => false;

/*
 * function SocialLink({ href, label, icon }: SocialLinkProps) {
 * 	if (!href) return null;
 * 	return (
 * 		<a
 * 			href={href}
 * 			target="_blank"
 * 			rel="noopener noreferrer"
 * 			className="profile-social-icon-link"
 * 			aria-label={`Open ${label} profile`}
 * 			title={label}
 * 		>
 * 			{icon}
 * 		</a>
 * 	);
 * }
 */

export default function UserProfile({ userRole = "ADMIN" }: UserProfileProps) {
	const { user, setUser } = useAuth();
	const { showToast } = useToast();
	const updateProfile = useUpdateCurrentUser();
	const isViewer = userRole === "VIEWER";

	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

	const profileValues = useMemo<ProfileValues>(
		() => ({
			firstName: user?.first_name ?? "",
			lastName: user?.last_name ?? "",
			email: user?.email ?? "",
			phone: user?.phone_number ?? "",
			designation: user?.designation ?? "",
			department: user?.department ?? "",
		}),
		[
			user?.first_name,
			user?.last_name,
			user?.email,
			user?.phone_number,
			user?.designation,
			user?.department,
		],
	);

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
		{
			// Locked: visible but disabled, and never sent to the API.
			name: "email",
			label: "Email Address",
			type: "email",
			disabled: true,
		},
		{
			name: "phone",
			label: "Phone",
			type: "tel",
			error: fieldErrors.phone,
		},
		{
			name: "designation",
			label: "Designation",
			error: fieldErrors.designation,
		},
		{
			name: "department",
			label: "Department",
			error: fieldErrors.department,
		},

		/*
		 * Social links section (display-only grouped icons + four URL inputs)
		 * is commented out for now.
		 *
		 * {
		 * 	id: "profile-social-links",
		 * 	label: "Social Links",
		 * 	visibleInEdit: false,
		 * 	displayValue: (
		 * 		<div className="profile-social-links">
		 * 			<SocialLink href={...} label="Facebook" icon={<AiOutlineFacebook size={18} aria-hidden="true" />} />
		 * 			<SocialLink href={...} label="X" icon={<AiOutlineTwitter size={18} aria-hidden="true" />} />
		 * 			<SocialLink href={...} label="LinkedIn" icon={<AiOutlineLinkedin size={18} aria-hidden="true" />} />
		 * 			<SocialLink href={...} label="Instagram" icon={<AiOutlineInstagram size={18} aria-hidden="true" />} />
		 * 		</div>
		 * 	),
		 * },
		 * { name: "facebook", label: "Facebook URL", type: "url", visibleInDisplay: false },
		 * { name: "twitter", label: "X URL", type: "url", visibleInDisplay: false },
		 * { name: "linkedin", label: "LinkedIn URL", type: "url", visibleInDisplay: false },
		 * { name: "instagram", label: "Instagram URL", type: "url", visibleInDisplay: false },
		 */
	];

	const addressFields: EditableCardField<AddressValues>[] = [
		{ name: "country", label: "Country" },
		{ name: "cityState", label: "City / State" },
		{ name: "postalCode", label: "Postal Code" },
		{ name: "taxId", label: "Tax ID" },
	];

	/*
	 * Returns true only after the backend confirms the save, so EditableCard
	 * stays in edit mode on validation or API failure.
	 */
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
						{
							label: "Home Screen",
							href: "/",
						},

						{
							label: "User profile",
						},
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

										{profileValues.designation ? (
											<span className="profile-summary-role">
												{profileValues.designation}
											</span>
										) : null}
									</div>

									<div className="profile-summary-details">
										{profileValues.department ? (
											<span className="profile-summary-detail">
												<Building2 size={14} aria-hidden="true" />
												<span>{profileValues.department}</span>
											</span>
										) : null}
									</div>
								</div>
							</div>
						}
					/>

					{/* Address is locked for now: no edit button, no save path. */}
					{/* <EditableCard
						title="Address"
						value={DEFAULT_ADDRESS}
						fields={addressFields}
						editable={false}
						onSubmit={lockedAddressSubmit}
					/> */}
				</div>
			</section>
		</PageSectionLayout>
	);
}
