import { CircleX, LoaderIcon } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { Badge } from "../../../components/common/Badge";
import Card from "../../../components/common/Card";
import { CardEmpty } from "../../../components/ui/CardSkeleton";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useToast } from "../../../context/Auth/AuthContext";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import VendorCreationFormOne, {
	type VendorCreationFormOneSubmission,
} from "../../vendorOnboarding/forms/VendorCreationFormOne";
import VendorCreationFormTwo from "../../vendorOnboarding/forms/VendorCreationFormTwo";
import { useGuestVendorOnboardingForm } from "./useGuestVendorOnboardingForm";

type GuestVendorOnboardingFormPageProps = {
	mode?: "view" | "edit";
};

const GuestVendorOnboardingFormPage = ({
	mode = "view",
}: GuestVendorOnboardingFormPageProps) => {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const { id = "" } = useParams<{ id: string }>();

	const form = useGuestVendorOnboardingForm(id);

	const handleBack = () => {
		navigate(`/guest/vendor-onboarding/${id}`);
	};

	const handleSubmit = async (submission: VendorCreationFormOneSubmission) => {
		const result = await form.handleSubmit(submission);
		if (!result) return;

		showToast({
			type: "success",
			title: "Vendor form submitted",
			description:
				result.message || "Your vendor information has been updated.",
		});

		// Guests return to the listing to continue tracking progress.
		navigate("/guest/vendor-onboarding", { replace: true });
	};

	const navigation = {
		variant: "breadcrumbs" as const,
		ariaLabel: "Vendor Onboarding Details",
		breadcrumbs: [
			{
				label: "Vendor Onboarding",
				href: "/guest/vendor-onboarding",
			},
			{
				label: mode === "edit" ? "Edit Vendor Details" : "Vendor Details",
			},
		],
		separator: "›",
	};

	if (form.isLoading) {
		return (
			<PageSectionLayout>
				<PageHeader
					headerText="Vendor Onboarding Details"
					navigation={navigation}
				/>

				<CardEmpty
					title="Loading vendor onboarding details..."
					Icon={LoaderIcon}
				/>
			</PageSectionLayout>
		);
	}

	if (form.isError) {
		return (
			<PageSectionLayout>
				<PageHeader
					headerText="Vendor Onboarding Details"
					navigation={navigation}
				/>

				<CardEmpty
					title="Unable to load vendor onboarding details."
					Icon={CircleX}
				/>
			</PageSectionLayout>
		);
	}

	/*
	 * Prevent manually entering /edit when the backend status does not
	 * allow guest changes.
	 */
	if (mode === "edit" && !form.canEdit) {
		return <Navigate to={`/guest/vendor-onboarding/${id}`} replace />;
	}

	return (
		<PageSectionLayout>
			<PageHeader
				headerText={
					mode === "edit"
						? "Edit Vendor Onboarding Form"
						: "Vendor Onboarding Details"
				}
				navigation={navigation}
			/>

			<Card
				title={
					form.referenceNumber
						? `Vendor Form — ${form.referenceNumber}`
						: "Vendor Form"
				}
				actions={form.status ? <Badge status={form.status} /> : null}
			>
				<VendorCreationFormOne
					mode={mode}
					canEdit={mode === "edit" && form.canEdit}
					values={form.formOneValues}
					errors={form.formOneErrors}
					initialDocuments={form.documents}
					requireDocuments={false}
					requireDpdpConsent={false}
					loading={form.isSubmitting}
					actionText="Submit"
					onChange={form.handleFormOneChange}
					onSubmit={handleSubmit}
					onBack={handleBack}
				/>
			</Card>

			{mode === "view" && (
				<Card
					title="THCM Vendor Master Details"
					className="vendor-onboarding-view-section"
				>
					<VendorCreationFormTwo
						mode="view"
						canEdit={false}
						canEditVendorCode={false}
						values={form.formTwoValues}
					/>
				</Card>
			)}
		</PageSectionLayout>
	);
};

export default GuestVendorOnboardingFormPage;
