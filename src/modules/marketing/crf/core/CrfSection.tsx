// crf/core/CrfSection.tsx
// EPC-side adapter for the CRF module: shows the CRF of an EPC and refreshes
// the EPC after the CRF is saved.
//
// Readonly view: a saved souvenir line only carries { sku, requestedQty,
// status }, so — same as the edit form — this backfills title/image/price for
// the souvenir lines via a live catalog lookup before handing them to
// <CrfView />, instead of showing bare SKUs.

import React from "react";
import { useQueryClient } from "@tanstack/react-query";

import { epcKeys } from "../../activity-planner/queries/epc.queries";
import type { EpcDetailResponse } from "../../activity-planner/types/epc.types";
import { useSouvenirStockBySkusQuery } from "../shop/api";
import {
	backfillSouvenirDisplayFields,
	mapCrfLineItemsToFormItems,
} from "./mapper";
import CrfForm from "./CrfForm";
import CrfView from "./CrfView";
import type { CrfStatus } from "./types";

export type CrfSectionProps = {
	epcData: EpcDetailResponse;
	isEditing: boolean;
	onCancel: () => void;
	onSuccess: () => Promise<void>;
	/** Read-only view only: shows a "Go to CRF Order" button in the card header. */
	onGoToOrder?: () => void;
};

const CrfSection = ({
	epcData,
	isEditing,
	onCancel,
	onSuccess,
	onGoToOrder,
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
				? backfillSouvenirDisplayFields(
						formItems,
						souvenirBackfillQuery.data.data,
					)
				: formItems,
		[formItems, souvenirBackfillQuery.data],
	);

	const handleSaved = async () => {
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

	// `title={null}`: the host tab already titles this section ("CRF Details"),
	// so the card shows just the status pill + "Go to CRF Order". Drop the prop
	// to render the design's own "CRF Details" heading instead.
	return (
		<CrfView
			items={displayItems}
			status={crf.status as CrfStatus | undefined}
			title={null}
			onGoToOrder={onGoToOrder}
		/>
	);
};

export default CrfSection;
