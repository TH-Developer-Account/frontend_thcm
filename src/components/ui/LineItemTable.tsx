import { Trash2, Pencil } from "lucide-react";
import SelectInput from "../FormElements/SelectInput";
import FormInput from "../FormElements/FormInput";
import { useState } from "react";
import type { LineItemOption } from "../../modules/marketing/types";

interface LineItemTableProps {
  title: string;
  items: LineItemOption[];
  onChange: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
  particularOptions: LineItemOption[];
  isViewer?: boolean;
  category: string;
}

export default function LineItemTable({
  title,
  items,
  onChange,
  particularOptions,
  isViewer = false,
  category,
}: LineItemTableProps) {
  const [draft, setDraft] = useState<LineItemOption>({
    value: "",
    label: "",
    particular: "",
    description: "",
    rate: 0,
    quantity: 0,
  });

  const handleAdd = () => {
    if (!draft.particular) return;

    const newItem: LineItemOption = {
      ...draft,
      category,
    };

    onChange((prev) => [...prev, newItem]); // ✅ FIXED

    setDraft({
      value: "",
      label: "",
      particular: "",
      description: "",
      rate: 0,
      quantity: 0,
    });
  };

  const handleDelete = (id: string) => {
    onChange((prev) => prev.filter((item) => item.value !== id));
  };

  const total = draft.rate * draft.quantity;

  const handleParticularChange = (opt: LineItemOption | null) => {
    if (!opt) return;

    setDraft({
      ...draft,
      particular: opt.value,
      description: opt?.description,
      rate: opt.rate,
      quantity: opt.quantity ?? 1,
      value: opt.value,
      label: opt.label,
    });
  };

  return (
    <div className="mt-6 border border-gray-300 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-6 py-3 border-b border-gray-300">
        <h3 className="font-semibold text-gray-600 text-lg">{title}</h3>
      </div>

      <div className="p-6">
        {/* Table Header */}
        <div className="grid grid-cols-12 text-sm font-medium text-gray-600 mb-3">
          <div className="col-span-1">SNo</div>
          <div className="col-span-3">Particulars</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-1 text-right">Rate</div>
          <div className="col-span-1 text-right">Qty</div>
          <div className="col-span-1 text-right">Total</div>
          <div className="col-span-2 text-center">Action</div>
        </div>

        {/* Draft Row */}
        {!isViewer && (
          <div className="grid grid-cols-12 gap-3 mb-6 items-center">
            <div className="col-span-1 text-gray-500">{items.length + 1}</div>

            <div className="col-span-3">
              <SelectInput<LineItemOption>
                name="particular"
                label=""
                options={particularOptions}
                value={
                  particularOptions.find((o) => o.value === draft.particular) ||
                  null
                }
                onChange={handleParticularChange}
              />
            </div>

            <div className="col-span-3">
              <FormInput
                name="description"
                label=""
                value={draft.description as string}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-span-1">
              <FormInput
                type="number"
                name="rate"
                label=""
                value={draft.rate}
                disabled
              />
            </div>

            <div className="col-span-1">
              <FormInput
                type="number"
                name="quantity"
                min={1}
                label=""
                value={draft.quantity}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    quantity: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="col-span-1 text-right font-medium">
              {total.toFixed(2)}
            </div>

            <div className="col-span-2 flex justify-center">
              <button
                type="button"
                onClick={handleAdd}
                className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Existing Items */}
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.value}
              className="grid grid-cols-12 py-3 px-2 bg-gray-50 rounded-lg text-sm items-center"
            >
              <div className="col-span-1">{index + 1}</div>
              <div className="col-span-3">
                {
                  particularOptions.find((p) => p.value === item.particular)
                    ?.label
                }
              </div>
              <div className="col-span-3">{item.description}</div>
              <div className="col-span-1 text-right">
                {item.rate.toFixed(2)}
              </div>
              <div className="col-span-1 text-right">
                {item.quantity.toFixed(2)}
              </div>
              <div className="col-span-1 text-right font-medium">
                {(item.rate * item.quantity).toFixed(2)}
              </div>
              <div className="col-span-2 flex justify-center gap-3 text-gray-500">
                <Pencil
                  size={16}
                  className="cursor-pointer hover:text-orange-500"
                />
                <Trash2
                  size={16}
                  className="cursor-pointer hover:text-red-500"
                  onClick={() => handleDelete(item.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
