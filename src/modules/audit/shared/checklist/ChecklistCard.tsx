// modules/audit/shared/ChecklistCard.tsx
import type { ReactNode } from "react";
import { Ban, CheckCircle2, ClipboardList, Pencil, Trash2 } from "lucide-react";

import Card from "../../../../components/common/Card";
import { Badge } from "../../../../components/common/Badge";
import Avatar from "../../../../components/common/Avatar";
import ActionMenu, {
	type ActionMenuItem,
} from "../../../../components/common/ActionMenu";
import type { AuditModuleKey } from "../shared.audit.types";

export type ChecklistTemplateStatus = "published" | "draft" | "archived";

export type ChecklistOwner = {
	id: string;
	firstName: string;
	lastName?: string;
	imageUrl?: string;
	className?: string;
};

export type ChecklistCardActionData = {
	id: string;
	title: string;
	status: ChecklistTemplateStatus;
	isBlocked: boolean;
};

export type ChecklistCardProps = {
	id: string;
	title: string;
	description?: string;
	status: ChecklistTemplateStatus;
	sectionCount: number;
	pointCount: number;
	readiness: number;
	updatedLabel: string;
	owners?: readonly ChecklistOwner[];

	/**
	 * Which audit module this template belongs to. Optional — a
	 * single-module library (e.g. Dealer Audit's own listing) can omit
	 * it; a combined library renders it as a small badge so templates
	 * from different modules aren't mistaken for one another.
	 */
	auditModule?: AuditModuleKey;
	auditModuleLabel?: string;

	isBlocked?: boolean;
	canEdit?: boolean;
	canBlock?: boolean;
	canDelete?: boolean;

	onOpen?: (id: string) => void;
	onEdit?: (id: string) => void;
	onToggleBlocked?: (id: string, nextBlocked: boolean) => void;
	onDelete?: (id: string) => void;

	actions?: ReactNode;
	featured?: boolean;
	className?: string;
};

const joinClassNames = (
	...values: Array<string | false | null | undefined>
): string => values.filter(Boolean).join(" ");

const pluralize = (count: number, singular: string): string =>
	`${count} ${count === 1 ? singular : `${singular}s`}`;

const clampPercentage = (value: number): number =>
	Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));

const STATUS_CONFIG: Record<
	ChecklistTemplateStatus,
	{ variant: "success" | "warning" | "neutral"; text: string }
> = {
	published: { variant: "success", text: "● Published" },
	draft: { variant: "warning", text: "● Draft" },
	archived: { variant: "neutral", text: "Archived" },
};

export default function ChecklistCard({
	id,
	title,
	description,
	status,
	sectionCount,
	pointCount,
	readiness,
	updatedLabel,
	owners = [],
	auditModuleLabel,

	isBlocked = false,
	canEdit = true,
	canBlock = true,
	canDelete = true,

	onOpen,
	onEdit,
	onToggleBlocked,
	onDelete,

	actions,
	featured = false,
	className = "",
}: ChecklistCardProps) {
	const safeReadiness = clampPercentage(readiness);
	const statusConfig = STATUS_CONFIG[status];
	const isInteractive = Boolean(onOpen);

	const actionData: ChecklistCardActionData = {
		id,
		title,
		status,
		isBlocked,
	};

	const menuActions: ActionMenuItem<ChecklistCardActionData>[] = [
		{
			id: "edit",
			label: "Edit template",
			Icon: Pencil,
			hidden: !canEdit || !onEdit,
			onClick: (template) => onEdit?.(template.id),
		},
		{
			id: "toggle-block",
			label: isBlocked ? "Unblock template" : "Block template",
			Icon: isBlocked ? CheckCircle2 : Ban,
			hidden: !canBlock || !onToggleBlocked,
			onClick: (template) =>
				onToggleBlocked?.(template.id, !template.isBlocked),
		},
		{
			id: "delete",
			label: "Delete template",
			Icon: Trash2,
			variant: "danger",
			hidden: !canDelete || !onDelete,
			onClick: (template) => onDelete?.(template.id),
		},
	];

	const hasMenuActions = menuActions.some((action) => !action.hidden);
	const openCard = () => onOpen?.(id);

	return (
		<Card
			as="article"
			padding="compact"
			variant="outlined"
			className={joinClassNames(
				"checklist-card",
				featured && "checklist-card-featured",
				isInteractive && "checklist-card-interactive",
				className,
			)}
		>
			{isInteractive ? (
				<button
					type="button"
					className="checklist-card-hit-area"
					onClick={openCard}
					aria-label={`Open checklist ${title}`}
				/>
			) : null}

			<div className="checklist-card-body">
				<div className="checklist-card-heading-row">
					<div className="checklist-card-icon" aria-hidden="true">
						<ClipboardList size={21} strokeWidth={1.9} />
					</div>

					<div className="checklist-card-copy">
						<h3 className="checklist-card-title">{title}</h3>
						<p
							className="checklist-card-description"
							aria-hidden={description ? undefined : true}
						>
							{description ?? "\u00A0"}
						</p>
					</div>

					{actions || hasMenuActions ? (
						<div
							className="checklist-card-action-slot"
							onClick={(event) => event.stopPropagation()}
						>
							{actions ?? (
								<ActionMenu
									row={actionData}
									actions={menuActions}
									size="sm"
									ariaLabel={`Actions for ${title}`}
									triggerClassName="checklist-card-actions"
								/>
							)}
						</div>
					) : null}
				</div>

				<div className="checklist-card-meta" aria-label="Checklist summary">
					<Badge
						status={status}
						variant={statusConfig.variant}
						text={statusConfig.text}
					/>
					{auditModuleLabel ? (
						<Badge variant="neutral" text={auditModuleLabel} />
					) : null}
					<Badge variant="neutral" text={pluralize(sectionCount, "section")} />
					<Badge variant="neutral" text={pluralize(pointCount, "point")} />
				</div>

				<div className="checklist-card-readiness">
					<div className="checklist-card-readiness-label">
						<span>Template readiness</span>
						<strong>{safeReadiness}%</strong>
					</div>
					<div
						className={joinClassNames(
							"checklist-card-progress",
							safeReadiness === 100 && "is-complete",
						)}
						role="progressbar"
						aria-label="Template readiness"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={safeReadiness}
					>
						<span style={{ width: `${safeReadiness}%` }} />
					</div>
				</div>
			</div>

			<footer className="checklist-card-footer">
				<span>{updatedLabel}</span>
				{owners.length > 0 ? (
					<div className="checklist-card-owners" aria-label="Checklist owners">
						{owners.slice(0, 3).map((owner) => (
							<Avatar
								key={owner.id}
								firstName={owner.firstName}
								lastName={owner.lastName}
								imageUrl={owner.imageUrl}
								size="sm"
								isTooltip={false}
								className={owner.className}
							/>
						))}
						{owners.length > 3 ? (
							<span className="checklist-card-owner-overflow">
								+{owners.length - 3}
							</span>
						) : null}
					</div>
				) : null}
			</footer>
		</Card>
	);
}
