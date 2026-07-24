import { useState } from "react";
import { ArrowLeft, Pencil, FileDown } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../services/ServerAxios";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useAuth } from "../../../context/Auth/useAuth";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import VendorCreationSummaryForm from "../forms/VendorCreationSummaryForm";
import { useVendorCreationForm } from "../hooks/useVendorCreationForm";
import type { VendorViewerRole } from "../types/vendorOnboarding.types";
import VendorCommentSection from "./VendorCommentSection";

type VendorOnboardingFormViewProps = {
  viewerRole?: VendorViewerRole;
};

type VendorOnboardingReadOnlyViewProps = {
  viewerRole: VendorViewerRole;
  onboardingId: string;
};

const VendorOnboardingReadOnlyView = ({
  viewerRole,
  onboardingId,
}: VendorOnboardingReadOnlyViewProps) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isDownloading, setIsDownloading] = useState(false);

  const {
    formOneValues,
    formTwoValues,
    formOneDocuments,
    isLoading,
    isError,
    canApprove,
    canClarify,
    canEditMainForm,
    canAcceptAndClose,
    handleApprove,
    handleClarify,
    handleAcceptAndClose,
    workflowStages,
    workflowLoading,
    user,
    canEditVendorCode,
    canSaveVendorCode,
    vendorCodeLoading,
    referenceNumber,
    handleSaveVendorCode,
    handleFormTwoChange,
  } = useVendorCreationForm({
    role: viewerRole,
    vendorRequestId: onboardingId,
    isPublicForm: false,
  });

  const handleBackToListing = () => {
    navigate("/vendor/onboarding/listing?tab=onboarding");
  };

  const handleEdit = () => {
    navigate(`/vendor/onboarding/${onboardingId}`);
  };

  async function downloadVendorOnboardingExport(
    onboardingId: string,
    referenceNumber: string,
  ): Promise<void> {
    const response = await ServerAxios.get(
      `/vendor-onboarding/export/${onboardingId}`,
      { responseType: "blob" },
    );

    const blobUrl = window.URL.createObjectURL(response.data as Blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `vendor-onboarding-${referenceNumber}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  }

  const handleExport = async () => {
    setIsDownloading(true);
    try {
      await downloadVendorOnboardingExport(
        onboardingId,
        referenceNumber as string,
      );
    } catch (error) {
      showToast({
        type: "error",
        title: "Request failed",
        description: "Failed to download the Excel",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const pageNavigation = {
    variant: "breadcrumbs" as const,
    ariaLabel: "Vendor Onboarding Details",
    breadcrumbs: [
      {
        label: "Home Screen",
        href: "/",
      },
      {
        label: "Vendors Listing",
        href: "/vendor/onboarding/listing?tab=onboarding",
      },
      {
        label: "Vendor Onboarding Details",
      },
    ],
    separator: "›",
  };

  if (isLoading) {
    return (
      <PageSectionLayout>
        <PageHeader
          headerText="Vendor Onboarding Details"
          navigation={pageNavigation}
        />

        <Card>
          <div
            className="vendor-onboarding-view-state"
            role="status"
            aria-live="polite"
          >
            Loading vendor onboarding details...
          </div>
        </Card>
      </PageSectionLayout>
    );
  }

  if (isError) {
    return (
      <PageSectionLayout>
        <PageHeader
          headerText="Vendor Onboarding Details"
          navigation={pageNavigation}
        />

        <Card>
          <div className="vendor-onboarding-view-state" role="alert">
            <p>Unable to load the vendor onboarding details.</p>

            <Button
              type="button"
              text="Back to Listing"
              Icon={ArrowLeft}
              iconPosition="left"
              size="sm"
              appearance="standard"
              variant="outline"
              onClick={handleBackToListing}
            />
          </div>
        </Card>
      </PageSectionLayout>
    );
  }

  return (
    <PageSectionLayout>
      <PageHeader
        headerText="Vendor Onboarding Details"
        navigation={pageNavigation}
      />

      <Card
        className="vendor-onboarding-view-section"
        title="Vendor Form View"
        actions={
          <>
            <Button
              type="button"
              text={isDownloading ? "Exporting…" : "Export"}
              Icon={FileDown}
              iconPosition="left"
              iconSize={16}
              appearance="cta"
              variant="brand"
              size="sm"
              onClick={handleExport}
              disabled={isDownloading}
            />
            {canEditMainForm ? (
              <div className="vendor-onboarding-view-actions">
                <Button
                  type="button"
                  text="Edit"
                  size="sm"
                  Icon={Pencil}
                  appearance="standard"
                  variant="brand"
                  onClick={handleEdit}
                />
              </div>
            ) : undefined}
          </>
        }
      >
        <VendorCreationSummaryForm
          mode="view"
          formOneValues={formOneValues}
          formTwoValues={formTwoValues}
          formOneDocuments={formOneDocuments}
          canEditVendorCode={canEditVendorCode}
          canSaveVendorCode={canSaveVendorCode}
          vendorCodeLoading={vendorCodeLoading}
          onSaveVendorCode={handleSaveVendorCode}
          onBack={handleBackToListing}
          onApprove={handleApprove}
          onClarify={handleClarify}
          onAcceptAndClose={handleAcceptAndClose}
          canSubmit={false}
          canApprove={canApprove}
          canClarify={canClarify}
          canAcceptAndClose={canAcceptAndClose}
          workflowStages={workflowStages}
          workflowLoading={workflowLoading}
          onFormTwoChange={handleFormTwoChange}
          commentsSection={
            <VendorCommentSection
              onboardingId={onboardingId}
              workflow={workflowStages}
              creator={user}
            />
          }
        />
      </Card>
    </PageSectionLayout>
  );
};

const getVendorViewerRole = (
  userRole: string | undefined,
): VendorViewerRole => {
  switch (userRole) {
    case "THCM_APPROVER":
      return "THCM_APPROVER";

    case "EXTERNAL_APPROVER":
      return "EXTERNAL_APPROVER";

    case "EXTERNAL_VENDOR":
      return "EXTERNAL_VENDOR";

    case "THCM_EMPLOYEE":
    default:
      return "THCM_EMPLOYEE";
  }
};

const VendorOnboardingFormView = ({
  viewerRole,
}: VendorOnboardingFormViewProps) => {
  const { user } = useAuth();

  const { onboardingId } = useParams<{
    onboardingId?: string;
  }>();

  const resolvedViewerRole = viewerRole ?? getVendorViewerRole(user?.role);

  if (!onboardingId) {
    return (
      <PageSectionLayout>
        <PageHeader headerText="Vendor Onboarding Details" />

        <Card>
          <div className="vendor-onboarding-view-state" role="alert">
            Vendor onboarding request ID was not found.
          </div>
        </Card>
      </PageSectionLayout>
    );
  }

  return (
    <VendorOnboardingReadOnlyView
      viewerRole={resolvedViewerRole}
      onboardingId={onboardingId}
    />
  );
};

export default VendorOnboardingFormView;
