import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface ActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  subText: string;
  path: string;
}

function ActionCard({
  icon,
  title,
  description,
  subText,
  path,
}: ActionCardProps) {
  const navigate = useNavigate();
  return (
    <div
      className="
      bg-white rounded-xl shadow-md p-6 sm:p-8 text-center
      hover:shadow-lg transition
      cursor-pointer
    "
      onClick={() => navigate(path)}
    >
      <div className="flex justify-center mb-4">{icon}</div>

      <h3 className="text-base sm:text-lg font-semibold mb-2">{title}</h3>

      <p className="text-sm text-gray-600 mb-3">{description}</p>

      <p className="text-sm text-gray-500">{subText}</p>
    </div>
  );
}

export default ActionCard;
