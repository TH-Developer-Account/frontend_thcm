import React from "react";
import type { ApprovalDotProps } from "./common.types";
import { APPROVAL_DOT_STATUS } from "../styles.constant";
import {
	Check,
	// CheckCircle2,
	ThumbsUp,
	Send,
	FileCheck,
	Clock,
	X,
	// Ban,
	Undo2,
	// Pause,
	CheckCheck,
	// Sparkles,
} from "lucide-react";

const normalizeStatus = (status?: string) => status?.toLowerCase().trim() ?? "";

/* -------------------------------- Icons -------------------------------- */
const APPROVAL_STATUS_ICON: Record<string, React.ReactNode> = {
	approved: <Check />,
	recommended: <ThumbsUp />,
	submitted: <Send />,
	"report submitted": <FileCheck />,
	pending: <Clock />,
	cancelled: <X />,
	// blocked: <Ban />,
	"sent back": <Undo2 />,
	// inactive: <Pause />,
	completed: <CheckCheck />,
};

/* -------------------------------- Sizes -------------------------------- */

const sizeClasses = {
	xs: "w-6 h-6 text-xs",
	sm: "w-8 h-8 text-xs",
	md: "w-10 h-10 text-sm",
	lg: "w-14 h-14 text-lg",
};

/* -------------------------------- Component -------------------------------- */

const ApprovalDot = ({
	label,
	status,
	className,
	size = "md",
}: ApprovalDotProps) => {
	const normalized = normalizeStatus(status);

	const styleClass =
		APPROVAL_DOT_STATUS[normalized] ??
		"bg-slate-200 text-slate-600 ring-slate-200";

	const icon =
		APPROVAL_STATUS_ICON[normalized] ?? (label ? label : <Check size={16} />);

	return (
		<span
			className={`
        rounded-full
        flex items-center justify-center
        font-bold
        shadow-sm
        ring-4
        ${sizeClasses[size]}
        ${styleClass}
        ${className ?? ""}
      `}
		>
			{icon}
		</span>
	);
};

export default ApprovalDot;
