import React from "react";

import {
  FIELD_LABELS,
  FIELD_TEMPLATE_META,
  orderFields,
  REQUIRED_FIELDS,
} from "../helpers/lead.fieldConfig";
import type { LeadFormFieldKey } from "../types/leads.types";

type LeadExcelPreviewProps = {
  fields: LeadFormFieldKey[];
};

export function LeadExcelPreview({ fields }: LeadExcelPreviewProps) {
  const orderedFields = React.useMemo(() => orderFields(fields), [fields]);

  const columns = React.useMemo(
    () =>
      orderedFields.map((field) => ({
        field,
        label: FIELD_LABELS[field],
        required: REQUIRED_FIELDS.includes(field),
      })),
    [orderedFields],
  );

  const exampleRowValues = React.useMemo(
    () => orderedFields.map((field) => FIELD_TEMPLATE_META[field].example),
    [orderedFields],
  );

  const [activeCol, setActiveCol] = React.useState(0);
  const [charIdx, setCharIdx] = React.useState(0);
  const [phase, setPhase] = React.useState<"typing" | "pause" | "clear">(
    "typing",
  );
  const [displayRow, setDisplayRow] = React.useState<string[]>(() =>
    columns.map(() => ""),
  );

  // Reset animation state whenever the field set changes (e.g. navigating
  // between EPCs of different event types without a full remount).
  React.useEffect(() => {
    setActiveCol(0);
    setCharIdx(0);
    setPhase("typing");
    setDisplayRow(columns.map(() => ""));
  }, [columns]);

  React.useEffect(() => {
    if (columns.length === 0) return;

    const id = setInterval(() => {
      if (phase === "typing") {
        const full = exampleRowValues[activeCol] ?? "";
        const next = charIdx + 1;

        setDisplayRow((previous) => {
          const copy = [...previous];
          copy[activeCol] = full.slice(0, next);
          return copy;
        });

        if (next >= full.length) {
          const nextCol = activeCol + 1;

          if (nextCol >= columns.length) {
            setCharIdx(0);
            setPhase("pause");
          } else {
            setActiveCol(nextCol);
            setCharIdx(0);
          }
        } else {
          setCharIdx(next);
        }
      } else if (phase === "pause") {
        setPhase("clear");
      } else {
        setDisplayRow(columns.map(() => ""));
        setActiveCol(0);
        setCharIdx(0);
        setPhase("typing");
      }
    }, 75);

    return () => clearInterval(id);
  }, [phase, activeCol, charIdx, columns, exampleRowValues]);

  if (columns.length === 0) return null;

  const isActive = (columnIndex: number) =>
    phase === "typing" && columnIndex === activeCol;

  return (
    <div className="lead-excel-preview">
      <div className="lead-excel-titlebar">
        <div className="lead-excel-window-controls" aria-hidden="true">
          <div className="lead-excel-window-dot lead-excel-window-dot-red" />
          <div className="lead-excel-window-dot lead-excel-window-dot-yellow" />
          <div className="lead-excel-window-dot lead-excel-window-dot-green" />
        </div>

        <span className="lead-excel-file-name">lead-import-template.xlsx</span>
      </div>

      <div className="lead-excel-formula-bar">
        <span className="lead-excel-cell-ref">
          {phase === "typing"
            ? `${String.fromCharCode(65 + activeCol)}2`
            : "A1"}
        </span>

        <div className="lead-excel-formula-divider" aria-hidden="true" />

        <span className="lead-excel-formula-value">
          {phase === "typing"
            ? (exampleRowValues[activeCol] ?? "").slice(0, charIdx + 1)
            : ""}
        </span>
      </div>

      <div className="lead-excel-sheet-scroll scrollbar-sleek">
        <table className="lead-excel-sheet">
          <colgroup>
            <col className="lead-excel-row-number-col" />
            {columns.map((column) => (
              <col key={column.field} className="lead-excel-data-col" />
            ))}
          </colgroup>

          <thead>
            <tr>
              <th className="lead-excel-corner-cell" />

              {columns.map((column, index) => (
                <th key={column.field} className="lead-excel-column-cell">
                  {String.fromCharCode(65 + index)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="lead-excel-row-number-cell">1</td>

              {columns.map((column) => (
                <td
                  key={column.field}
                  className={
                    column.required
                      ? "lead-excel-header-cell lead-excel-header-cell-required"
                      : "lead-excel-header-cell lead-excel-header-cell-optional"
                  }
                >
                  {column.label}
                  {column.required && (
                    <span className="lead-excel-required-mark">*</span>
                  )}
                </td>
              ))}
            </tr>

            <tr>
              <td className="lead-excel-row-number-cell">2</td>

              {columns.map((column, columnIndex) => {
                const active = isActive(columnIndex);

                return (
                  <td
                    key={column.field}
                    className={[
                      "lead-excel-data-cell",
                      column.required
                        ? "lead-excel-data-cell-required"
                        : "lead-excel-data-cell-optional",
                      active ? "lead-excel-data-cell-active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {displayRow[columnIndex] ?? ""}
                    {active && (
                      <span className="lead-excel-caret" aria-hidden="true" />
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="lead-excel-tabs">
        <div className="lead-excel-tab lead-excel-tab-active">Import Data</div>
        <div className="lead-excel-tab">Field Guide</div>
      </div>

      <div className="lead-excel-legend">
        <div className="lead-excel-legend-item">
          <div className="lead-excel-legend-swatch lead-excel-legend-required" />
          <span>Required</span>
        </div>

        <div className="lead-excel-legend-item">
          <div className="lead-excel-legend-swatch lead-excel-legend-optional" />
          <span>Optional</span>
        </div>

        <span className="lead-excel-legend-note">
          * Row 1 must be the header row
        </span>
      </div>
    </div>
  );
}
