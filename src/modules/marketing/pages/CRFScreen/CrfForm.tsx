import React, { useState } from "react";
import LineItemTable from "../../../../components/ui/LineItemTable";
import type { CostItem, CrfProps } from "../../types";

const particularOptions = [
  { label: "Snacks / Beverage", value: "snacks" },
  { label: "Miscellaneous Expenses", value: "misc" },
];

export function CrfProps({ items, onChange, isViewer }: CrfProps) {
  return (
    <React.Fragment>
      <LineItemTable
        title="Printed Materials"
        items={items}
        onChange={onChange}
        particularOptions={particularOptions}
        isViewer={isViewer}
      />
      <LineItemTable
        title="Souveniers"
        items={items}
        onChange={onChange}
        particularOptions={particularOptions}
        isViewer={isViewer}
      />
      <LineItemTable
        title="Artworks"
        items={items}
        onChange={onChange}
        particularOptions={particularOptions}
        isViewer={isViewer}
      />
    </React.Fragment>
  );
}

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */

export default function CrfForm() {
  const [costItems, setCostItems] = useState<CostItem[]>([]);

  return (
    <>
      <CrfProps items={costItems} onChange={setCostItems} isViewer={false} />
    </>
  );
}
