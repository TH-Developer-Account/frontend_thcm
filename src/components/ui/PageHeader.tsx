// PageHeader.tsx
import { Link } from "react-router-dom";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface Props {
	title: string;
	breadcrumbs: BreadcrumbItem[];
}

export function PageHeader({ title, breadcrumbs }: Props) {
	return (
		<div className=" px-3 py-3 text-left">
			{/* Title */}
			<h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>

			{/* Breadcrumb */}
			<div className="flex items-center text-sm text-gray-500 space-x-3">
				{breadcrumbs.map((item, index) => {
					const isLast = index === breadcrumbs.length - 1;

					return (
						<div key={index} className="flex items-center space-x-3">
							{item.href && !isLast ? (
								<Link to={item.href} className="hover:text-gray-700 transition">
									{item.label}
								</Link>
							) : (
								<span className={isLast ? "text-gray-400" : ""}>
									{item.label}
								</span>
							)}

							{!isLast && <span>•</span>}
						</div>
					);
				})}
			</div>
		</div>
	);
}
