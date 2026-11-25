// Badge — a status or label pill.
//
// Tone comes from one place (./status.ts):
//   explicit `variant` → its tone
//   otherwise `status` → the central status map
//   unknown → neutral (previously every unknown status turned amber)
// The label is always text, so colour is never the only signal; `withIcon`
// adds a matching icon for tables and dense lists.
import type { ComponentType, SVGProps } from "react";
import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	Info,
	MinusCircle,
	XCircle,
} from "lucide-react";

import {
	TONE_BADGE_CLASS,
	formatStatusLabel,
	resolveStatusTone,
	resolveVariantTone,
	type StatusTone,
} from "./status";
import type { BadgeProps } from "./common.types";

const TONE_ICONS: Partial<Record<StatusTone, ComponentType<SVGProps<SVGSVGElement>>>> = {
	success: CheckCircle2,
	danger: XCircle,
	warning: AlertTriangle,
	pending: Clock,
	info: Info,
	neutral: MinusCircle,
};

export function Badge({
	children,
	status,
	variant,
	text,
	withIcon = false,
	size = "md",
	className,
}: BadgeProps) {
	const label = text ?? children ?? (formatStatusLabel(status) || "Not set");

	// An explicit variant that isn't in the map (e.g. "outline") keeps its old look.
	const variantTone = variant ? resolveVariantTone(variant) : undefined;
	const tone: StatusTone | undefined = variant
		? variantTone
		: (resolveStatusTone(status) ?? "neutral");

	const toneClass = tone ? TONE_BADGE_CLASS[tone] : "badge-outline";

	const Icon = withIcon && tone ? TONE_ICONS[tone] : undefined;

	return (
		<span
			className={[
				"badge",
				toneClass,
				size === "sm" ? "badge-sm" : "",
				className ?? "",
			]
				.filter(Boolean)
				.join(" ")}
		>
			{Icon ? <Icon className="badge-icon" aria-hidden="true" /> : null}
			{label}
		</span>
	);
}

export default Badge;
