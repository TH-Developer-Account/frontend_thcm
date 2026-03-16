import React from "react";
import type { ApprovalDotProps } from "./common.types";
import {
	APPROVAL_DOT_STATUS,
	APPROVAL_DOT_STATUS_COMPLETED,
	APPROVAL_LINE_COLOR,
} from "../styles.constant";
import {
	Check,
	ThumbsUp,
	Send,
	FileCheck,
	Clock,
	X,
	Undo2,
	CheckCheck,
} from "lucide-react";

/* ----------------------------- Helpers ----------------------------- */
const normalizeStatus = (status?: string) => status?.toLowerCase().trim() ?? "";

/* -------------------------------- Icons -------------------------------- */
const APPROVAL_STATUS_ICON: Record<string, React.ReactNode> = {
	approved: <Check />,
	recommended: <ThumbsUp />,
	submitted: <Send />,
	"report submitted": <FileCheck />,
	pending: <Clock />,
	cancelled: <X />,
	"sent back": <Undo2 />,
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
	isLast = false,
	isFuture,
	isCompleted,
}: ApprovalDotProps & { isLast?: boolean }) => {
	const normalized = normalizeStatus(status);

	const baseStyle =
		APPROVAL_DOT_STATUS[normalized] ??
		"bg-slate-200 text-slate-600 ring-slate-200";

	const dotStyle = isFuture
		? "bg-gray-300 text-gray-500 ring-gray-200"
		: isCompleted
			? APPROVAL_DOT_STATUS_COMPLETED[normalized]
			: baseStyle;

	const lineStyle = isFuture
		? "bg-slate-300"
		: (APPROVAL_LINE_COLOR[normalized] ?? "bg-slate-300");

	const icon =
		APPROVAL_STATUS_ICON[normalized] ?? (label ? label : <Check size={16} />);

	return (
		<div className="relative flex flex-col items-center">
			{/* DOT */}
			<div
				className={`
			rounded-full
			flex items-center justify-center
			font-bold
			shadow-sm
			ring-4
			transition-all duration-300
			${sizeClasses[size]}
			${dotStyle}
			${className ?? ""}
		  `}
			>
				{icon}
			</div>

			{/* CONNECTOR LINE */}
			{!isLast && (
				<div
					className={`
						absolute
						bottom-0
						top-15
						left-1/2
						-translate-x-1/2
						w-[2px]
						h-10
			  ${lineStyle}
			`}
				/>
			)}
		</div>
	);
};

export default ApprovalDot;
