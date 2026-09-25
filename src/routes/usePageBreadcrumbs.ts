import { useLocation } from "react-router-dom";
import { resolveBreadcrumbs } from "../routes/breadcrumbConfig";
import type { BreadcrumbItem } from "../components/ui/PageNavigation/pageNavigation.types"; // same fix as above

export const usePageBreadcrumbs = (): BreadcrumbItem[] => {
	const { pathname } = useLocation();
	return resolveBreadcrumbs(pathname);
};
