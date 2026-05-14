import { Pencil, Plus } from "lucide-react";

import Button from "../../../../components/common/Button";
import Section from "./Section";
import LineTableView from "./LineTableView";
import CrfForm from "../forms/CRF/CrfForm";

import type { EpcDetailResponse } from "../types/epc.types";
import { mapCrfLineItemsToTableRows } from "../forms/CRF/crf.mapper";

type CrfSectionProps = {
	epcData: EpcDetailResponse;
	isEditing: boolean;
	onEdit: () => void;
	onCancel: () => void;
	onSuccess: () => Promise<void>;
};

const CrfSection = ({
	epcData,
	isEditing,
	onEdit,
	onCancel,
	onSuccess,
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
			<Section
				title="Collateral Requisition Form Line Items"
				action={
					<Button
						type="button"
						iconPosition="right"
						Icon={Pencil}
						iconColor="red"
						size="sm"
						onClick={onEdit}
					/>
				}
			>
				<LineTableView data={mapCrfLineItemsToTableRows(crf?.lineItems)} />
			</Section>
		);
	}

	return (
		<Section
			title="Collateral Requisition Form"
			action={
				<Button
					type="button"
					text="Create CRF"
					Icon={Plus}
					iconColor="red"
					size="sm"
					className="epf-section-label text-xs"
					onClick={onEdit}
				/>
			}
		>
			<div className="text-sm text-gray-500">
				No CRF has been created for this EPC yet.
			</div>
		</Section>
	);
};

export default CrfSection;
