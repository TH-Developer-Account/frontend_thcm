import React from "react";
import type { ApprovalDotProps } from "./common.types";
import {
	APPROVAL_DOT_STATUS_ACTIVE,
	APPROVAL_DOT_STATUS_COMPLETED,
} from "../styles.constant";
import {
	Check,
	ThumbsUp,
	Send,
	FileCheck,
	Clock,
	X,
	Undo2,
	CheckLine,
} from "lucide-react";

/* ----------------------------- Helpers ----------------------------- */
const normalizeStatus = (status?: string) => status?.toLowerCase().trim() ?? "";

/* -------------------------------- Icons -------------------------------- */
const APPROVAL_STATUS_ICON: Record<string, React.ReactNode> = {
	approved: <Check size={16} />,
	recommended: <ThumbsUp size={16} />,
	submitted: <Send size={16} />,
	"report submitted": <FileCheck size={16} />,
	pending: <Clock size={16} />,
	cancelled: <X size={16} />,
	"sent back": <Undo2 size={16} />,
	completed: <CheckLine size={16} />,
	checked: <ThumbsUp size={16} />,
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
	isCurrent,
}: ApprovalDotProps & { isLast?: boolean }) => {
	const normalized = normalizeStatus(status);

	const dotStyle = isFuture
		? "bg-gray-100 text-gray-500 ring-gray-200"
		: isCompleted
			? APPROVAL_DOT_STATUS_COMPLETED[normalized]
			: isCurrent
				? APPROVAL_DOT_STATUS_ACTIVE[normalized]
				: "bg-slate-200 text-slate-600 ring-slate-200";

	// const lineStyle = isFuture
	// 	? "bg-slate-300"
	// 	: (APPROVAL_LINE_COLOR[normalized] ?? "bg-slate-300");

	const lineStyle = "bg-zinc-200";
	const icon = isCompleted ? (
		<Check size={14} />
	) : (
		(APPROVAL_STATUS_ICON[normalized] ?? (label ? label : <Check size={14} />))
	);

	return (
		<div className="relative flex flex-col items-center">
			{/* DOT */}
			<div
				className={`
			rounded-full
			flex items-center justify-center
			font-bold
			shadow-sm
			ring-3
			text-sm
			transition-all duration-300 ease-out
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
						top-11
						left-1/2
						-translate-x-1/2
						w-[2px]
						mb-1
						h-15
			  ${lineStyle}
			`}
				/>
			)}
		</div>
	);
};

export default ApprovalDot;
