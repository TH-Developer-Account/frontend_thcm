import React from "react";
import type { AccordionProps } from "./common.types";

export function Accordion({
	items,
	allowMultiple = false,
	defaultOpen = [],
}: AccordionProps) {
	const [openItems, setOpenItems] = React.useState<string[]>(defaultOpen);

	const toggleItem = (id: string) => {
		setOpenItems((prev) =>
			allowMultiple
				? prev.includes(id)
					? prev.filter((i) => i !== id)
					: [...prev, id]
				: prev.includes(id)
					? []
					: [id],
		);
	};

	return (
		<div className="space-y-2">
			{items.map((item) => {
				const isOpen = openItems.includes(item.id);

				return (
					<div key={item.id} className="rounded-md text-left bg-gray-100">
						<button
							type="button"
							onClick={() => toggleItem(item.id)}
							className="w-full px-4 py-3 text-left  font-bold flex justify-between transition  duration-300 "
						>
							{item.title}
							<span>{isOpen ? "−" : "+"}</span>
						</button>
						{isOpen && (
							<div className="px-4 pb-4 text-sm text-gray-600">
								{item.content}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
