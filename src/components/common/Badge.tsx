import { resolveStatusStyle, resolveVariantStyle } from "../styles.constant";
import type { BadgeProps } from "./common.types";

const normalizeStatus = (status?: string) => status?.toLowerCase().trim() ?? "";

export function Badge({ children, status }: BadgeProps) {
	const normalized = normalizeStatus(status);
	const styleClass =
		resolveStatusStyle({ status: normalized || "" }) || resolveVariantStyle;

	return <span className={`badge ${styleClass}`}>{children || status}</span>;
}
