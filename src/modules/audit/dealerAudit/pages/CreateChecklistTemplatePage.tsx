// modules/audit/dealerAudit/pages/CreateChecklistTemplatePage.tsx
//
// Create (/checklist/create) and edit (/checklist/:templateId/edit).
// Thin route-level wrapper: loads data, supplies Dealer field config,
// wires navigation. All builder behaviour lives in the shared builder.
//
// Only DRAFT versions are editable. Opening the edit URL of a published or
// archived version (old link, bookmark) redirects to the read-only view,
// where "New version" starts the next draft.

import { Navigate, useNavigate, useParams } from "react-router-dom";
import { FileWarning } from "lucide-react";

import Button from "../../../../components/common/Button";
import {
	CardEmpty,
	CardSkeleton,
} from "../../../../components/ui/CardSkeleton";
import { PageHeader } from "../../../../components/ui/PageHeader";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import AuditTemplateBuilder from "../../shared/templates/AuditTemplateBuilder";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { useDealerChecklistTemplateEditor } from "../hooks/useDealerChecklistTemplateEditor";
import {
	DEALER_TEMPLATE_DETAIL_FIELDS,
	DEALER_TEMPLATE_PARAMETER_FIELDS,
} from "../templates/dealer-template.config";
import { mapServerErrorsToFormErrors } from "../templates/dealer-template.mappers";

export default function CreateChecklistTemplatePage() {
	const navigate = useNavigate();
	const { templateId } = useParams<{ templateId: string }>();
	const isEditMode = Boolean(templateId);
	const editor = useDealerChecklistTemplateEditor(templateId);

	const goToLibrary = () => navigate(DEALER_AUDIT_ROUTES.template.list);

	if (isEditMode && templateId && editor.isReadOnlyVersion) {
		return (
			<Navigate to={DEALER_AUDIT_ROUTES.template.view(templateId)} replace />
		);
	}

	const header = (
		<PageHeader>
			<div className="flex flex-col gap-1 mb-4">
				<span className="text-eyebrow text-(--color-brand)">Dealer Audit</span>
				<h1 className="text-page-title text-(--color-text-primary)">
					{isEditMode ? "Edit checklist template" : "Create checklist template"}
				</h1>
				{editor.template ? (
					<p className="text-body-sm text-(--color-text-secondary)">
						{editor.template.name} · v{editor.template.version}
					</p>
				) : null}
			</div>
		</PageHeader>
	);

	if (editor.isLoading) {
		return (
			<PageSectionLayout className="dealer-audit-page">
				{header}
				<CardSkeleton />
			</PageSectionLayout>
		);
	}

	if (isEditMode && (editor.isError || !editor.initialValues)) {
		return (
			<PageSectionLayout className="dealer-audit-page">
				{header}
				<CardEmpty
					title="Template unavailable"
					description={
						editor.loadErrorMessage ??
						"This template could not be found or is no longer available."
					}
					Icon={FileWarning}
				/>
				<div className="mt-3 flex justify-center gap-2">
					<Button
						text="Back to library"
						variant="outline"
						onClick={goToLibrary}
					/>
					<Button
						text="Retry"
						variant="brand"
						onClick={() => void editor.refetch()}
					/>
				</div>
			</PageSectionLayout>
		);
	}

	return (
		<PageSectionLayout className="dealer-audit-page">
			{header}
			<AuditTemplateBuilder
				// Remount if the route switches between templates.
				key={templateId ?? "new"}
				// Dealer checklists are a flat list: Function → Category → Parameter.
				layout="flat"
				detailFields={DEALER_TEMPLATE_DETAIL_FIELDS}
				parameterFields={DEALER_TEMPLATE_PARAMETER_FIELDS}
				initialValues={editor.initialValues}
				namePlaceholder="e.g. Dealer Facility Audit — FY 2026-27"
				// Optional reference image per parameter.
				onUploadReferencePhoto={editor.uploadReferencePhoto}
				isSaving={editor.isSaving}
				isPublishing={editor.isPublishing}
				lastSavedLabel={editor.lastSavedLabel}
				onCancel={goToLibrary}
				onSaveDraft={editor.saveDraft}
				onPublish={async (values, applyServerErrors) => {
					const isPublished = await editor.publish(values, applyServerErrors);
					if (isPublished) goToLibrary();
				}}
				mapServerErrors={mapServerErrorsToFormErrors}
			/>
		</PageSectionLayout>
	);
}
