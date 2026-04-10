import { ArrowRight } from "lucide-react";
import EpfForm2 from "./EpfForm2";
import EventCostOverheads from "./EventCostOverheads";
import { useEpfForm } from "./useEPFForm";

/* ------------------------------------------------------------------ */
const particularOptions = [
	{ label: "Snacks / Beverage", value: "snacks" },
	{ label: "Miscellaneous Expenses", value: "misc" },
];
export default function EpfForm() {
	const epf = useEpfForm({});
	return (
		<>
			<div className=" mt-4 mx-auto p-2">
				<h2 className="text-left text-lg font-normal flex gap-2">
					MAP <ArrowRight /> Event Proposition Form
				</h2>
				<EventCostOverheads
					title="Event Cost Overheads"
					items={epf.values.overheads}
					draft={epf.draft}
					onDraftChange={epf.handleDraftChange}
					onAdd={epf.handleAdd}
					onDelete={epf.handleDelete}
					particularOptions={particularOptions}
				/>

				<EpfForm2
					values={epf.values}
					handleChange={epf.handleChange}
					handleSave={epf.handleSave}
					handleReset={epf.handleReset}
					userRole="ADMIN"
					isEditMode={epf.isEditMode}
				/>
			</div>
		</>
	);
}
