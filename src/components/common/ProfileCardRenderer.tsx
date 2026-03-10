import Button from "./Button";
import { Pencil } from "lucide-react";
import type { ProfileCardRendererProps } from "./common.types";

export default function ProfileCardRenderer({
	title,
	fields,
	header,
	onEdit,
	editable = true,
}: ProfileCardRendererProps) {
	return (
		<div className="profile-card">
			<div className="profile-card-layout">
				<div className="w-full">
					{/* HEADER MODE (Meta Card) */}
					{header ? (
						<div className="profile-meta-header">
							{header.avatar && (
								<div className="profile-meta-avatar">
									<img src={header.avatar} alt="user" />
								</div>
							)}

							<div>
								<h4 className="profile-meta-name">{header.title}</h4>
								<p className="profile-meta-subtitle">{header.subtitle}</p>
							</div>
						</div>
					) : (
						<h2 className="profile-section-title">{title}</h2>
					)}

					{/* FIELDS */}
					<div className="profile-grid">
						{fields.map((field, i) => (
							<div
								key={i}
								className={field.span === 2 ? "profile-grid-span-2" : ""}
							>
								<p className="profile-field-label">{field.label}</p>
								<p className="profile-field-value">{field.value}</p>
							</div>
						))}
					</div>
				</div>

				{editable && onEdit && (
					<Button
						text="Edit"
						onClick={onEdit}
						Icon={Pencil}
						iconPosition="right"
						status="brand"
					/>
				)}
			</div>
		</div>
	);
}
