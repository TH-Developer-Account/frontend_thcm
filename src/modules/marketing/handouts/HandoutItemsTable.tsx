// handouts/HandoutItemsTable.tsx
// Requested items, shared by the approver view, the delivery check and the
// read-only detail. Built on ManagementTable (no pagination — a request has
// at most HANDOUT_LIMITS.MAX_ITEMS lines).
//
//   • `stock`   → adds a "Stock now" column from the CRF shop's display-only
//                 stock-check (never a reservation).
//   • `checked` → adds a tick column (delivery team verifies each item).

import { useMemo } from "react";

import Checkbox from "../../../components/forms/Checkbox";
import ManagementTable from "../../../components/ui/tables/ManagementTable/ManagementTable";
import type { ManagementTableColumn } from "../../../components/ui/tables/ManagementTable/ManagementTable.types";
import {
	CrfImage,
	formatCrfAmount,
	formatCrfQuantity,
	type ShopStockCheckResult,
} from "../crf";

import type { HandoutItem } from "./handouts.types";

type CheckProps = {
	checkedSkus: ReadonlySet<string>;
	onToggle: (sku: string, checked: boolean) => void;
	disabled?: boolean;
};

type Props = {
	items: HandoutItem[];
	stock?: ShopStockCheckResult;
	stockLoading?: boolean;
	check?: CheckProps;
};

export default function HandoutItemsTable({
	items,
	stock,
	stockLoading = false,
	check,
}: Props) {
	const stockBySku = useMemo(
		() => new Map((stock?.lines ?? []).map((line) => [line.sku, line])),
		[stock],
	);

	const columns = useMemo<ManagementTableColumn<HandoutItem>[]>(() => {
		const cols: ManagementTableColumn<HandoutItem>[] = [];

		if (check) {
			cols.push({
				key: "checked",
				header: "Checked",
				width: "5rem",
				render: (item) => (
					<Checkbox
						name={`checked-${item.sku}`}
						checked={check.checkedSkus.has(item.sku)}
						disabled={check.disabled}
						onChange={(value) => check.onToggle(item.sku, value)}
					/>
				),
			});
		}

		cols.push(
			{
				key: "item",
				header: "Item",
				render: (item) => (
					<div className="handout-item-cell">
						<CrfImage
							src={item.imageUrl}
							alt=""
							category="SOUVENIR"
							className="handout-item-thumb"
						/>
						<span className="handout-item-name">
							{item.title}
							<small>{[item.variantTitle, item.sku].filter(Boolean).join(" · ")}</small>
						</span>
					</div>
				),
			},
			{
				key: "qty",
				header: "Qty",
				align: "right",
				render: (item) => formatCrfQuantity(item.quantity),
			},
		);

		if (stock || stockLoading) {
			cols.push({
				key: "stock",
				header: "Stock now",
				hideBelow: "sm",
				render: (item) => {
					if (stockLoading && !stock) return "Checking…";
					const line = stockBySku.get(item.sku);
					if (!line) return "--";
					const short =
						line.status !== "AVAILABLE" || line.available < item.quantity;
					return (
						<span
							className={`handout-pill handout-pill--${short ? "danger" : "success"}`}
						>
							{line.status === "UNKNOWN_SKU" || line.status === "INACTIVE"
								? "Unavailable"
								: `${formatCrfQuantity(line.available)} available`}
						</span>
					);
				},
			});
		}

		cols.push({
			key: "amount",
			header: "Value",
			align: "right",
			render: (item) => formatCrfAmount(item.amount),
		});

		return cols;
	}, [check, stock, stockLoading, stockBySku]);

	const total = items.reduce((sum, item) => sum + item.amount, 0);

	return (
		<>
			<ManagementTable
				rows={items}
				columns={columns}
				getRowId={(item) => item.id}
				ariaLabel="Requested souvenirs"
				pagination={false}
				density="compact"
				minWidth="32rem"
				emptyTitle="No items"
				emptyDescription="This request has no items."
			/>
			<div className="handout-total">
				<span>Total estimated value (incl. GST)</span>
				<span>{formatCrfAmount(total)}</span>
			</div>
		</>
	);
}
