import React from "react";

import LineItemTable from "../../../../../components/ui/LineItemTable";
import { CRF_CATEGORIES } from "../../../constant";
import type { CrfProps, LineItemOption } from "../../types/lineItem.types";
import { ARTWORK_COLUMNS, DEFAULT_COLUMNS } from "../../utils/columnPresets";

export function CrfItemsSection({
	items,
	onChange,
	isViewer,
	options,
}: CrfProps) {
	const getOptionsByCategory = (category: string): LineItemOption[] => {
		return options.find((group) => group.label === category)?.options ?? [];
	};

	const getItemsByCategory = (category: string) => {
		return items.filter((item) => item.category === category);
	};

	const handleCategoryChange = (
		category: string,
		updater: React.SetStateAction<LineItemOption[]>,
	) => {
		onChange((prev) => {
			const otherItems = prev.filter((item) => item.category !== category);
			const categoryItems = prev.filter((item) => item.category === category);

			const updated =
				typeof updater === "function" ? updater(categoryItems) : updater;

			return [...otherItems, ...updated];
		});
	};

	return (
		<React.Fragment>
			{CRF_CATEGORIES.map((category) => (
				<LineItemTable
					key={category.value}
					title={category.title}
					items={getItemsByCategory(category.value)}
					onChange={(updater) => handleCategoryChange(category.value, updater)}
					particularOptions={getOptionsByCategory(category.value)}
					isViewer={isViewer}
					category={category.value}
					columns={
						category?.value === "ARTWORK" ? ARTWORK_COLUMNS : DEFAULT_COLUMNS
					}
				/>
			))}
		</React.Fragment>
	);
}
