import { Link } from "react-router-dom";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface Props {
	title: string;
	breadcrumbs: BreadcrumbItem[];
}

export function PageLocationStepper({ title, breadcrumbs }: Props) {
	return (
		<div className="page-header">
			{/* Title */}
			<h2 className="page-title">{title}</h2>

			{/* Breadcrumb */}
			<div className="breadcrumb">
				{breadcrumbs.map((item, index) => {
					const isLast = index === breadcrumbs.length - 1;

					return (
						<div key={index} className="breadcrumb-item">
							{item.href && !isLast ? (
								<Link to={item.href} className="breadcrumb-link">
									{item.label}
								</Link>
							) : (
								<span className={isLast ? "breadcrumb-current" : ""}>
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
