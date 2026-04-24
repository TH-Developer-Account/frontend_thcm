import React from "react";
import { ArrowLeft } from "lucide-react";
import EpfFormInfo from "./EpfFormInfo";
import LineItemTable from "../../../../components/ui/LineItemTable";

import { useEpfForm } from "./useEPFForm";
import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../components/ui/PageHeader";

export default function EpfForm() {
  const {
    values,
    handleChange,
    handleReset,
    options,
    costItems,
    setCostItems,
    handleSubmit,
    eventCost,
  } = useEpfForm();

  const stored = localStorage.getItem("epcInfo");
  let epcId: string | null = null;
  if (stored) {
    const parsed = JSON.parse(stored);
    epcId = parsed.epcId || null;
  }

  return (
    <React.Fragment>
      <PageRowSectionLayout
        header_children={
          <div className="flex flex-col sm:flex-row sm:justify-between items-end sm:items-start ">
            <PageHeader
              headerText="Activity Proposition Form (APF)"
              subtitleText="Manager your Activity Proposition Form (APF) details here"
              Icon={ArrowLeft}
              badgeText="EPC Listing"
              path="/marketing/listing"
            />
            <div className="mx-2 my-4 sm:mx-4 flex flex-col gap-4 items-start overflow-y-auto">
              <p className="page-subtitle">
                <strong>EPC No: </strong>
                <span> {epcId}</span>
              </p>
              {/* <div className="w-[80%]">
								<Button
									status="brand"
									// onClick={handleSubmit("SUBMITTED")}
									text={"Save"}
									className="ml-2"
									fullWidth
								/>
							</div> */}
            </div>
          </div>
        }
      >
        <LineItemTable
          title="Event Cost Overheads"
          items={costItems}
          onChange={setCostItems}
          particularOptions={options}
          isViewer={false}
          category="EVENT_OVERHEAD"
        />
        <div className="m-2 sm:m-4">
          <EpfFormInfo
            values={values}
            handleChange={handleChange}
            handleSave={handleSubmit}
            handleReset={handleReset}
            userRole="ADMIN"
            isEditMode={false}
            eventCost={eventCost}
          />
        </div>
      </PageRowSectionLayout>
    </React.Fragment>
  );
}
