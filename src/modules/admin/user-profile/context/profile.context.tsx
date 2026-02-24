import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { type Profile } from "../profile.types";

interface ProfileContextType {
	profiles: Profile[];
	createProfile: (profile: Profile) => void;
	updateProfile: (profile: Profile) => void;
	deleteProfile: (id: string) => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const ProfileProvider = ({
	children,
	initialData,
}: {
	children: ReactNode;
	initialData: Profile[];
}) => {
	const [profiles, setProfiles] = useState(initialData);

	const value = useMemo(
		() => ({
			profiles,
			createProfile: (profile: Profile) =>
				setProfiles((prev) => [profile, ...prev]),

			updateProfile: (profile: Profile) =>
				setProfiles((prev) =>
					prev.map((p) => (p.id === profile.id ? profile : p)),
				),

			deleteProfile: (id: string) =>
				setProfiles((prev) => prev.filter((p) => p.id !== id)),
		}),
		[profiles],
	);

	return (
		<ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
	);
};

export const useProfiles = () => {
	const ctx = useContext(ProfileContext);
	if (!ctx) throw new Error("useProfiles must be used inside provider");
	return ctx;
};
