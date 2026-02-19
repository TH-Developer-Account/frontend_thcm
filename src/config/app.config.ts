import {
	Megaphone,
	PackageSearch,
	UserCheck,
	Database,
	Warehouse,
	FileText,
} from "lucide-react";

export type AppModule = {
	id: string;
	title: string;
	icon: any;
	basePath: string;
};

export const appModules: AppModule[] = [
	{
		id: "marketing",
		title: "Marketing Activity Planner",
		icon: Megaphone,
		basePath: "/marketing",
	},
	{
		id: "product",
		title: "Product Selector",
		icon: PackageSearch,
		basePath: "/product",
	},
	{
		id: "accounts",
		title: "Key Account",
		icon: UserCheck,
		basePath: "/accounts",
	},
	{
		id: "customer",
		title: "Customer Master Data",
		icon: Database,
		basePath: "/customer",
	},
	{
		id: "claims",
		title: "Dealer Claims",
		icon: FileText,
		basePath: "/claims",
	},
	{
		id: "assets",
		title: "Asset Master",
		icon: Warehouse,
		basePath: "/assets",
	},
];
