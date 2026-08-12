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
import { getErrorMessage } from "../../vendorOnboarding/helpers/vendor.onboarding.helper";

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
		navigate(`/guest/medical-claim/form/create/${id}`);
	};

	const handleSubmit = async (submission: VendorCreationFormOneSubmission) => {
		try {
			const result = await form.submitFormOne(submission);

			showToast({
				type: "success",
				title: "Vendor form submitted",
				description:
					result.message || "Your vendor information has been updated.",
			});

			navigate(`/guest/medical-claim/form/create/${id}`, {
				replace: true,
			});
		} catch (error) {
			showToast({
				type: "error",
				title: "Submission failed",
				description: getErrorMessage(
					error,
					"Unable to submit your vendor form.",
				),
			});
		}
	};

	const navigation = {
		variant: "breadcrumbs" as const,
		ariaLabel: "Vendor Onboarding Details",
		breadcrumbs: [
			{
				label: "Vendor Onboarding",
				href: "/guest/medical-claim/form/create",
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
		return <Navigate to={`/guest/medical-claim/form/create/${id}`} replace />;
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
