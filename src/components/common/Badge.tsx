import { resolveStatusStyle, resolveVariantStyle } from "../styles.constant";
import type { BadgeProps } from "./common.types";

const normalizeStatus = (status?: string) => status?.toLowerCase().trim() ?? "";

export function Badge({ children, status, variant }: BadgeProps) {
	const normalized = normalizeStatus(status);
	const normalizedVariant = normalizeStatus(variant);
	const styleClass =
		resolveStatusStyle({ status: normalized || "" }) ||
		resolveVariantStyle({ variant: normalizedVariant || "" });

	return (
		<>
			<span className={`badge ${styleClass}`}>{children || status}</span>
		</>
	);
}
