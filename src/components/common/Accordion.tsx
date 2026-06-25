import React from "react";
import type { AccordionProps } from "./common.types";

export function Accordion({
	items,
	allowMultiple = false,
	defaultOpen = [],
	children,
	childrenTitle,
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
		<div className="accordion">
			{items
				? items.map((item) => {
						const isOpen = openItems.includes(item.id);

						return (
							<div
								key={item.id}
								className={`accordion-item ${isOpen ? "accordion-item-open" : ""}`}
							>
								<button
									type="button"
									onClick={() => toggleItem(item.id)}
									className="accordion-trigger"
								>
									<span className="accordion-title">
										{item.title || childrenTitle}
									</span>
									<span className="accordion-icon">{isOpen ? "−" : "+"}</span>
								</button>

								{isOpen && (
									<div className="accordion-content">
										{item.content || children}
									</div>
								)}
							</div>
						);
					})
				: null}
		</div>
	);
}
