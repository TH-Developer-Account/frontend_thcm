// modules/audit/dealer-audit/pages/CreateChecklistTemplatePage.tsx
import { useNavigate, useParams } from "react-router-dom";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import ChecklistTemplateBuilder from "../../shared/templates/AuditTemplateBuilder";
import { useDealerChecklistTemplateEditor } from "../hooks/useDealerChecklistTemplateEditor"; // wraps GET/POST/PATCH
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";

const FACILITY_TYPE_OPTIONS = [
	{ value: "HEAD_OFFICE", label: "Head Office" },
	{ value: "BRANCH_OFFICE", label: "Branch Office" },
];

export default function CreateChecklistTemplatePage() {
	const navigate = useNavigate();
	const { templateId } = useParams<{ templateId: string }>();
	const { initialDetails, initialSections, isSaving, saveDraft, publish } =
		useDealerChecklistTemplateEditor(templateId);

	return (
		<PageSectionLayout className="dealer-audit-page">
			<ChecklistTemplateBuilder
				auditModule="DEALER_AUDIT"
				facilityTypeOptions={FACILITY_TYPE_OPTIONS}
				initialDetails={initialDetails}
				initialSections={initialSections}
				isSaving={isSaving}
				onSaveDraft={(details, sections) =>
					saveDraft(details, sections).then(() =>
						navigate(DEALER_AUDIT_ROUTES.template.list),
					)
				}
				onPublish={(details, sections) =>
					publish(details, sections).then(() =>
						navigate(DEALER_AUDIT_ROUTES.template.list),
					)
				}
			/>
		</PageSectionLayout>
	);
}
