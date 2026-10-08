// pages/ActivityPlannerPage.tsx
// EPC detail ("view") page.
//
// Before the EPC is SUBMITTED (Final Submit in the Add-forms stepper):
//   • its creator sees the view (and can edit the saved forms) under a
//     "Not submitted yet" banner with "Continue to submit" → stepper
//   • anyone else sees a notice instead of the tabs
// After submission the view behaves as before. The create route (no id) is
// unaffected.
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "../../../../components/common/Alert";
import Loader from "../../../../components/ui/Loader";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import ActivityFormView, {
	type EventReportController,
} from "../components/activityFormView/ActivityFormView";
import EventReportUploadForm from "../forms/EventReport/eventReportUploadForm";
import { getEventReportSectionState } from "../forms/EventReport/eventReport.logic";
import {
	useEventReportFormConfigQuery,
	useEventReportQuery,
} from "../forms/EventReport/useEventReportQueries";
import { useReportGenerationWatcher } from "../forms/EventReport/useReportGenerationWatcher";
import { useActivityPlanner } from "../hooks/useActivityPlanner";
import { EPC_FORMS_WIZARD_PATH, EPC_LISTING_PATH } from "../utils/constant";
import type { EpcWizardLocationState } from "./EpcFormsWizardPage";
import { isEpcSubmitted } from "../forms/EPC/epc.utils";

type PageView = "form" | "report-builder";

const ActivityPlannerPage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [pageView, setPageView] = React.useState<PageView>("form");

	const openReportBuilder = React.useCallback(() => {
		setPageView("report-builder");
	}, []);

	const closeReportBuilder = React.useCallback(() => {
		setPageView("form");
	}, []);

	const activity = useActivityPlanner(id, {
		onOpenReportBuilder: openReportBuilder,
	});

	const {
		epcData,
		permissions,
		isLoading,
		exportState,
		handleExport,
		dismissExport,
		handleRefresh,
		handleValidateReport,
		isValidatingReport,
	} = activity;

	/* ------------------------------------------------------------------------ */
	/*                     Event report (async-generation model)                */
	/* ------------------------------------------------------------------------ */

	// Report data/config come from the report's own query hooks so they can be
	// invalidated/refetched independently of the EPC (e.g. after a
	// REPORT_STATUS notification arrives via the generation watcher).
	const { data: report, refetch: refetchReport } = useEventReportQuery(id);
	const { data: formConfig } = useEventReportFormConfigQuery(id);
	useReportGenerationWatcher(id);

	const { canProposerResubmit, canProposerRetry } = getEventReportSectionState({
		report,
		isProposer: permissions.isProposer,
		isValidator: permissions.isValidator,
		canCreateReport: permissions.canCreateReport,
	});

	// Derived from section state so the button that opens the builder and the
	// form it opens never disagree about which action is being taken.
	const reportBuilderMode: "create" | "resubmit" | "retry" = canProposerRetry
		? "retry"
		: canProposerResubmit
			? "resubmit"
			: "create";

	const handleDownloadReport = React.useCallback(() => {
		if (report?.pdfUrl) {
			window.open(report.pdfUrl, "_blank", "noopener,noreferrer");
		}
	}, [report?.pdfUrl]);

	const validateReport = React.useCallback(async () => {
		await handleValidateReport();
		await refetchReport();
	}, [handleValidateReport, refetchReport]);

	const handleReportSaved = React.useCallback(async () => {
		setPageView("form");
		await handleRefresh();
		await refetchReport();
	}, [handleRefresh, refetchReport]);

	const eventReport = React.useMemo<EventReportController>(
		() => ({
			report: report ?? null,
			isValidating: Boolean(isValidatingReport),
			onOpenReportBuilder: openReportBuilder,
			onDownload: handleDownloadReport,
			onValidateReport: validateReport,
		}),
		[
			report,
			isValidatingReport,
			openReportBuilder,
			handleDownloadReport,
			validateReport,
		],
	);

	if (isLoading) {
		return <Loader />;
	}

	const isUnsubmitted = Boolean(id && epcData && !isEpcSubmitted(epcData));

	// Not submitted and not the creator → nothing to show yet.
	if (isUnsubmitted && !permissions.isProposer) {
		return (
			<PageSectionLayout>
				<Alert
					type="banner"
					variant="info"
					title="Not submitted yet"
					description="This EPC can be viewed once its creator submits it for approval."
					primaryAction={{
						label: "Back to listing",
						onClick: () => navigate(EPC_LISTING_PATH),
					}}
				/>
			</PageSectionLayout>
		);
	}

	/** Creator, not submitted → back to the stepper (straight to Review if the EPF is saved). */
	const continueToSubmit = () => {
		if (!id) return;
		const state: EpcWizardLocationState = {
			startAt: epcData?.epf ? "review" : undefined,
		};
		navigate(EPC_FORMS_WIZARD_PATH(id, epcData?.crf ? "epf" : "crf"), {
			state,
		});
	};

	return (
		<PageSectionLayout>
			{isUnsubmitted && pageView === "form" && (
				<Alert
					type="banner"
					variant="info"
					title="Not submitted yet"
					description={
						epcData?.epf
							? "Your changes are saved, but approval hasn't started. Review the approval flow and submit when you're ready."
							: "Add the EPF in the stepper, then review and submit to start approval."
					}
					primaryAction={{
						label: epcData?.epf ? "Continue to submit" : "Continue in stepper",
						onClick: continueToSubmit,
					}}
				/>
			)}

			{exportState.status === "queued" && (
				<Alert
					type="banner"
					variant="info"
					title="Export queued"
					description={`${exportState.message} Once the export is complete, the file will be shown in Notifications and can be downloaded from there.`}
					secondaryAction={{
						label: "Dismiss",
						onClick: dismissExport,
					}}
				/>
			)}

			{exportState.status === "error" && (
				<Alert
					type="banner"
					variant="error"
					title="Export failed"
					description={exportState.message}
					primaryAction={{
						label: "Retry",
						onClick: handleExport,
					}}
					secondaryAction={{
						label: "Dismiss",
						onClick: dismissExport,
					}}
				/>
			)}

			{pageView === "report-builder" ? (
				<div className="activity-planner-report-builder">
					<EventReportUploadForm
						epcId={id!}
						formConfig={formConfig}
						existingReport={report}
						mode={reportBuilderMode}
						onBack={closeReportBuilder}
						onSuccess={handleReportSaved}
					/>
				</div>
			) : (
				<ActivityFormView activity={activity} eventReport={eventReport} />
			)}
		</PageSectionLayout>
	);
};

export default ActivityPlannerPage;
