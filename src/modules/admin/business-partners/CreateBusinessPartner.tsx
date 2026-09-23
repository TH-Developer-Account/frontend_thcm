import { Eye } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import { businessPartnerContent } from "../../../content/businessPartner.content";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import BPContactCard from "./components/BPContactCard";
import BPGeneralInfoCard from "./components/BPGeneralInfoCard";
import BPLockedSectionCard from "./components/BPLockedSectionCard";
import { businessPartnerPaths } from "./hooks/useBusinessPartnerForm";
import {
	useBusinessPartner,
	useBusinessPartnerView,
} from "./hooks/useBusinessPartnerQueries";
import { DEFAULT_BUSINESS_PARTNER_PERMISSIONS } from "./utils/bp.types";
import BPAddressCard from "./components/BPAddressCard";

const copy = businessPartnerContent;
const permissions = DEFAULT_BUSINESS_PARTNER_PERMISSIONS;

/**
 * /admin/business-partners/create       -> create mode (card 1 only is active)
 * /admin/business-partners/:id/edit     -> update mode (all cards active)
 *
 * Each card owns its own form, validation, Save/Cancel and API call. After
 * card 1 creates the BP, the page replaces the URL with the edit route so
 * Contact and Address unlock for the new id (same flow as Create User).
 */
const CreateBusinessPartner = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	// Route param is `:id` — see AdminRoutes.
	const { id } = useParams<{ id?: string }>();
	const businessPartnerId = id?.trim() ?? "";
	const isEditMode = Boolean(businessPartnerId);

	const parentIdFromQuery = isEditMode
		? ""
		: (searchParams.get("parentId")?.trim() ?? "");

	const viewQuery = useBusinessPartnerView(
		isEditMode ? businessPartnerId : undefined,
	);
	const parentQuery = useBusinessPartner(parentIdFromQuery || undefined);

	if (isEditMode && viewQuery.isLoading) {
		return (
			<PageSectionLayout>
				<p role="status">{copy.page.loading}</p>
			</PageSectionLayout>
		);
	}

	if (isEditMode && (viewQuery.isError || !viewQuery.data)) {
		return (
			<PageSectionLayout>
				<Alert variant="error" title={copy.page.loadError} />
			</PageSectionLayout>
		);
	}

	const view = viewQuery.data ?? null;
	const partner = view?.partner ?? null;

	const breadcrumbs = partner
		? [
				{ label: copy.page.breadcrumbList, href: businessPartnerPaths.list() },
				{ label: partner.bpName, href: businessPartnerPaths.view(partner.id) },
				{ label: copy.page.breadcrumbUpdate },
			]
		: [
				{ label: copy.page.breadcrumbList, href: businessPartnerPaths.list() },
				{ label: copy.page.breadcrumbCreate },
			];

	return (
		<PageSectionLayout>
			<PageHeader
				headerText={partner ? copy.page.updateTitle : copy.page.createTitle}
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: copy.page.breadcrumbAriaLabel,
					breadcrumbs,
					separator: "›",
				}}
			/>

			<div className="bp-create-page-sections">
				<BPGeneralInfoCard
					// Remount when moving from create -> edit (or between BPs) so
					// RHF picks up fresh default values.
					key={partner?.id ?? "create"}
					partner={partner}
					parentIdFromQuery={parentIdFromQuery}
					parentPartner={parentQuery.data ?? null}
					canSubmit={
						partner
							? permissions.general.canUpdateGeneral
							: permissions.canCreateBusinessPartner
					}
				/>

				{view && partner ? (
					<>
						<BPContactCard
							key={`contact-${partner.id}`}
							businessPartnerId={partner.id}
							contacts={view.contacts}
							permissions={permissions.people}
						/>

						<BPAddressCard
							key={`address-${partner.id}`}
							businessPartnerId={partner.id}
							addresses={view.addresses}
							permissions={permissions.address}
						/>

						<div className="bp-master-form-actions">
							<Button
								type="button"
								text={copy.page.viewPartner}
								Icon={Eye}
								iconPosition="left"
								variant="outline"
								onClick={() => navigate(businessPartnerPaths.view(partner.id))}
							/>
						</div>
					</>
				) : (
					<>
						<BPLockedSectionCard
							title={copy.contact.title}
							description={copy.contact.locked}
						/>
						<BPLockedSectionCard
							title={copy.address.title}
							description={copy.address.locked}
						/>
					</>
				)}
			</div>
		</PageSectionLayout>
	);
};

export default CreateBusinessPartner;
