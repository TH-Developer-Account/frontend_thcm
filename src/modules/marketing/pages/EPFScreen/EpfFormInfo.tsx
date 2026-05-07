import { HandCoins, Users, ShieldCheck, Wallet, Banknote } from "lucide-react";
import { ServerAxios } from "../../../../services/ServerAxios";
import Button from "../../../../components/common/Button";
import FormInput from "../../../../components/FormElements/FormInput";
import type { EpfFormValues } from "../../types";
import FormHeader from "./components/FormHeader";
import { useState } from "react";
import ApprovalTable from "../../../../components/ui/ApprovalTable";
import { useAuth } from "../../../../context/Auth/useAuth";
import type {
	Stage,
	Approver,
} from "../../../admin/workflow/types/workflow.types";

// ✅ Removed: handleSave, handleReset, userRole, isEditMode
interface EpfFormProps {
	epcId?: string;
	values: EpfFormValues;
	handleChange: (name: keyof EpfFormValues, value: string) => void;
	eventCost: number;
}

interface PreviewApproval {
	id: number;
	name: string;
	email: string;
	stageName: string;
	strategy: string;
}

const mapWorkflowToUI = (data: Stage[]) => {
	const approvers = data.flatMap((stage: Stage) =>
		stage.approvers.map((a: Approver) => ({
			id: stage.stageOrder,
			name: `${a.user.first_name} ${a.user.last_name}`,
			email: a.user.email,
			stageName: stage.name,
			strategy: stage.approvers.length > 1 ? "Parallel" : "Sequential",
		})),
	);
	return [...approvers];
};

const EpfFormInfo = ({ values, handleChange, eventCost }: EpfFormProps) => {
	const { workspaceId } = useAuth();
	const [previewWFData, setPreviewWFData] = useState<PreviewApproval[]>([]);

	console.log("CRF Total value", values.crfTotal);
	const handleIsApproval = async () => {
		try {
			const app = localStorage.getItem("appId");
			const {
				data: {
					data: { stages },
				},
			} = await ServerAxios.post(`/soa/preview-workflow`, {
				workspaceId,
				appId: app,
				budget: eventCost,
			});
			const formattedData = mapWorkflowToUI(stages);
			setPreviewWFData(formattedData);
		} catch (err) {
			console.error("Failed to fetch the epf:", err);
		}
	};

	return (
		<div>
			<div className="grid grid-cols-1 lg:grid-cols-[9fr_3fr] gap-4 items-start mx-auto h-full">
				<div className="text-left lg:text-sm text-xs w-full">
					{/* Event Participants Section */}
					<div className="shadow-xs">
						<FormHeader title="Participants" Icon={Users} />
						<div className="grid md:grid-cols-4 grid-cols-1 gap-4 items-end px-3 pb-2">
							<FormInput
								name="externalParticipants"
								type="number"
								placeholder="0"
								label="External Participants"
								value={values.externalParticipants}
								onChange={(e) =>
									handleChange("externalParticipants", e.target.value)
								}
							/>
							<FormInput
								name="internalParticipants"
								type="number"
								min={0}
								placeholder="0"
								label="Internal Participants"
								value={values.internalParticipants}
								onChange={(e) =>
									handleChange("internalParticipants", e.target.value)
								}
							/>
							<FormInput
								name="totalParticipants"
								readOnly
								disabled
								label="Total participants"
								value={values.totalParticipants}
								onChange={(e) =>
									handleChange("totalParticipants", e.target.value)
								}
							/>
						</div>
					</div>

					{/* Budget Section */}
					<div className="shadow-xs pb-2">
						<FormHeader title="Budget Section" Icon={Banknote} />
						<div className="grid md:grid-cols-4 grid-cols-1 gap-4 items-end px-3">
							<FormInput
								name="eventBudget"
								label="Event budget (₹)"
								required
								type="number"
								disabled
								readOnly
								value={eventCost}
							/>
							<FormInput
								name="annualBudget"
								label="Annual budget (₹)"
								required
								type="number"
								min={0}
								placeholder="0"
								disabled
								readOnly
								value={values.annualBudget}
								onChange={(e) => handleChange("annualBudget", e.target.value)}
							/>
							<FormInput
								name="availableBudget"
								label="Available budget (₹)"
								readOnly
								placeholder="0"
								disabled
								value={values.availableBudget}
								onChange={(e) =>
									handleChange("availableBudget", e.target.value)
								}
							/>
							<FormInput
								name="tataHitachiPoAmount"
								label="Tata Hitachi PO Amount"
								placeholder="0"
								value={values.tataHitachiPoAmount}
								onChange={(e) =>
									handleChange("tataHitachiPoAmount", e.target.value)
								}
							/>
						</div>
					</div>

					{/* Dealer Info Section */}
					<div className="shadow-xs pb-2">
						<FormHeader title="Budget Share" Icon={HandCoins} />
						<div className="grid grid-cols-2 gap-4 items-end px-3 pb-2">
							<FormInput
								name="dealerName"
								label="Dealer Name"
								value={values.dealerName}
								onChange={(e) => handleChange("dealerName", e.target.value)}
							/>
						</div>
						<div className="grid md:grid-cols-4 grid-cols-1 gap-4 items-end px-3">
							<FormInput
								name="dealerPercent"
								label="Dealer (%)"
								value={values.dealerPercent}
								onChange={(e) => handleChange("dealerPercent", e.target.value)}
							/>
							<FormInput
								name="tataHitachiPercent"
								label="Tata Hitachi (%)"
								readOnly
								disabled
								value={values.tataHitachiPercent}
								onChange={(e) =>
									handleChange("tataHitachiPercent", e.target.value)
								}
							/>
							<FormInput
								name="dealerShare"
								label="Dealer Share"
								readOnly
								disabled
								value={values.dealerShare}
								onChange={(e) => handleChange("dealerShare", e.target.value)}
							/>
							<FormInput
								name="tataHitachiShare"
								label="Tata Hitachi Share"
								readOnly
								disabled
								value={values.tataHitachiShare}
								onChange={(e) =>
									handleChange("tataHitachiShare", e.target.value)
								}
							/>
						</div>
					</div>

					{/* Approval Workflow Section — ✅ buttons removed */}
					<div className="bg-white pb-4 shadow-xs text-right">
						<FormHeader title="Approval Workflow" Icon={ShieldCheck} />
						<Button
							text="Display Approval Flow"
							status="brand"
							onClick={handleIsApproval}
						/>
						{previewWFData.length ? (
							<ApprovalTable data={previewWFData} />
						) : null}
					</div>
				</div>

				{/* Right sidebar */}
				<div className="h-auto top-0 w-full relative">
					<div className="bg-white shadow-xs">
						<FormHeader title="CRF Total" Icon={Wallet} />
						<div className="px-2 grid">
							<FormInput
								name="crfTotal"
								placeholder="--"
								className="bg-gray-100 text-black font-semibold cursor-not-allowed"
								readOnly
								disabled
								label="CRF total (₹)"
								value={values.crfTotal}
								onChange={(e) => handleChange("crfTotal", e.target.value)}
							/>
						</div>
					</div>
					<div className="bg-white shadow-xs">
						<FormHeader title="Budget Share" Icon={Wallet} />
						<div className="text-left text-xs p-4 flex flex-col gap-2">
							<div className="bg-gray-100 px-1.5 py-2 rounded-sm flex justify-between items-center">
								<p>Available Budget:</p>
								<span className="text-lg font-semibold">
									{values.availableBudget
										? values.availableBudget + " rs"
										: "--"}
								</span>
							</div>
							<div className="bg-gray-100 px-1.5 py-2 rounded-sm flex justify-between items-center">
								<p>Annual Budget:</p>
								<span className="text-lg font-semibold">
									{values.annualBudget ? values.annualBudget + " rs" : "-- rs"}
								</span>
							</div>
							<div className="bg-gray-100 px-1.5 py-2 rounded-sm flex justify-between items-center">
								<p>Allotted Budget:</p>
								<span className="text-lg font-semibold">
									{values.availableBudget
										? values.availableBudget + " rs"
										: "-- rs"}
								</span>
							</div>
							<div className="bg-gray-100 px-1.5 py-2 rounded-sm flex justify-between items-center">
								<p>Event Budget:</p>
								<span className="text-lg font-semibold">
									{eventCost ? eventCost + " rs" : "-- rs"}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EpfFormInfo;
