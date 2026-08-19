import React from "react";
import { useLocation } from "react-router-dom";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import Card from "../../../components/common/Card";
import { FilterTabs } from "../../../components/ui/FilterTabs";

import { useEventReportFormConfigQuery } from "../activity-planner/forms/EventReport/useEventReportQueries";
import { useMachineStudiesByEpcQuery } from "./useMachineStudyQueries";
import MachineStudyHeaderForm from "./MachineStudyHeader";
import MachineStudyCycleUpload from "./MachineStudyCycleUpload";

import type { LeadInfo } from "../leads/types/leads.types";
import { getStoredMachineStudyInfo } from "../leads/helpers/lead.storage";

type MachineVariantTab = "tata-hitachi" | "competition";

const VARIANT_TABS = [
  {
    value: "tata-hitachi",
    label: "Tata Hitachi",
    tooltipLabel: "Tata Hitachi machine",
  },
  {
    value: "competition",
    label: "Competition",
    tooltipLabel: "Competitor machine",
  },
] as const;

export default function MachineStudyEntryPage() {
  const location = useLocation();
  // Reusing the same LeadInfo shape/storage pattern as LeadCreatePage —
  // both pages are reached from the same EPC-listing "create" action, so
  // the epcId/eventName context is carried the same way for consistency.
  const routeLeadInfo = location.state?.leadInfo as LeadInfo | undefined;
  const [leadInfo] = React.useState<LeadInfo | null>(
    () => routeLeadInfo || getStoredMachineStudyInfo(),
  );
  const epcId = leadInfo?.epcId;

  const [activeTab, setActiveTab] =
    React.useState<MachineVariantTab>("tata-hitachi");

  const { data: formConfig, isLoading: isFormConfigLoading } =
    useEventReportFormConfigQuery(epcId);
  const {
    data: studies = [],
    isLoading: isStudiesLoading,
    refetch: refetchStudies,
  } = useMachineStudiesByEpcQuery(epcId);

  const tataHitachiStudy = studies.find((s) => !s.isCompetitorMachine);
  const competitionStudy = studies.find((s) => s.isCompetitorMachine);

  if (!epcId) {
    return (
      <PageSectionLayout>
        <PageHeader
          headerText="Data Form Entry"
          navigation={{
            variant: "breadcrumbs",
            ariaLabel: "Data Form Entry",
            breadcrumbs: [
              { label: "Home Screen", href: "/" },
              {
                label: "EPC Listing",
                href: "/marketing/activity-planner/listing",
              },
              { label: "Data Form" },
            ],
            separator: "›",
          }}
        />
        <Card className="p-5 text-sm text-center text-red-600">
          EPC reference missing. Please go back to EPC listing and try again.
        </Card>
      </PageSectionLayout>
    );
  }

  if (!isFormConfigLoading && formConfig?.sourceType !== "DATA_FORM") {
    return (
      <PageSectionLayout>
        <PageHeader
          headerText="Data Form Entry"
          navigation={{
            variant: "breadcrumbs",
            ariaLabel: "Data Form Entry",
            breadcrumbs: [
              { label: "Home Screen", href: "/" },
              {
                label: "EPC Listing",
                href: "/marketing/activity-planner/listing",
              },
              { label: "Data Form" },
            ],
            separator: "›",
          }}
        />
        <Card className="p-5 text-sm text-center text-muted">
          The Data Form doesn't apply to this event type.
        </Card>
      </PageSectionLayout>
    );
  }

  const isBenchmarking = formConfig?.dualVariant ?? false;

  const renderSingleMachine = () => (
    <div className="flex flex-col gap-4">
      <MachineStudyHeaderForm
        epcId={epcId}
        isCompetitorMachine={false}
        existingStudy={tataHitachiStudy}
        onSaved={refetchStudies}
      />
      <MachineStudyCycleUpload
        studyId={tataHitachiStudy?.id}
        existingCycleCount={tataHitachiStudy?._count?.cycles ?? 0}
      />
    </div>
  );

  const renderBenchmarking = () => (
    <div className="flex flex-col gap-4">
      <FilterTabs
        id="machine-study-variant-tabs"
        ariaLabel="Machine variant"
        items={VARIANT_TABS}
        value={activeTab}
        onChange={(value) => setActiveTab(value as MachineVariantTab)}
      />

      {activeTab === "tata-hitachi" ? (
        <div className="flex flex-col gap-4">
          <MachineStudyHeaderForm
            epcId={epcId}
            isCompetitorMachine={false}
            existingStudy={tataHitachiStudy}
            onSaved={refetchStudies}
          />
          <MachineStudyCycleUpload
            studyId={tataHitachiStudy?.id}
            existingCycleCount={tataHitachiStudy?._count?.cycles ?? 0}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <MachineStudyHeaderForm
            epcId={epcId}
            isCompetitorMachine={true}
            existingStudy={competitionStudy}
            onSaved={refetchStudies}
          />
          <MachineStudyCycleUpload
            studyId={competitionStudy?.id}
            existingCycleCount={competitionStudy?._count?.cycles ?? 0}
          />
        </div>
      )}
    </div>
  );

  return (
    <PageSectionLayout>
      <PageHeader
        headerText="Data Form Entry"
        navigation={{
          variant: "breadcrumbs",
          ariaLabel: "Data Form Entry",
          breadcrumbs: [
            { label: "Home Screen", href: "/" },
            {
              label: "EPC Listing",
              href: "/marketing/activity-planner/listing",
            },
            { label: "Data Form" },
          ],
          separator: "›",
        }}
      />

      <Card className="leads-content-box" title={leadInfo?.eventName}>
        {isFormConfigLoading || isStudiesLoading ? (
          <div className="p-5 text-sm text-gray-500">Loading...</div>
        ) : isBenchmarking ? (
          renderBenchmarking()
        ) : (
          renderSingleMachine()
        )}
      </Card>
    </PageSectionLayout>
  );
}
