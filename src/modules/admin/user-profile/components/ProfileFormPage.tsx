// ProfileFormPage.tsx
// ------------------------------------------------------------------
// Main form container.
// Now very clean because permission logic is abstracted.
// ------------------------------------------------------------------

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import ProfileGeneralSection from "./ProfileGeneralSection";
import PermissionMatrix from "./PermissionMatrix";
import { apps } from "../constant";
import { usePermissionMatrix } from "../hooks/userPermissionMatrix";
import type { Profile, WorkspacePayload } from "../types/profile.types";

interface Props {
  existingProfile: Profile | null;
  onSave: (payload: WorkspacePayload) => void;
  onCancel: () => void;
}

export const ProfileFormPage: React.FC<Props> = ({
  existingProfile,
  onSave,
  onCancel,
}) => {
  const isEditing = !!existingProfile;
  const [activeSection, setActiveSection] = useState<"general" | "permissions">(
    "general",
  );
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // 🔥 All permission logic comes from hook
  const {
    permState,
    togglePerm,
    toggleAppAll,
    toggleAppAction,
    appActionState,
  } = usePermissionMatrix(existingProfile);

  const [form, setForm] = useState<Profile>(
    existingProfile || {
      id: "",
      name: "",
      description: "",
      assignedUserCount: 0,
      isSystemProfile: false,
      users: [],
      permissions: [],
    },
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const filteredApps = apps.map((app) => ({
    ...app,
    modules: app.modules.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()),
    ),
  }));

  return (
    <div className="max-w-full mx-auto h-full p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onCancel}
          className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center"
        >
          <ArrowLeft />
        </button>

        <h2 className="text-xl font-bold text-zinc-50">
          {isEditing ? `Editing: ${existingProfile?.name}` : "New User Profile"}
        </h2>
      </div>

      {/* Sections */}
      {activeSection === "general" && (
        <ProfileGeneralSection
          form={form}
          isEditing={isEditing}
          handleChange={handleChange}
          setForm={setForm}
          onCancel={onCancel}
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
          onSavePermissions={onSave}
        />
      )}
    </div>
  );
};
