import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/Auth/useAuth";
import { useTheme } from "../../../providers/ThemeContext";
import { useToast } from "../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../services/ServerAxios";
import ProfileList from "./components/ProfileList";
import type { Profile } from "./types/profile.types";

export const UserProfilePage = () => {
  const { theme } = useTheme();
  const { workspaceId } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const {
          data: { data },
        } = await ServerAxios.get(`/profile?workspaceId=${workspaceId}`);
        setProfiles(data);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Failed to load profiles:", error?.message);
        } else {
          console.error("Failed to load profiles:", error);
        }
      }
    };

    loadProfiles();
  }, [workspaceId]); // 👈 add workspaceId here

  // Filter users
  const filteredUsers = useMemo(() => {
    return profiles.filter((profile) =>
      profile.name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [profiles, search]);

  const handleDelete = async (id: string) => {
    try {
      const {
        data: { message },
      } = await ServerAxios.delete(`/profile/delete/${id}`);
      showToast({
        type: "success",
        title: "Success",
        description: message,
      });
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      console.log({ err });

      let message = "Failed to delete the Profile.";

      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message ?? message;
      } else if (err instanceof Error) {
        message = err.message;
      }

      showToast({
        type: "error",
        title: "Error",
        description: message,
      });
    }
  };

  return (
    <div
      className="bg-white 0.3s ease max-w-full mx-auto h-full min-h-screen"
      data-theme={theme}
    >
      <ProfileList
        profiles={filteredUsers}
        search={search}
        onSearchChange={setSearch}
        onCreateNew={() => navigate("/admin/profiles/create")}
        onEdit={(profile) => navigate(`/admin/profiles/${profile.id}/edit`)}
        onDelete={handleDelete}
        setProfiles={setProfiles}
      />
    </div>
  );
};
