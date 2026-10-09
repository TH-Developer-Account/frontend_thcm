// activity-planner/components/activityFormView/CrfSection.tsx
// EPC-side adapter for the CRF module: shows the CRF of an EPC and refreshes
// the EPC after the CRF is saved. Moved from forms/CRF/CrfSection.tsx.
//
// Readonly view: a saved souvenir line only carries { sku, requestedQty,
// status } (see crf.types.ts), so — same as the edit form — this backfills
// title/image/price for the souvenir lines via a live catalog lookup before
// handing rows to <LineTableView />, instead of showing bare SKUs.

import React from "react";
import { useQueryClient } from "@tanstack/react-query";

import { epcKeys } from "../../activity-planner/queries/epc.queries";
import type { EpcDetailResponse } from "../../activity-planner/types/epc.types";
import { useSouvenirStockBySkusQuery } from "../shop/api";
import {
	backfillSouvenirDisplayFields,
	mapCrfLineItemsToFormItems,
	mapCrfLineItemsToTableRows,
} from "./mapper";
import CrfForm from "./CrfForm";
import LineTableView from "../../activity-planner/components/activityFormView/LineTableView";

export type CrfSectionProps = {
	epcData: EpcDetailResponse;
	isEditing: boolean;
	onCancel: () => void;
	onSuccess: () => Promise<void>;
};

const CrfSection = ({
	epcData,
	isEditing,
	onCancel,
	onSuccess,
}: CrfSectionProps) => {
	const queryClient = useQueryClient();
	const crf = epcData.crf;

	const formItems = React.useMemo(
		() => mapCrfLineItemsToFormItems(crf?.items ?? []),
		[crf],
	);

	const souvenirSkus = React.useMemo(
		() =>
			(crf?.items ?? [])
				.filter((item) => item.source === "SHOPIFY")
				.map((item) => item.sku),
		[crf],
	);

	const souvenirBackfillQuery = useSouvenirStockBySkusQuery(
		souvenirSkus,
		!isEditing && souvenirSkus.length > 0,
	);

	const displayItems = React.useMemo(
		() =>
			souvenirBackfillQuery.data
				? backfillSouvenirDisplayFields(formItems, souvenirBackfillQuery.data.data)
				: formItems,
		[formItems, souvenirBackfillQuery.data],
	);

	const handleSaved = async () => {
		// Previously done inside the CRF mutations.
		void queryClient.invalidateQueries({
			queryKey: epcKeys.detail(epcData.id),
		});
		await onSuccess();
	};

	if (isEditing) {
		return (
			<CrfForm
				epcId={epcData.id}
				initialData={crf}
				onCancel={onCancel}
				onSuccess={handleSaved}
			/>
		);
	}

	if (!crf?.items?.length) {
		return (
			<p className="epf-empty-message">
				No CRF has been created for this EPC yet.
			</p>
		);
	}

	return (
		<LineTableView
			data={mapCrfLineItemsToTableRows(displayItems)}
			showGrandTotal
			grandTotalLabel="CRF Grand Total:"
		/>
	);
};

export default CrfSection;
