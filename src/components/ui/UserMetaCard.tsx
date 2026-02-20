import { useState } from "react";
import Button from "../common/Button";
import { Modal } from "../common/Modal";
import FormInput from "../FormElements/FormInput";
import { Pencil } from "lucide-react";
import { useAuth } from "../../context/Auth/useAuth";

export default function UserMetaCard() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const handleSave = () => {
    console.log("Saving changes...");
    setOpen(false);
  };

  return (
    <>
      {/* Card */}
      <div className="p-5 border border-gray-200 rounded-2xl lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col text-left items-center w-full gap-6 lg:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full">
              <img
                src="/user.png"
                alt="user"
                className="object-cover w-full h-full"
              />
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-gray-800">
                {user?.first_name} {user?.last_name}
              </h4>
              <p className="text-sm text-gray-500">
                Team Manager • Arizona, United States
              </p>
            </div>
          </div>

          <Button
            text="Edit"
            onClick={() => setOpen(true)}
            Icon={Pencil}
            iconPosition="right"
            className="lg:w-auto"
          />
        </div>
      </div>

      {/* Modal */}
      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="max-w-[600px] mx-auto p-6 bg-white rounded-xl text-sm">
          {/* HEADER */}
          <div className="px-8 pt-6 pb-4 mb-4 border-b border-gray-100">
            <h4 className="text-2xl font-semibold text-gray-800">
              Edit Profile
            </h4>
            <p className="text-sm text-gray-500">
              Update your details to keep your profile up-to-date.
            </p>
          </div>

          {/* BODY (Scrollable) */}
          <div className="x">
            <form className="space-y-8">
              <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                <FormInput
                  name="facebook"
                  label="Facebook"
                  type="text"
                  value="https://www.facebook.com/PimjoHQ"
                />
                <FormInput
                  name="twitter"
                  label="X.com"
                  type="text"
                  value="https://x.com/PimjoHQ"
                />
                <FormInput
                  name="linkedin"
                  label="LinkedIn"
                  type="text"
                  value="https://www.linkedin.com/company/pimjo"
                />
                <FormInput
                  name="instagram"
                  label="Instagram"
                  type="text"
                  value="https://instagram.com/PimjoHQ"
                />
              </div>
            </form>
          </div>

          {/* FOOTER (Sticky) */}
          <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-gray-100 bg-white">
            <Button text="Cancel" onClick={() => setOpen(false)} />
            <Button text="Save Changes" onClick={handleSave} />
          </div>
        </div>
      </Modal>
    </>
  );
}
