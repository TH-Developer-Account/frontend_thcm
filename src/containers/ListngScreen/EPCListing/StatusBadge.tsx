import React from "react";
import type { Status } from "../types";

const styles: Record<Status, string> = {
  Done: "bg-green-100 text-green-700",
  "In process": "bg-blue-100 text-blue-700",
  Pending: "bg-gray-800 text-white",
};

interface StatusBadgeProps {
  status: Status;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
