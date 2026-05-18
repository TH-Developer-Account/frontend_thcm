import { useState } from "react";
import { Banknote, HandCoins, ShieldCheck, Users, Wallet } from "lucide-react";

import Button from "../../../../../components/common/Button";
import FormInput from "../../../../../components/FormElements/FormInput";
import ApprovalTable from "../../../../../components/ui/ApprovalTable";

import { useAuth } from "../../../../../context/Auth/useAuth";
import { workflowApi } from "../../api/workflow.api";
import { getStoredAppId } from "../../../helpers/localstorage";

import type { EpfFormValues } from "../../types/epf.types";
import type { ApprovalTableRow } from "../../../../../utils/types";

import FormHeader from "../../components/FormHeader";

type EpfFormInfoProps = {
	values: EpfFormValues;
	errors?: Partial<Record<keyof EpfFormValues, string>>;
	handleChange: (name: keyof EpfFormValues, value: string) => void;
	eventCost: number;
};

type WorkflowStage = {
	id?: string;
	name: string;
	stageOrder: number;
	strategy?: string;
	minApprovals?: number;
	approvers?: {
		id?: string;
		user?: {
			id?: string;
			first_name?: string;
			last_name?: string;
			email?: string;
		};
	}[];
};

const getApprovalStrategyLabel = (stage: WorkflowStage) => {
	const approverCount = stage.approvers?.length ?? 0;

	if (approverCount <= 1) return "Sequential";

	if (stage.minApprovals && stage.minApprovals === approverCount) {
		return "All Approvers Required";
	}

	return "Parallel";
};

const mapWorkflowToRows = (
	stages: WorkflowStage[] = [],
): ApprovalTableRow[] => {
	return stages.flatMap((stage) => {
		const approvers = stage.approvers ?? [];

		if (!approvers.length) {
			return [
				{
					id: `${stage.stageOrder}-empty`,
					stageOrder: stage.stageOrder,
					name: "--",
					email: "--",
					stageName: stage.name,
					strategy: getApprovalStrategyLabel(stage),
					minApprovals: stage.minApprovals
						? String(stage.minApprovals)
						: undefined,
				},
			];
		}

		return approvers.map((approver, index) => {
			const user = approver.user;

			return {
				id: approver.id ?? `${stage.stageOrder}-${index}`,
				stageOrder: stage.stageOrder,
				name:
					[user?.first_name, user?.last_name].filter(Boolean).join(" ") || "--",
				email: user?.email || "--",
				stageName: stage.name,
				strategy: getApprovalStrategyLabel(stage),
				minApprovals: stage.minApprovals
					? String(stage.minApprovals)
					: undefined,
			};
		});
	});
};

export default function EpfFormFields({
	values,
	errors = {},
	handleChange,
	eventCost,
}: EpfFormInfoProps) {
	const { workspaceId } = useAuth();

	const [previewRows, setPreviewRows] = useState<ApprovalTableRow[]>([]);
	const [previewLoading, setPreviewLoading] = useState(false);

	const handlePreviewWorkflow = async () => {
		try {
			const appId = getStoredAppId();

			if (!workspaceId || !appId) return;

			setPreviewLoading(true);

			const data = await workflowApi.previewWorkflow({
				workspaceId,
				appId,
				budget: eventCost,
			});

			setPreviewRows(mapWorkflowToRows(data?.stages ?? []));
		} catch (error) {
			console.error("Failed to preview workflow:", error);
			setPreviewRows([]);
		} finally {
			setPreviewLoading(false);
		}
	};

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-[9fr_3fr]">
			<div className="space-y-4 text-left text-xs lg:text-sm">
				<div className=" bg-white pb-3">
					<FormHeader title="Participants" Icon={Users} />

					<div className="grid grid-cols-1 gap-4 px-3 md:grid-cols-3">
						<FormInput
							name="externalParticipants"
							type="number"
							min={0}
							placeholder="0"
							required
							label="External Participants"
							value={values.externalParticipants}
							error={errors.externalParticipants}
							onChange={(e) =>
								handleChange("externalParticipants", e.target.value)
							}
						/>

						<FormInput
							name="internalParticipants"
							type="number"
							min={0}
							placeholder="0"
							required
							label="Internal Participants"
							value={values.internalParticipants}
							error={errors.internalParticipants}
							onChange={(e) =>
								handleChange("internalParticipants", e.target.value)
							}
						/>

						<FormInput
							name="totalParticipants"
							readOnly
							disabled
							label="Total Participants"
							value={values.totalParticipants}
							error={errors.totalParticipants}
							onChange={(e) =>
								handleChange("totalParticipants", e.target.value)
							}
						/>
					</div>
				</div>

				<div className=" bg-white pb-3">
					<FormHeader title="Dealer Info" Icon={HandCoins} />

					<div className="grid grid-cols-1 gap-4 px-3 md:grid-cols-2">
						<FormInput
							name="dealerName"
							label="Dealer Name"
							value={values.dealerName}
							error={errors.dealerName}
							onChange={(e) => handleChange("dealerName", e.target.value)}
						/>
					</div>

					<div className="mt-4 grid grid-cols-1 gap-4 px-3 md:grid-cols-4">
						<FormInput
							name="dealerPercent"
							type="number"
							min={0}
							max={100}
							label="Dealer (%)"
							value={values.dealerPercent}
							error={errors.dealerPercent}
							onChange={(e) => handleChange("dealerPercent", e.target.value)}
						/>

						<FormInput
							name="tataHitachiPercent"
							label="Tata Hitachi (%)"
							readOnly
							disabled
							value={values.tataHitachiPercent}
							error={errors.tataHitachiPercent}
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
							error={errors.dealerShare}
							onChange={(e) => handleChange("dealerShare", e.target.value)}
						/>

						<FormInput
							name="tataHitachiShare"
							label="Tata Hitachi Share"
							readOnly
							disabled
							value={values.tataHitachiShare}
							error={errors.tataHitachiShare}
							onChange={(e) => handleChange("tataHitachiShare", e.target.value)}
						/>
					</div>
				</div>

				<div className=" bg-white pb-3">
					<div className="flex items-center justify-between gap-3 pr-3">
						<FormHeader title="Approval Workflow" Icon={ShieldCheck} />

						<Button
							type="button"
							text={previewLoading ? "Loading..." : "Display Approval Flow"}
							status="brand"
							onClick={handlePreviewWorkflow}
							size="sm"
							disabled={previewLoading}
						/>
					</div>

					{previewRows.length > 0 ? (
						<div className="px-3">
							<ApprovalTable data={previewRows} />
						</div>
					) : (
						<p className="px-3 text-xs text-[var(--color-text-muted)]">
							No workflow preview loaded yet.
						</p>
					)}
				</div>
			</div>

			<div className="space-y-4">
				<div className="rounded-xl border border-[var(--color-border)] bg-white pb-3">
					<FormHeader title="CRF Total" Icon={Wallet} />

					<div className="px-3">
						<FormInput
							name="crfTotal"
							readOnly
							disabled
							label="CRF Total (₹)"
							value={values.crfTotal}
							error={errors.crfTotal}
							onChange={(e) => handleChange("crfTotal", e.target.value)}
						/>
					</div>
				</div>

				<div className="rounded-xl border border-[var(--color-border)] bg-white pb-3">
					<FormHeader title="Budget Section" Icon={Banknote} />

					<div className="space-y-3 px-3">
						<FormInput
							name="eventBudget"
							label="Event Budget (₹)"
							required
							type="number"
							disabled
							readOnly
							value={eventCost}
							error={errors.eventBudget}
						/>

						<FormInput
							name="annualBudget"
							label="Annual Budget (₹)"
							required
							type="number"
							min={0}
							disabled
							readOnly
							value={values.annualBudget}
							error={errors.annualBudget}
							onChange={(e) => handleChange("annualBudget", e.target.value)}
						/>

						<FormInput
							name="availableBudget"
							label="Available Budget (₹)"
							readOnly
							disabled
							value={values.availableBudget}
							error={errors.availableBudget}
							onChange={(e) => handleChange("availableBudget", e.target.value)}
						/>

						<FormInput
							name="allotedBudget"
							label="Allotted Budget (₹)"
							readOnly
							disabled
							value={values.allotedBudget}
							error={errors.allotedBudget}
							onChange={(e) => handleChange("allotedBudget", e.target.value)}
						/>

						<FormInput
							name="tataHitachiPoAmount"
							label="Tata Hitachi PO Amount"
							readOnly
							disabled
							value={values.tataHitachiPoAmount}
							error={errors.tataHitachiPoAmount}
							onChange={(e) =>
								handleChange("tataHitachiPoAmount", e.target.value)
							}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
