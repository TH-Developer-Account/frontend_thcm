import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Calendar, X, ArrowLeft } from "lucide-react";
import type { ComponentType } from "react";

type NavItem = {
  label: string;
  icon: ComponentType<{ size?: number }>;
  path: string;
};

const nav: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, path: "/overview" },
  { label: "EPC", icon: Calendar, path: "/epc" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  active: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, active }) => {
  const navigate = useNavigate();
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-orange-500 text-white flex-col
          transform transition-transform duration-300
          md:relative md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-4 font-bold text-lg flex items-center gap-3">
          <button onClick={() => navigate("/")}>
            <ArrowLeft size={20} />
          </button>
          <div className="p-4 font-bold text-lg flex items-center justify-between">
            TATA HITACHI
            {/* Close button only on mobile */}
            <button
              className="md:hidden"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-2">
          {nav.map(({ label, icon: Icon, path }) => {
            const isActive = active === path;

            return (
              <a
                key={label}
                href={path}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer !text-white
                  ${isActive ? "bg-orange-600" : "hover:bg-orange-600"}
                `}
              >
                <Icon size={18} />
                {label}
              </a>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
