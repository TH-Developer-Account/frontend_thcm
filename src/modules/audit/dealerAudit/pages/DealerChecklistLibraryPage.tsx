// modules/audit/dealer-audit/pages/DealerChecklistLibraryPage.tsx
import { useNavigate } from "react-router-dom";
import ChecklistLibrary from "../../shared/checklist/ChecklistLibrary";
// import { useDealerChecklistTemplates } from "../hooks/useDealerChecklistTemplates"; // wraps the real query
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";

export default function DealerChecklistLibraryPage() {
	const navigate = useNavigate();
	// const { templates, isLoading, error } = useDealerChecklistTemplates();

	return (
		<ChecklistLibrary
			eyebrow="Dealer Audit"
			title="Checklist library"
			subtitle="Build, review and reuse inspection standards across dealer locations."
			templates={[]}
			isLoading={false}
			error={""}
			onCreateTemplate={() => navigate(DEALER_AUDIT_ROUTES.template.create)}
			onOpenTemplate={(id) => navigate(DEALER_AUDIT_ROUTES.template.edit(id))}
			onEditTemplate={(id) => navigate(DEALER_AUDIT_ROUTES.template.edit(id))}
		/>
	);
}
