import React from "react";
import { CRF_CATEGORIES } from "../../constant";
import LineItemTable from "../../../../components/ui/LineItemTable";
import type { CrfProps, LineItemOption } from "../../types";

export function CrfItemsSection({
	items,
	onChange,
	isViewer,
	options,
}: CrfProps) {
	const getOptionsByCategory = (category: string): LineItemOption[] =>
		options.find((group) => group.label === category)?.options ?? [];

	const getItemsByCategory = (category: string) =>
		items.filter((item) => item.category === category);

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
				/>
			))}
		</React.Fragment>
	);
}
