// ProfileFormPage.tsx
// ------------------------------------------------------------------
// Main form container.
// Now very clean because permission logic is abstracted.
// ------------------------------------------------------------------

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ServerAxios } from "../../../../services/ServerAxios";
import { useAuth } from "../../../../context/Auth/useAuth";
import { useToast } from "../../../../context/Auth/AuthContext";
import { useTheme } from "../../../../providers/ThemeContext";
import ProfileGeneralSection from "./ProfileGeneralSection";
import PermissionMatrix from "./PermissionMatrix";
import { apps } from "../constant";
import { usePermissionMatrix } from "../hooks/userPermissionMatrix";
import type { Profile, WorkspacePayload } from "../types/profile.types";

export const ProfileFormPage = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [activeSection, setActiveSection] = useState<"general" | "permissions">(
    "general",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<Profile>({
    id: "",
    name: "",
    description: "",
    assignedUserCount: 0,
    isSystemProfile: false,
    users: [],
    permissions: [],
  });
  const navigate = useNavigate();
  const { workspaceId } = useAuth();
  const { showToast } = useToast();
  const { theme } = useTheme();

  // 🔥 All permission logic comes from hook
  const {
    permState,
    togglePerm,
    toggleAppAll,
    toggleAppAction,
    appActionState,
  } = usePermissionMatrix(form.permissions);

  useEffect(() => {
    const loadProfileToBeUpdated = async () => {
      try {
        const { data } = await ServerAxios.get(`/profile/${id}`);

        console.log({ data });
        setForm(data);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Failed to load profiles:", error?.message);
        } else {
          console.error("Failed to load profiles:", error);
        }
      }
    };

    if (id) {
      loadProfileToBeUpdated();
    }
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (permissions: WorkspacePayload) => {
    try {
      setIsLoading(true);
      const payload = {
        name: form?.name, // optional
        description: form?.description, // optional
        permissions: permissions, // required
      };

      console.log("Submitting Payload =>", payload);
      let apiResponseMessage;
      if (isEditing) {
        const {
          data: { message },
        } = await ServerAxios.patch(`/profile/update/${id}`, payload);
        apiResponseMessage = message;
      } else {
        const {
          data: { message },
        } = await ServerAxios.post(`/profile/create`, {
          workspaceId,
          ...payload,
        });
        apiResponseMessage = message;
      }

      showToast({
        type: "success",
        title: apiResponseMessage,
      });

      navigate("/admin/user_profiles");
    } catch (error) {
      console.error("Failed to update profile:", error);

      showToast({
        type: "error",
        title: "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredApps = apps.map((app) => ({
    ...app,
    modules: app.modules.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()),
    ),
  }));

  console.log({ permState });

  return (
    <div
      className="bg-white 0.3s ease max-w-full mx-auto h-full min-h-screen"
      data-theme={theme}
    >
      <div className="max-w-full mx-auto h-full p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/admin/user_profiles")}
            className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center"
          >
            <ArrowLeft />
          </button>

          <h2 className="text-xl font-bold text-zinc-50">
            {isEditing ? `Editing: ${form?.name}` : "New User Profile"}
          </h2>
        </div>

        {/* Sections */}
        {activeSection === "general" && (
          <ProfileGeneralSection
            form={form}
            isEditing={isEditing}
            handleChange={handleChange}
            setForm={setForm}
            onCancel={() => navigate("/admin/user_profiles")}
            onSubmit={() => {}}
            onPermission={() => setActiveSection("permissions")}
          />
        )}

        {activeSection === "permissions" && (
          <PermissionMatrix
            filteredApps={filteredApps}
            collapsed={collapsed}
            permState={permState}
            search={search}
            setSearch={setSearch}
            setCollapsed={setCollapsed}
            appActionState={appActionState}
            toggleAppAll={toggleAppAll}
            toggleAppAction={toggleAppAction}
            togglePerm={togglePerm}
            onSavePermissions={handleSave}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};
