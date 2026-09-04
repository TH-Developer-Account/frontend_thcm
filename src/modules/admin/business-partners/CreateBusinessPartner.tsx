import { useParams } from "react-router-dom";

import { Alert } from "../../../components/common/Alert";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import BPCreateForm from "./components/BPCreateForm";
import { useBusinessPartnerForm } from "./hooks/useBusinessPartnerForm";
import { DEFAULT_BUSINESS_PARTNER_PERMISSIONS } from "./utils/bp.types";

const CreateBusinessPartner = () => {
	const { businessPartnerId } = useParams<{
		businessPartnerId?: string;
	}>();

	const {
		form,
		isEditMode,
		isLoading,
		isError,
		isSaving,
		// isFormValid,
		canSubmit,
		error,
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
						{
							label: "Business Partners",
							href: "/business-partners",
						},
						{
							label: isEditMode ? "Update" : "Create",
						},
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
				onChange={handleChange}
				onSubmit={handleSubmit}
				onCancel={handleCancel}
				// contactForm={<BPContactForm controller={contactController} />}
				// addressForm={
				// 	businessPartnerId ? (
				// 		<BPAddress businessPartnerId={businessPartnerId} />
				// 	) : undefined
				// }
				// branchesForm={
				// 	businessPartnerId ? (
				// 		<BPBranches businessPartnerId={businessPartnerId} />
				// 	) : undefined
				// }
				// peopleForm={
				// 	businessPartnerId ? (
				// 		<BPPeople businessPartnerId={businessPartnerId} />
				// 	) : undefined
				// }
			/>
		</PageSectionLayout>
	);
};

export default CreateBusinessPartner;
