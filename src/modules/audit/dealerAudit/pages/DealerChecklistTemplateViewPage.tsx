// modules/audit/dealerAudit/pages/DealerChecklistTemplateViewPage.tsx
//
// Read-only template view (/checklist/:templateId). Reuses the builder's
// preview so View and Review always render identically.

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileWarning, Pencil } from "lucide-react";

import Button from "../../../../components/common/Button";
import { Badge } from "../../../../components/common/Badge";
import { CardEmpty, CardSkeleton } from "../../../../components/ui/CardSkeleton";
import { PageHeader } from "../../../../components/ui/PageHeader";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import AuditTemplatePreview from "../../shared/templates/AuditTemplatePreview";
import {
	getTemplateStatusBadgeVariant,
	getTemplateStatusLabel,
} from "../../shared/templates/audit-template.status";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { useDealerAuditAccess } from "../hooks/useDealerAuditAccess";
import { useDealerChecklistTemplate } from "../hooks/useDealerChecklistTemplateEditor";
import {
	DEALER_TEMPLATE_DETAIL_FIELDS,
	DEALER_TEMPLATE_PARAMETER_FIELDS,
} from "../templates/dealer-template.config";
import { mapDealerTemplateToBuilderValues } from "../templates/dealer-template.mappers";

export default function DealerChecklistTemplateViewPage() {
	const navigate = useNavigate();
	const { templateId } = useParams<{ templateId: string }>();
	const permissions = useDealerAuditAccess();
	const templateQuery = useDealerChecklistTemplate(templateId);
	const template = templateQuery.data;

	const previewValues = useMemo(
		() => (template ? mapDealerTemplateToBuilderValues(template) : null),
		[template],
	);

	return (
		<PageSectionLayout className="dealer-audit-page">
			<PageHeader>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex min-w-0 flex-col gap-1">
						<span className="text-eyebrow text-(--color-brand)">
							Checklist template
						</span>
						<h1 className="truncate text-page-title text-(--color-text-primary)">
							{template?.name ?? "Template"}
						</h1>
						{template ? (
							<div className="flex flex-wrap items-center gap-2 text-body-sm text-(--color-text-secondary)">
								<Badge
									variant={getTemplateStatusBadgeVariant(template.status)}
									text={`● ${getTemplateStatusLabel(template.status)}`}
								/>
								<span>v{template.version}</span>
								{template.updatedByName ? (
									<span>· Updated by {template.updatedByName}</span>
								) : null}
							</div>
						) : null}
					</div>

					<div className="flex flex-wrap gap-2">
						<Button
							text="Back to library"
							variant="outline"
							Icon={ArrowLeft}
							onClick={() => navigate(DEALER_AUDIT_ROUTES.template.list)}
						/>
						{permissions.canManageTemplates && template ? (
							<Button
								text="Edit template"
								variant="brand"
								Icon={Pencil}
								onClick={() => navigate(DEALER_AUDIT_ROUTES.template.edit(template.id))}
							/>
						) : null}
					</div>
				</div>
			</PageHeader>

			{templateQuery.isLoading ? (
				<CardSkeleton />
			) : templateQuery.isError || !previewValues ? (
				<CardEmpty
					title="Template unavailable"
					description={getAuditActionErrorMessage(templateQuery.error, "template")}
					Icon={FileWarning}
				/>
			) : (
				<AuditTemplatePreview
					values={previewValues}
					detailFields={DEALER_TEMPLATE_DETAIL_FIELDS}
					parameterFields={DEALER_TEMPLATE_PARAMETER_FIELDS}
					summaryTitle="Template summary"
				/>
			)}
		</PageSectionLayout>
	);
}
