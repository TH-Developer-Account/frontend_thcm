import { useState, useEffect } from "react";
import { useAuth } from "../../../context/Auth/useAuth";
import { useTheme } from "../../../providers/ThemeContext";
import { ServerAxios } from "../../../services/ServerAxios";
import ProfileList from "./components/ProfileList";
import { ProfileFormPage } from "./components/ProfileFormPage";
import type { Profile, WorkspacePayload } from "./types/profile.types";
import { useToast } from "../../../context/Auth/AuthContext";

export const UserProfilePage = () => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { workspaceId } = useAuth();

  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

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

  const handleCreate = () => {
    setEditingProfile(null);
    setView("create");
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setView("edit");
  };

  const handleDelete = (id: string) => {
    const profile = profiles.find((p) => p.id === id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));

    showToast({
      type: "info",
      title: "Profile Deleted",
      description: `"${profile?.name}" deleted successfully`,
    });
  };

  const handleSave = (data: WorkspacePayload) => {
    console.log("=======================>", data);
    // const isEditing = profiles.some((p) => p.id === data.id);
    // setProfiles((prev) =>
    //   isEditing
    //     ? prev.map((p) => (p.id === data.id ? data : p))
    //     : [data, ...prev],
    // );
    // showToast({
    //   type: "success",
    //   title: isEditing ? "Profile Updated" : "Profile Created",
    // });
    // setView("list");
  };

  return (
    <div
      className="bg-white 0.3s ease max-w-full mx-auto h-full min-h-screen"
      data-theme={theme}
    >
      {view === "list" && (
        <ProfileList
          profiles={profiles}
          onCreateNew={handleCreate}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {(view === "create" || view === "edit") && (
        <ProfileFormPage
          existingProfile={editingProfile}
          onSave={handleSave}
          onCancel={() => setView("list")}
        />
      )}
    </div>
  );
};
