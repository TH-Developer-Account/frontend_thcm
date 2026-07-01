import {
	getStatusLabel,
	getStatusVariant,
} from "../../modules/marketing/activity-planner/utils/formatters";
import { resolveStatusStyle, resolveVariantStyle } from "../styles.constant";
import type { BadgeProps } from "./common.types";

const normalizeStatus = (status?: string | null) =>
	status?.toLowerCase().trim() ?? "";

export function Badge({ children, status, variant, text }: BadgeProps) {
	const label = text ?? children ?? getStatusLabel(status);

	const resolvedVariant = variant ?? getStatusVariant(status);

	const normalizedStatus = normalizeStatus(status);
	const normalizedVariant = normalizeStatus(resolvedVariant);

	const styleClass =
		resolveStatusStyle({ status: normalizedStatus }) ||
		resolveVariantStyle({ variant: normalizedVariant });

	return <span className={`badge ${styleClass}`}>{label}</span>;
}
