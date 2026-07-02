import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { useAuth } from "../../../context/Auth/useAuth";
import { useToast } from "../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../services/ServerAxios";

import ProfileList from "./components/ProfileList";
import type { Profile } from "./types/profile.types";

const getErrorMessage = (error: unknown, fallback: string): string => {
	if (axios.isAxiosError(error)) {
		const responseData = error.response?.data as
			| {
					message?: unknown;
					error?: unknown;
			  }
			| undefined;

		if (
			typeof responseData?.message === "string" &&
			responseData.message.trim()
		) {
			return responseData.message;
		}

		if (typeof responseData?.error === "string" && responseData.error.trim()) {
			return responseData.error;
		}
	}

	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}

	return fallback;
};

export const UserProfilePage = () => {
	const { workspaceId } = useAuth();
	const navigate = useNavigate();
	const { showToast } = useToast();

	const [profiles, setProfiles] = React.useState<Profile[]>([]);
	const [search, setSearch] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(true);
	const [isFetching, setIsFetching] = React.useState(false);
	const [isError, setIsError] = React.useState(false);

	React.useEffect(() => {
		const controller = new AbortController();

		const loadProfiles = async () => {
			if (!workspaceId) {
				setProfiles([]);
				setIsLoading(false);
				setIsError(false);
				return;
			}

			setIsLoading(true);
			setIsFetching(true);
			setIsError(false);

			try {
				const response = await ServerAxios.get("/profile", {
					params: {
						workspaceId,
					},
					signal: controller.signal,
				});

				const responseData = response.data?.data;

				setProfiles(Array.isArray(responseData) ? responseData : []);
			} catch (error) {
				if (axios.isAxiosError(error) && error.code === "ERR_CANCELED") {
					return;
				}

				setProfiles([]);
				setIsError(true);

				showToast({
					type: "error",
					title: "Unable to load profiles",
					description: getErrorMessage(error, "Failed to load user profiles."),
				});
			} finally {
				if (!controller.signal.aborted) {
					setIsLoading(false);
					setIsFetching(false);
				}
			}
		};

		void loadProfiles();

		return () => {
			controller.abort();
		};
	}, [showToast, workspaceId]);

	const filteredProfiles = React.useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		if (!normalizedSearch) {
			return profiles;
		}

		return profiles.filter((profile) => {
			const name = profile.name?.toLowerCase() ?? "";
			const description = profile.description?.toLowerCase() ?? "";

			const assignedUsers =
				profile.users
					?.map((user) => `${user.firstName} ${user.lastName}`.toLowerCase())
					.join(" ") ?? "";

			return (
				name.includes(normalizedSearch) ||
				description.includes(normalizedSearch) ||
				assignedUsers.includes(normalizedSearch)
			);
		});
	}, [profiles, search]);

	const handleDelete = React.useCallback(
		async (id: string): Promise<void> => {
			try {
				const response = await ServerAxios.delete(
					`/profile/delete/${encodeURIComponent(id)}`,
				);

				const message =
					typeof response.data?.message === "string"
						? response.data.message
						: "Profile deleted successfully.";

				setProfiles((currentProfiles) =>
					currentProfiles.filter((profile) => profile.id !== id),
				);

				showToast({
					type: "success",
					title: "Profile deleted",
					description: message,
				});
			} catch (error) {
				showToast({
					type: "error",
					title: "Unable to delete profile",
					description: getErrorMessage(error, "Failed to delete the profile."),
				});
			}
		},
		[showToast],
	);

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="User Profiles"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "User profiles page location",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "User Profiles",
						},
					],
					separator: "›",
				}}
			/>

			<ProfileList
				profiles={filteredProfiles}
				search={search}
				onSearchChange={setSearch}
				onCreateNew={() => navigate("/admin/profiles/create")}
				onEdit={(profile) =>
					navigate(`/admin/profiles/${encodeURIComponent(profile.id)}/edit`)
				}
				onDelete={handleDelete}
				isLoading={isLoading}
				isFetching={isFetching}
				isError={isError}
			/>
		</PageSectionLayout>
	);
};
