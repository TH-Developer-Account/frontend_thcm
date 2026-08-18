import * as React from "react";

import PublicPagesLayout from "../../layout/PublicPagesLayout";
import ReimbursementClaimForm from "./ReimbursementClaimForm";
import type {
	ReimbursementClaimFormValues,
	ReimbursementClaimSubmission,
} from "./reimbursementClaim.types";

interface ReimbursementClaimPublicPageProps {
	initialValues?: Partial<ReimbursementClaimFormValues>;
	submitClaim?: (
		submission: ReimbursementClaimSubmission,
	) => void | Promise<void>;
	saveDraft?: (
		submission: ReimbursementClaimSubmission,
	) => void | Promise<void>;
}

const ReimbursementClaimPublicPage = ({
	initialValues,
	submitClaim,
	saveDraft,
}: ReimbursementClaimPublicPageProps) => {
	const [submittedMessage, setSubmittedMessage] = React.useState("");

	const handleSubmit = async (
		submission: ReimbursementClaimSubmission,
	): Promise<void> => {
		if (submitClaim) {
			await submitClaim(submission);
			setSubmittedMessage(
				"Claim submitted successfully. Tata Hitachi will review the information provided.",
			);
			return;
		}

		setSubmittedMessage(
			"Form validation passed. Connect the reimbursement API when it is available to submit this claim.",
		);
	};

	return (
		<PublicPagesLayout>
			<ReimbursementClaimForm
				initialValues={initialValues}
				submittedMessage={submittedMessage}
				actionText={submitClaim ? "Submit Claim" : "Validate Form"}
				onSubmit={handleSubmit}
				onSaveDraft={saveDraft}
			/>
		</PublicPagesLayout>
	);
};

export default ReimbursementClaimPublicPage;
