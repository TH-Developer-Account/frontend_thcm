import { useParams } from "react-router-dom";

import { Alert } from "../../../components/common/Alert";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import BPCreateForm from "./components/BPCreateForm";
import { useBusinessPartnerForm } from "./hooks/useBusinessPartnerForm";
import { DEFAULT_BUSINESS_PARTNER_PERMISSIONS } from "./utils/bp.types";

const CreateBusinessPartner = () => {
	// Route param is `:id` — see AdminRoutes. Read it under that name.
	const { id: businessPartnerId } = useParams<{ id?: string }>();

	const {
		form,
		isEditMode,
		isLoading,
		isError,
		isSaving,
		canSubmit,
		error,
		availableTabs,
		handleChange,
		handleSubmit,
		handleCancel,
	} = useBusinessPartnerForm({
		businessPartnerId,
		permissions: DEFAULT_BUSINESS_PARTNER_PERMISSIONS,
	});

	if (isLoading) {
		return (
			<PageSectionLayout>
				<p>Loading business partner...</p>
			</PageSectionLayout>
		);
	}

	if (isError) {
		return (
			<PageSectionLayout>
				<Alert variant="error" title="Unable to load the business partner." />
			</PageSectionLayout>
		);
	}

	return (
		<PageSectionLayout>
			<PageHeader
				headerText={
					isEditMode ? "Update Business Partner" : "Create Business Partner"
				}
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Business partner form",
					breadcrumbs: [
						{ label: "Business Partners", href: "/business-partners" },
						{ label: isEditMode ? "Update" : "Create" },
					],
					separator: "›",
				}}
			/>

			<BPCreateForm
				form={form}
				isEditMode={isEditMode}
				isSaving={isSaving}
				canSubmit={canSubmit}
				error={error}
				availableTabs={availableTabs}
				onChange={handleChange}
				onSubmit={handleSubmit}
				onCancel={handleCancel}
			/>
		</PageSectionLayout>
	);
};

export default CreateBusinessPartner;
