import { useLocation } from "react-router-dom";
import { resolveBreadcrumbs } from "../routes/breadcrumbConfig"; // adjust path
import type { BreadcrumbItem } from "../components/ui/PageNavigation/pageNavigation.types";

export const usePageBreadcrumbs = (): BreadcrumbItem[] => {
	const { pathname } = useLocation();
	return resolveBreadcrumbs(pathname);
};
