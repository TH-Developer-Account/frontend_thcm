// EventReportSection.tsx
import { FileText } from "lucide-react";

import Button from "../../../../../components/common/Button";
import Section from "../Section";

type EventReportSectionProps = {
  epcID?: string | null;
  report?: string | null;
  onOpenReportBuilder: () => void;
};

export const EventReportSection = ({
  report,
  onOpenReportBuilder,
}: EventReportSectionProps) => {
  const isReportCreated = Boolean(report);

  return (
    <Section title="Activity Report Section">
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Create Report */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all hover:border-orange-200 hover:bg-orange-50/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
              <FileText className="h-4 w-4 text-gray-700" />
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {isReportCreated ? "Continue Report" : "Create Report"}
              </h3>
            </div>
          </div>

          <Button size="sm" status="outline" onClick={onOpenReportBuilder}>
            Open
          </Button>
        </div>
      </div>
    </Section>
  );
};
