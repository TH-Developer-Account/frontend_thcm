import { useState } from "react";
import { X, Save, Database } from "lucide-react";
import { type MasterItem } from "../../../../components/ui/MasterLineItemTable";
import FormInput from "../../../../components/FormElements/FormInput";
import Button from "../../../../components/common/Button";

interface MasterDetailPanelProps {
	masterName: string;
	item: MasterItem | null;
	onSave: (updated: MasterItem) => void;
	onClose: () => void;
}

export function MasterDetailPanel({
	masterName,
	item,
	onSave,
	onClose,
}: MasterDetailPanelProps) {
	const [form, setForm] = useState<MasterItem | null>(
		item ? { ...item } : null,
	);
	const [dirty, setDirty] = useState(false);

	const handleChange = (field: keyof MasterItem, value: string) => {
		if (!form) return;
		setForm({ ...form, [field]: value });
		setDirty(true);
	};

	// Add New
	const handleSave = () => {
		if (!form || !form.label.trim()) return;
		onSave(form);
		console.log(form, "form");
		setDirty(false);
	};

	// ── Empty state ──
	if (!item || !form) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3 bg-gray-50 rounded-lg border border-gray-200">
				<div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
					<Database size={18} />
				</div>
				<p className="text-sm text-gray-400 font-medium">Select a record</p>
				<p className="text-xs text-gray-300">
					Click any row to view or edit it here
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
			{/* Panel header */}
			<div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 shrink-0">
				<div>
					{/* <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
						{masterName}
					</p> */}
					<h3 className="text-sm font-semibold text-gray-700">
						{form.label || "New"}
					</h3>
				</div>
				<button
					onClick={onClose}
					className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
				>
					<X size={14} />
				</button>
			</div>

			{/* Form */}
			<div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
				{/* Name field */}
				<FormInput
					name="label"
					label={`${masterName.replace(/s$/, "")} Name`}
					value={form.label}
					onChange={(e) => handleChange("label", e.target.value)}
					onKeyDown={(e: React.KeyboardEvent) =>
						e.key === "Enter" && handleSave()
					}
				/>
				{/* Name field */}
				<FormInput
					name="label"
					label={`${masterName.replace(/s$/, "")} Code`}
					value={form.code}
					onChange={(e) => handleChange("label", e.target.value)}
					onKeyDown={(e: React.KeyboardEvent) =>
						e.key === "Enter" && handleSave()
					}
				/>

				{/* Description field — optional extra field */}
				<FormInput
					name="description"
					label="Description (optional)"
					value={(form as any).description ?? ""}
					onChange={(e) =>
						handleChange("description" as keyof MasterItem, e.target.value)
					}
				/>

				{/* Status toggle */}
				<div className="flex justify-between">
					<p className="text-xs font-medium text-gray-500 mb-2">Status</p>
					<div className="flex gap-2">
						{["Active", "Inactive"].map((s) => {
							const current = (form as any).status ?? "Active";
							const isSel = current === s;
							return (
								<button
									key={s}
									onClick={() => handleChange("status" as keyof MasterItem, s)}
									className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${
											isSel
												? s === "Active"
													? "bg-green-50 border-green-200 text-green-700"
													: "bg-zinc-100 border-zinc-200 text-zinc-500"
												: "border-gray-200 text-gray-400 hover:border-gray-300"
										}`}
								>
									{s}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Footer actions */}
			<div className="px-5 py-3.5 border-t bg-gray-50 shrink-0 flex gap-2 justify-end">
				<Button size="sm" status="brand" onClick={onClose}>
					Cancel
				</Button>
				<Button
					size="sm"
					status="brand"
					Icon={Save}
					onClick={handleSave}
					disabled={!dirty}
				>
					Save changes
				</Button>
			</div>
		</div>
	);
}
