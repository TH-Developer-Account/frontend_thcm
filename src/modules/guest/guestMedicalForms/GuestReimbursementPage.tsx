import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "../../../components/common/Badge";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import ReimbursementClaimForm from "../../medicalReimbursment/components/ReimbursementClaimForm";
import { ClaimActionsCard } from "../../medicalReimbursment/components/ClaimActions";
import ClaimEligibilityLedger from "../../medicalReimbursment/components/ClaimEligibilityLedger";
import ClaimEmployeeCard from "../../medicalReimbursment/components/ClaimEmployeeCard";
import ClaimFormAlerts from "../../medicalReimbursment/components/ClaimFormAlerts";
import ClaimHeadsCard from "../../medicalReimbursment/components/ClaimHeadsCard";

import { useGuestMedicalClaimView } from "./useGuestMedicalClaimView";
import { MEDICLAIM_BACKEND } from "../../medicalReimbursment/utils/mediclaimBackend.config";

const GuestReimbursementPage = () => {
	const navigate = useNavigate();
	const { claimId: routeClaimId = "" } = useParams<{ claimId?: string }>();
	const claimId = routeClaimId === "create" ? "" : routeClaimId;

	const guestClaim = useGuestMedicalClaimView(claimId);
	const { isCreateMode } = guestClaim;

	const goToListing = () => navigate("/guest/medi-claim/listing");

	const breadcrumbs = (
		<PageHeader
			headerText={
				isCreateMode
					? "New Medical Reimbursement Claim"
					: "Medical Reimbursement Form"
			}
			navigation={{
				variant: "breadcrumbs",
				ariaLabel: "Medical reimbursement form",
				breadcrumbs: [
					{
						label: "Medical Reimbursement Forms",
						href: "/guest/medi-claim/listing",
					},
					{
						label: isCreateMode ? "Create Claim" : "Medical Reimbursement Form",
					},
				],
				separator: "›",
			}}
		/>
	);

	if (guestClaim.isLoading) {
		return (
			<PageSectionLayout>
				<Card padding="spacious">
					<p role="status">Loading medical reimbursement claim…</p>
				</Card>
			</PageSectionLayout>
		);
	}

	if (guestClaim.isError || (!isCreateMode && !guestClaim.detail)) {
		return (
			<PageSectionLayout>
				{breadcrumbs}
				<Card padding="spacious">
					<div className="flex flex-col items-start gap-3">
						<p className="text-sm text-rejected" role="alert">
							{guestClaim.errorMessage}
						</p>
						<Button
							type="button"
							text="Retry"
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={() => void guestClaim.refetch()}
						/>
					</div>
				</Card>
			</PageSectionLayout>
		);
	}

	if (isCreateMode && !guestClaim.canCreate) {
		return (
			<PageSectionLayout>
				{breadcrumbs}
				<Card padding="spacious">
					<p className="text-sm text-iron" role="status">
						{MEDICLAIM_BACKEND.guestCreateClaim
							? "Your first medical claim is started by HR — you'll receive an email with a link to the claim form. After that you can raise new claims from here."
							: "New medical claims are started by HR — you'll receive an email with a link to the claim form. Please contact HR to raise a new claim."}
					</p>
				</Card>
			</PageSectionLayout>
		);
	}

	const status = guestClaim.detail?.status;

	// GUEST VIEW layout: same single column as the public page, inside the
	// guest portal shell. No tabs, no side column, no audit / comments /
	// workflow. The approver's remarks are shown read-only in the bills table.
	return (
		<PageSectionLayout>
			{breadcrumbs}

			<ReimbursementClaimForm
				referenceNumber={guestClaim.referenceNumber}
				mode={guestClaim.canEdit ? "edit" : "view"}
				canEdit={guestClaim.canEdit}
				actorRole="creator"
				isClaimant
				canApprove={false}
				canClarify={false}
				canReviewLineItems={false}
				hideReviewColumns={guestClaim.permissions.hideReviewColumns}
				gradeOptions={guestClaim.gradeOptions}
				onSubmit={guestClaim.canEdit ? guestClaim.submitClaim : undefined}
				submitSuccessMessage={
					isCreateMode
						? "Your new claim has been submitted for approval."
						: "Your claim has been resubmitted for approval."
				}
				initialValues={guestClaim.initialValues}
				initialLineItems={guestClaim.initialLineItems}
				statusLabel={status}
				correctionReason={guestClaim.correctionReason}
				actionText={isCreateMode ? "Submit Claim" : "Resubmit Claim"}
				// Over-limit claims can be submitted after a confirmation; HR
				// decides the approved amount.
				enforceEligibilityLimit={false}
				onBack={goToListing}
			>
				<div className="mx-auto flex w-full max-w-8xl flex-col gap-4">
					{guestClaim.referenceNumber ? (
						<div className="flex items-center gap-3 px-1">
							<Button
								type="button"
								Icon={ArrowLeft}
								size="sm"
								appearance="icon"
								variant="outline"
								onClick={goToListing}
							/>
							<h2 className="text-lg font-semibold text-iron-dark">
								{guestClaim.referenceNumber}
							</h2>
							{status ? <Badge status={status} /> : null}
						</div>
					) : null}

					<ClaimFormAlerts statusBanner={guestClaim.statusBanner ?? null} />

					<div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start">
						<form
							className="flex min-w-0 flex-1 flex-col gap-4"
							noValidate
							onSubmit={(event) => event.preventDefault()}
						>
							<ClaimEmployeeCard />
							<ClaimHeadsCard actionsVariant="none" />
						</form>

						{/* Ledger rail: eligibility and the actions stay in view. */}
						<aside
							aria-label="Eligibility and actions"
							className="flex w-full shrink-0 flex-col gap-3 lg:sticky lg:top-4 lg:w-80 xl:w-[340px]"
						>
							<ClaimEligibilityLedger />
							<ClaimActionsCard />
						</aside>
					</div>
				</div>
			</ReimbursementClaimForm>
		</PageSectionLayout>
	);
};

export default GuestReimbursementPage;
