import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Pencil,
  RotateCcw,
} from "lucide-react";

import Button from "../../../../../components/common/Button";
import { getEventReportSectionState } from "./eventReport.logic";
import SectionAccordion from "../../../../../components/common/SectionAccordion";
import type { EventReportDetail } from "./eventReport.types";

type EventReportSectionProps = {
  report?: EventReportDetail | null;
  isProposer?: boolean;
  isValidator?: boolean;
  canCreateReport?: boolean;
  isValidating?: boolean;
  onOpenReportBuilder: () => void;
  onDownload: () => void;
  onValidateReport?: () => void;
};

export const EventReportSection = ({
  report,
  isProposer,
  isValidator,
  canCreateReport = false,
  isValidating = false,
  onOpenReportBuilder,
  onDownload,
  onValidateReport,
}: EventReportSectionProps) => {
  const {
    shouldShowSection,
    isGenerating,
    isSubmitted,
    isValidated,
    canProposerCreate,
    canProposerResubmit,
    canProposerRetry,
    canDownload,
    canValidatorValidate,
    title,
    description,
  } = getEventReportSectionState({
    report,
    isProposer,
    isValidator,
    canCreateReport,
  });

  if (!shouldShowSection) return null;

  return (
    <SectionAccordion title="Activity Report Section">
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all hover:border-orange-200 hover:bg-orange-50/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-700" />
              ) : (
                <FileText className="h-4 w-4 text-gray-700" />
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900">{title}</h3>
              <p className="mt-0.5 text-xs text-gray-500">{description}</p>
            </div>
          </div>

          {canProposerCreate || canProposerResubmit ? (
            <Button
              type="button"
              size="sm"
              appearance="standard"
              variant="outline"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onOpenReportBuilder();
              }}
              Icon={Pencil}
              isTooltip={
                canProposerCreate ? "Create report" : "Edit and resubmit report"
              }
              text={canProposerCreate ? "Create" : "Edit"}
            />
          ) : canProposerRetry ? (
            <Button
              type="button"
              size="sm"
              appearance="standard"
              variant="outline"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onOpenReportBuilder();
              }}
              Icon={RotateCcw}
              isTooltip="Retry report generation"
              text="Retry"
            />
          ) : canDownload ? (
            <Button
              type="button"
              size="sm"
              appearance="standard"
              variant="outline"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onDownload();
              }}
              isTooltip="Download report PDF"
              Icon={Download}
              text="Download"
            />
          ) : null}
        </div>

        {isValidator && isSubmitted && (
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Validate Report
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Review the report before validating it.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              appearance="standard"
              variant="outline"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onValidateReport?.();
              }}
              disabled={!canValidatorValidate || isValidating}
              Icon={CheckCircle2}
              text={isValidating ? "Validating..." : "Validate"}
            />
          </div>
        )}

        {canProposerResubmit && (
          <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-700" />
              <div>
                <h3 className="text-sm font-medium text-amber-900">
                  Report Requires Changes
                </h3>
                <p className="mt-0.5 text-xs text-amber-700">
                  Please update and resubmit the report.
                </p>
              </div>
            </div>
          </div>
        )}

        {isValidated && (
          <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <div>
              <h3 className="text-sm font-medium text-green-900">
                Report Validated
              </h3>
              <p className="mt-0.5 text-xs text-green-700">
                This activity report has been validated.
              </p>
            </div>
          </div>
        )}
      </div>
    </SectionAccordion>
  );
};
