import { resolveStatusStyle, resolveVariantStyle } from "../styles.constant";
import type { BadgeProps } from "./common.types";

export function Badge({ children, status }: BadgeProps) {
	const styleClass =
		resolveStatusStyle({ status: status || "" }) || resolveVariantStyle;

	return <span className={`badge ${styleClass}`}>{children || status}</span>;
}
