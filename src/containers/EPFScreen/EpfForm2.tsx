import Button from "../../components/common/Button";
import FormInput from "../../components/FormElements/FormInput";
// import SelectInput from "../../components/FormElements/SelectInput";
// import TextareaInput from "../../components/FormElements/TextareaInput";
import { useEpcForm } from "../EPCScreen/useEPCForm";

interface EpcFormProps {
	epcId?: string;
	userRole: "ADMIN" | "MANAGER" | "VIEWER";
}

const EpfForm2 = ({ epcId, userRole }: EpcFormProps) => {
	const {
		// values,
		// options,
		// regions,
		// branches,
		isEditMode,
		// handleChange,
		handleSave,
	} = useEpcForm({ epcId });

	const isViewer = userRole === "VIEWER";

	return (
		<div className="p-6  text-left text-sm/4 lg:text-sm text-xs">
			{/* Event Participants Section */}
			<div className="grid md:grid-cols-4 grid-cols-1 gap-4 items-end">
				<FormInput
					name="externalParticipants"
					label="External Participants"
					// value={values.externalParticipants}
					// onChange={(e) => handleChange("externalParticipants", e.target.value)}
				/>

				<FormInput
					name="internalParticipants"
					label="Internal Participants"
					// value={values.internalParticipants}
					// onChange={(e) => handleChange("internalParticipants", e.target.value)}
				/>

				<FormInput
					name="totalParticipants"
					label="Total Participants"
					// value={values.totalParticipants}
					// onChange={(e) => handleChange("totalParticipants", e.target.value)}
				/>

				<FormInput
					name="crfTotal"
					label="CRF Total"
					// value={values.crfTotal}
					// onChange={(e) => handleChange("crfTotal", e.target.value)}
				/>
			</div>

			{/* Budget Section */}
			<div className="grid md:grid-cols-4 grid-cols-1 gap-4 items-end ">
				<FormInput
					name="eventBudget"
					label="Event Budget"
					// value={values.eventBudget}
					// onChange={(e) => handleChange("eventBudget", e.target.value)}
				/>

				<FormInput
					name="dealerName"
					label="Dealer Name"
					// value={values.dealerName}
					// onChange={(e) => handleChange("dealerName", e.target.value)}
				/>

				<FormInput
					name="dealerShare"
					label="Dealer Share"
					// value={values.dealerShare}
					// onChange={(e) => handleChange("dealerShare", e.target.value)}
				/>

				<FormInput
					name="dealerPercentage"
					label="Dealer (%)"
					// value={values.dealerPercentage}
					// onChange={(e) => handleChange("dealerPercentage", e.target.value)}
				/>
			</div>

			{/* Tata Hitachi Section */}
			<div className="grid md:grid-cols-4 grid-cols-1 gap-4 items-end ">
				<FormInput
					name="tataHitachiPercentage"
					label="Tata Hitachi (%)"
					// value={values.tataHitachiPercentage}
					// onChange={(e) =>
					// 	handleChange("tataHitachiPercentage", e.target.value)
					// }
				/>

				<FormInput
					name="tataHitachiShare"
					label="Tata Hitachi Share"
					// value={values.tataHitachiShare}
					// onChange={(e) => handleChange("tataHitachiShare", e.target.value)}
				/>

				<FormInput
					name="annualBudget"
					label="Annual Budget"
					// value={values.annualBudget}
					// onChange={(e) => handleChange("annualBudget", e.target.value)}
				/>

				<FormInput
					name="availableBudget"
					label="Available Budget"
					// value={values.availableBudget}
					// onChange={(e) => handleChange("availableBudget", e.target.value)}
				/>
			</div>

			{/* PO & Approval Section */}
			<div className="grid md:grid-cols-4 grid-cols-1 gap-4 items-end ">
				<FormInput
					name="tataHitachiPoAmount"
					label="Tata Hitachi PO Amount"
					// value={values.tataHitachiPoAmount}
					// onChange={(e) => handleChange("tataHitachiPoAmount", e.target.value)}
				/>

				<FormInput
					name="proposedBy"
					label="Proposed By"
					// value={values.proposedBy}
					// onChange={(e) => handleChange("proposedBy", e.target.value)}
				/>

				<FormInput
					name="checkedBy"
					label="Checked By"
					// value={values.checkedBy}
					// onChange={(e) => handleChange("checkedBy", e.target.value)}
				/>

				<FormInput
					name="approvedBy"
					label="Approved By"
					// value={values.approvedBy}
					// onChange={(e) => handleChange("approvedBy", e.target.value)}
				/>
			</div>

			{/* Report Validation Section */}
			<div className="grid md:grid-cols-4 grid-cols-1 gap-4 items-end ">
				<FormInput
					name="reportValidatedBy"
					label="Report Validated By"
					// value={values.reportValidatedBy}
					// onChange={(e) => handleChange("reportValidatedBy", e.target.value)}
				/>

				<FormInput
					name="proposedByStatus"
					label="Proposed By Status"
					// value={values.proposedByStatus}
					// onChange={(e) => handleChange("proposedByStatus", e.target.value)}
				/>

				<FormInput
					name="checkedByStatus"
					label="Checked By Status"
					// value={values.checkedByStatus}
					// onChange={(e) => handleChange("checkedByStatus", e.target.value)}
				/>

				<FormInput
					name="approvedByStatus"
					label="Approved By Status"
					// value={values.approvedByStatus}
					// onChange={(e) => handleChange("approvedByStatus", e.target.value)}
				/>
			</div>

			<div className="grid md:grid-cols-4 grid-cols-1 gap-4 items-end ">
				<FormInput
					name="reportValidatedByStatus"
					label="Report Validated By Status"
					// value={values.reportValidatedByStatus}
					// onChange={(e) =>
					// 	handleChange("reportValidatedByStatus", e.target.value)
					// }
				/>
			</div>

			{/* Buttons */}
			{!isViewer && (
				<div className="mt-6 flex justify-end gap-3">
					<Button text="Save as Draft" onClick={() => handleSave("DRAFT")} />
					<Button
						onClick={() => handleSave("SUBMITTED")}
						text={isEditMode ? "Update & Submit" : "Submit"}
					/>
				</div>
			)}
		</div>
	);
};

export default EpfForm2;
