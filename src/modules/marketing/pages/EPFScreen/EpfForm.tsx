import React from "react";
import { ArrowRight } from "lucide-react";
import EpfFormInfo from "./EpfFormInfo";
import Button from "../../../../components/common/Button";
import LineItemTable from "../../../../components/ui/LineItemTable";

import { useEpfForm } from "./useEPFForm";

export default function EpfForm() {
  const {
    values,
    handleChange,
    handleReset,
    handleSave,
    options,
    costItems,
    setCostItems,
    handleSubmit,
  } = useEpfForm();

  return (
    <React.Fragment>
      <div className=" mt-4 mx-auto p-2">
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={handleSubmit}
        >
          Submit EPF Items
        </Button>
        <h2 className="text-left text-lg font-normal flex gap-2">
          MAP <ArrowRight /> Event Proposition Form
        </h2>
        <LineItemTable
          title="Event Cost Overheads"
          items={costItems}
          onChange={setCostItems}
          particularOptions={options}
          isViewer={false}
          category="EVENT_OVERHEAD"
        />

        <EpfFormInfo
          values={values}
          handleChange={handleChange}
          handleSave={handleSave}
          handleReset={handleReset}
          userRole="ADMIN"
          isEditMode={false}
        />
      </div>
    </React.Fragment>
  );
}
