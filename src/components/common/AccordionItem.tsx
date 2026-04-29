import React from "react";

type AccordionContextType = {
	openItems: string[];
	toggleItem: (id: string) => void;
};

const AccordionContext = React.createContext<AccordionContextType | null>(null);

type AccordionProps = {
	allowMultiple?: boolean;
	defaultOpen?: string[];
	children: React.ReactNode;
};

export function AccordionItem({
	allowMultiple = false,
	defaultOpen = [],
	children,
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
		<AccordionContext.Provider value={{ openItems, toggleItem }}>
			<div className="accordion">{children}</div>
		</AccordionContext.Provider>
	);
}

/* ---------------- ITEM ---------------- */

type AccordionItemProps = {
	id: string;
	title: React.ReactNode;
	children: React.ReactNode;
};

AccordionItem.Item = function AccordionItem({
	id,
	title,
	children,
}: AccordionItemProps) {
	const context = React.useContext(AccordionContext);

	if (!context) {
		throw new Error("Accordion.Item must be used inside Accordion");
	}

	const { openItems, toggleItem } = context;
	const isOpen = openItems.includes(id);

	return (
		<div className={`accordion-item ${isOpen ? "accordion-item-open" : ""}`}>
			<button
				type="button"
				onClick={() => toggleItem(id)}
				className="accordion-trigger"
			>
				<div className="accordion-item-title">
					<span className="epf-section-label">{title}</span>
				</div>
				<span className="accordion-icon">{isOpen ? "−" : "+"}</span>
			</button>

			{isOpen && (
				<div className="accordion-content scrollbar-sleek">{children}</div>
			)}
		</div>
	);
};
