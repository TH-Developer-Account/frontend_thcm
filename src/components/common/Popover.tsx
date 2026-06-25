import {
	useFloating,
	offset,
	flip,
	shift,
	autoUpdate,
	FloatingPortal,
	type Placement,
} from "@floating-ui/react";
import { type ReactNode, useState } from "react";

interface PopoverProps {
	trigger: ReactNode;
	children: ReactNode;
	placement?: Placement;
}

export default function Popover({
	trigger,
	children,
	placement = "bottom",
}: PopoverProps) {
	const [open, setOpen] = useState(false);

	const { refs, floatingStyles } = useFloating({
		placement,
		open,
		onOpenChange: setOpen,
		middleware: [offset(8), flip(), shift({ padding: 8 })],
		whileElementsMounted: autoUpdate,
	});

	return (
		<>
			{/* Trigger */}
			<div
				ref={(node) => refs.setReference(node)}
				onClick={() => setOpen(!open)}
				className="popover-trigger"
			>
				{trigger}
			</div>

			{/* Portal */}
			{open && (
				<FloatingPortal>
					<div
						ref={(node) => refs.setFloating(node)}
						style={floatingStyles}
						className="popover-panel"
					>
						{children}
					</div>
				</FloatingPortal>
			)}
		</>
	);
}
