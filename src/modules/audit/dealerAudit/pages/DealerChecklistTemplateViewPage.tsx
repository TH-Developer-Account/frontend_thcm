// modules/audit/dealerAudit/pages/DealerChecklistTemplateViewPage.tsx
//
// Read-only template view (/checklist/:templateId). Uses the shared preview in
// its expandable "view" variant: section cards → line items → criteria,
// scoring and reference photo.
//
// Header actions follow the template lifecycle:
//   DRAFT      Edit draft
//   PUBLISHED  New version · Archive
//   ARCHIVED   New version

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
	Archive,
	ArrowLeft,
	FilePlus2,
	FileWarning,
	Pencil,
} from "lucide-react";

import { Alert } from "../../../../components/common/Alert";
import Button from "../../../../components/common/Button";
import { Badge } from "../../../../components/common/Badge";
import {
	CardEmpty,
	CardSkeleton,
} from "../../../../components/ui/CardSkeleton";
import { PageHeader } from "../../../../components/ui/PageHeader";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import AuditConfirmModal from "../../shared/components/AuditConfirmModal";
import AuditTemplatePreview from "../../shared/templates/AuditTemplatePreview";
import {
	getTemplateStatusBadgeVariant,
	getTemplateStatusLabel,
} from "../../shared/templates/audit-template.constants";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { useDealerAuditAccess } from "../hooks/useDealerAuditAccess";
import { useDealerChecklistTemplate } from "../hooks/useDealerChecklistTemplateEditor";
import {
	useArchiveDealerChecklistTemplate,
	useCreateDealerChecklistTemplateVersion,
} from "../hooks/useDealerChecklistTemplates";
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

	const archiveMutation = useArchiveDealerChecklistTemplate();
	const newVersionMutation = useCreateDealerChecklistTemplateVersion();
	const [isArchiveOpen, setIsArchiveOpen] = useState(false);

	const previewValues = useMemo(
		() => (template ? mapDealerTemplateToBuilderValues(template) : null),
		[template],
	);

	// Saved parameter id → reference photo URL (not part of the builder form).
	const referencePhotos = useMemo(
		() =>
			Object.fromEntries(
				(template?.parameters ?? []).map((parameter) => [
					parameter.id,
					parameter.referencePhotoUrl,
				]),
			),
		[template],
	);

	const canManage = permissions.canManageTemplates && Boolean(template);
	const isDraft = template?.status === "DRAFT";
	const isPublished = template?.status === "PUBLISHED";
	const isReadOnlyVersion = Boolean(template) && !isDraft;

	const handleNewVersion = () => {
		if (!template || newVersionMutation.isPending) return;
		newVersionMutation.mutate(template.id, {
			onSuccess: (draft) =>
				navigate(DEALER_AUDIT_ROUTES.template.edit(draft.id)),
		});
	};

	const handleConfirmArchive = () => {
		if (!template || archiveMutation.isPending) return;
		archiveMutation.mutate(template.id, {
			onSuccess: () => setIsArchiveOpen(false),
		});
	};

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
						{canManage && isDraft && template ? (
							<Button
								text="Edit draft"
								variant="brand"
								Icon={Pencil}
								onClick={() =>
									navigate(DEALER_AUDIT_ROUTES.template.edit(template.id))
								}
							/>
						) : null}
						{canManage && isReadOnlyVersion ? (
							<Button
								text="New version"
								variant="brand"
								Icon={FilePlus2}
								loading={newVersionMutation.isPending}
								onClick={handleNewVersion}
							/>
						) : null}
						{canManage && isPublished ? (
							<Button
								text="Archive"
								variant="outline"
								Icon={Archive}
								onClick={() => {
									archiveMutation.reset();
									setIsArchiveOpen(true);
								}}
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
					description={getAuditActionErrorMessage(
						templateQuery.error,
						"template",
					)}
					Icon={FileWarning}
				/>
			) : (
				<>
					{isReadOnlyVersion ? (
						<Alert
							variant="info"
							type="banner"
							title={`This version is ${template?.status === "ARCHIVED" ? "archived" : "published"} and read-only`}
							description={
								canManage
									? "To make changes, create a new version. Audits already created keep the version they started with."
									: "Audits already created keep the version they started with."
							}
						/>
					) : null}
					<AuditTemplatePreview
						values={previewValues}
						layout="flat"
						variant="view"
						referencePhotos={referencePhotos}
						detailFields={DEALER_TEMPLATE_DETAIL_FIELDS}
						parameterFields={DEALER_TEMPLATE_PARAMETER_FIELDS}
						summaryTitle="Final summary"
					/>
				</>
			)}

			<AuditConfirmModal
				open={isArchiveOpen}
				tone="warning"
				title="Archive template?"
				warningTitle="It will no longer be available for new audits"
				warningDescription="Audits already created keep their checklist version. You can create a new version from it later."
				confirmLabel="Archive template"
				isConfirming={archiveMutation.isPending}
				errorMessage={
					archiveMutation.isError
						? getAuditActionErrorMessage(archiveMutation.error, "template")
						: null
				}
				onConfirm={handleConfirmArchive}
				onClose={() => setIsArchiveOpen(false)}
			>
				{template ? (
					<p className="text-body-sm text-(--color-text-primary)">
						<span className="font-semibold">{template.name}</span>{" "}
						<span className="text-(--color-text-secondary)">
							· v{template.version}
						</span>
					</p>
				) : null}
			</AuditConfirmModal>
		</PageSectionLayout>
	);
}
