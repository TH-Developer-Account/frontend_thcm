import { Pencil, Plus } from "lucide-react";

import Button from "../../../../../components/common/Button";
import LineTableView from "../../components/activityFormView/LineTableView";
import CrfForm from "./CrfForm";

import type { EpcDetailResponse } from "../../types/epc.types";
import { mapCrfLineItemsToTableRows } from "./crf.mapper";
import SectionAccordion from "../../../../../components/common/SectionAccordion";

type CrfSectionProps = {
	epcData: EpcDetailResponse;
	isEditing: boolean;
	onEdit: () => void;
	onCancel: () => void;
	onSuccess: () => Promise<void>;
	canEdit?: boolean;
	canCreate?: boolean;
};

const CrfSection = ({
	epcData,
	isEditing,
	onEdit,
	onCancel,
	onSuccess,
	canEdit,
	canCreate,
}: CrfSectionProps) => {
	const crf = epcData.crf;
	const hasLineItems = Boolean(crf?.lineItems?.length);

	if (isEditing) {
		return (
			<CrfForm
				mode={crf ? "edit" : "create"}
				epcId={epcData.id}
				crfId={crf?.id}
				initialData={crf}
				onCancel={onCancel}
				onSuccess={onSuccess}
			/>
		);
	}

	if (hasLineItems) {
		return (
			<SectionAccordion
				title="Collateral Requisition Form Line Items"
				action={
					canEdit && (
						<Button
							type="button"
							Icon={Pencil}
							text="Edit CRF"
							size="sm"
							onClick={onEdit}
							appearance="standard"
							variant="outline"
						/>
					)
				}
			>
				<LineTableView
					data={mapCrfLineItemsToTableRows(crf?.lineItems)}
					showGrandTotal
					grandTotalLabel="CRF Grand Total:"
				/>
			</SectionAccordion>
		);
	}

	return (
		<SectionAccordion
			title="Collateral Requisition Form"
			action={
				canCreate && (
					<Button
						type="button"
						text="Create CRF"
						Icon={Plus}
						size="sm"
						onClick={onEdit}
						appearance="standard"
						variant="outline"
					/>
				)
			}
		>
			<div className="text-sm text-gray-500">
				No CRF has been created for this EPC yet.
			</div>
		</SectionAccordion>
	);
};

export default CrfSection;
