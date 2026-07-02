import { useMemo, useState, type ReactNode } from "react";
import { MapPin } from "lucide-react";

import EditableCard, {
	type EditableCardField,
} from "../../../components/common/EditableCard";
import { useAuth } from "../../../context/Auth/useAuth";
import {
	AiOutlineFacebook,
	AiOutlineInstagram,
	AiOutlineLinkedin,
	AiOutlineTwitter,
} from "react-icons/ai";
import Card from "../../common/Card";

type UserRole = "ADMIN" | "MANAGER" | "VIEWER";

type ProfileValues = {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	bio: string;
	location: string;
	facebook: string;
	twitter: string;
	linkedin: string;
	instagram: string;
};

type AddressValues = {
	country: string;
	cityState: string;
	postalCode: string;
	taxId: string;
};

type SocialLinkProps = {
	href?: string;
	label: string;
	icon: ReactNode;
};

type UserProfileProps = {
	userRole?: UserRole;
};

const DEFAULT_ADDRESS: AddressValues = {
	country: "United States",
	cityState: "Phoenix, Arizona, United States",
	postalCode: "ERT 2489",
	taxId: "AS4568384",
};

const DEFAULT_PROFILE_DETAILS = {
	bio: "Team Manager",
	location: "Phoenix, Arizona, United States",
	facebook: "https://www.facebook.com/PimjoHQ",
	twitter: "https://x.com/PimjoHQ",
	linkedin: "https://www.linkedin.com/company/pimjo",
	instagram: "https://instagram.com/PimjoHQ",
};

function SocialLink({ href, label, icon }: SocialLinkProps) {
	if (!href) return null;

	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="profile-social-icon-link"
			aria-label={`Open ${label} profile`}
			title={label}
		>
			{icon}
		</a>
	);
}

export default function UserProfile({ userRole = "ADMIN" }: UserProfileProps) {
	const { user } = useAuth();
	const isViewer = userRole === "VIEWER";

	const [profileDetails, setProfileDetails] = useState(DEFAULT_PROFILE_DETAILS);

	const [address, setAddress] = useState<AddressValues>(DEFAULT_ADDRESS);

	const profileValues = useMemo<ProfileValues>(
		() => ({
			firstName: user?.first_name ?? "",
			lastName: user?.last_name ?? "",
			email: user?.email ?? "",
			phone: user?.phone_number ?? "",
			bio: profileDetails.bio,
			location: profileDetails.location,
			facebook: profileDetails.facebook,
			twitter: profileDetails.twitter,
			linkedin: profileDetails.linkedin,
			instagram: profileDetails.instagram,
		}),
		[
			user?.first_name,
			user?.last_name,
			user?.email,
			user?.phone_number,
			profileDetails,
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
		},
		{
			name: "lastName",
			label: "Last Name",
			required: true,
		},
		{
			name: "email",
			label: "Email Address",
			type: "email",
			required: true,
		},
		{
			name: "phone",
			label: "Phone",
			type: "tel",
		},
		{
			name: "bio",
			label: "Bio",
		},
		{
			name: "location",
			label: "Location",
		},

		/*
		 * Display-only grouped social links.
		 * This field does not require a data name because it is
		 * never rendered as an input.
		 */
		{
			id: "profile-social-links",
			label: "Social Links",
			visibleInEdit: false,
			displayValue: (
				<div className="profile-social-links">
					<SocialLink
						href={profileValues.facebook}
						label="Facebook"
						icon={<AiOutlineFacebook size={18} aria-hidden="true" />}
					/>

					<SocialLink
						href={profileValues.twitter}
						label="X"
						icon={<AiOutlineTwitter size={18} aria-hidden="true" />}
					/>

					<SocialLink
						href={profileValues.linkedin}
						label="LinkedIn"
						icon={<AiOutlineLinkedin size={18} aria-hidden="true" />}
					/>

					<SocialLink
						href={profileValues.instagram}
						label="Instagram"
						icon={<AiOutlineInstagram size={18} aria-hidden="true" />}
					/>
				</div>
			),
		},

		/*
		 * Social URLs appear only when editing.
		 */
		{
			name: "facebook",
			label: "Facebook URL",
			type: "url",
			placeholder: "https://facebook.com/username",
			visibleInDisplay: false,
		},
		{
			name: "twitter",
			label: "X URL",
			type: "url",
			placeholder: "https://x.com/username",
			visibleInDisplay: false,
		},
		{
			name: "linkedin",
			label: "LinkedIn URL",
			type: "url",
			placeholder: "https://linkedin.com/in/username",
			visibleInDisplay: false,
		},
		{
			name: "instagram",
			label: "Instagram URL",
			type: "url",
			placeholder: "https://instagram.com/username",
			visibleInDisplay: false,
		},
	];

	const addressFields: EditableCardField<AddressValues>[] = [
		{
			name: "country",
			label: "Country",
			required: true,
		},
		{
			name: "cityState",
			label: "City / State",
			required: true,
		},
		{
			name: "postalCode",
			label: "Postal Code",
		},
		{
			name: "taxId",
			label: "Tax ID",
		},
	];

	const saveProfile = async (values: ProfileValues) => {
		console.log("Save profile", values);

		/*
		 * Replace this block with your profile API mutation.
		 *
		 * await ServerAxios.put("/user/profile", {
		 *   first_name: values.firstName,
		 *   last_name: values.lastName,
		 *   email: values.email,
		 *   phone_number: values.phone,
		 *   bio: values.bio,
		 *   location: values.location,
		 *   facebook: values.facebook,
		 *   twitter: values.twitter,
		 *   linkedin: values.linkedin,
		 *   instagram: values.instagram,
		 * });
		 *
		 * Refresh or update the Auth context after saving the
		 * identity fields returned by the API.
		 */

		setProfileDetails({
			bio: values.bio,
			location: values.location,
			facebook: values.facebook,
			twitter: values.twitter,
			linkedin: values.linkedin,
			instagram: values.instagram,
		});
	};

	const saveAddress = async (values: AddressValues) => {
		console.log("Save address", values);

		// Replace with the address API mutation.
		setAddress(values);
	};

	return (
		<section className="profile-page" aria-labelledby="profile-page-title">
			<header className="profile-page-header">
				<div className="profile-page-heading">
					<p className="profile-page-eyebrow">Account settings</p>

					<h2 id="profile-page-title" className="profile-page-title">
						Profile
					</h2>
				</div>
			</header>

			<div className="profile-page-sections">
				<EditableCard
					title="User Information"
					subtitle="Personal information, contact details and social profiles"
					editTitle="Edit User Information"
					editSubtitle="Update your personal information and social profile URLs."
					value={profileValues}
					fields={profileFields}
					editable={!isViewer}
					onSubmit={saveProfile}
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

									<span className="profile-summary-role">
										{profileValues.bio}
									</span>
								</div>

								<div className="profile-summary-details">
									{profileValues.location ? (
										<span className="profile-summary-detail">
											<MapPin size={14} aria-hidden="true" />
											<span>{profileValues.location}</span>
										</span>
									) : null}
								</div>
							</div>
						</div>
					}
				/>

				<EditableCard
					title="Address"
					subtitle="Registered address and tax information"
					editTitle="Edit Address"
					editSubtitle="Update your registered address and tax information."
					value={address}
					fields={addressFields}
					editable={!isViewer}
					onSubmit={saveAddress}
				/>
				<Card>Hello</Card>
			</div>
		</section>
	);
}
