import React from "react";
import { ArrowLeft } from "lucide-react";
import EpfFormInfo from "./EpfFormInfo";
import LineItemTable from "../../../../components/ui/LineItemTable";
import { useEpfForm } from "./useEPFForm";
import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../components/ui/PageHeader";
import Button from "../../../../components/common/Button";

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
	console.log("Values ===>", values);
	return (
		<React.Fragment>
			<PageRowSectionLayout
				contentClassName="p-4"
				header_children={
					<div className="flex flex-col sm:flex-row sm:justify-between items-end sm:items-start">
						<PageHeader
							headerText="Activity Proposition Form (APF)"
							subtitleText="Manager your Activity Proposition Form (APF) details here"
							badgeProps={{
								text: "Back",
								direction: "back",
							}}
						/>
						<div className="mx-2 my-4 sm:mx-4 flex flex-col gap-4 items-start">
							<p className="page-subtitle">
								<strong>EPC No: </strong>
								<span>{epcId}</span>
							</p>
							{/* ✅ All save/reset actions live here */}
							<div className="flex flex-row gap-4 items-end w-full">
								<Button
									text="Reset"
									onClick={handleReset}
									status="brand"
									fullWidth
								/>
								<Button
									status="brand"
									onClick={() => handleSubmit("SUBMITTED")}
									text="Save"
									className="ml-2"
									fullWidth
								/>
							</div>
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
				<div className="mb-2">
					{/* ✅ Only passes what EpfFormInfo still needs */}
					<EpfFormInfo
						values={values}
						handleChange={handleChange}
						eventCost={eventCost}
					/>
				</div>
			</PageRowSectionLayout>
		</React.Fragment>
	);
}
