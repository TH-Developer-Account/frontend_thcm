import {
	useFloating,
	useInteractions,
	useHover,
	useClick,
	useDismiss,
	useRole,
	safePolygon,
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
	/** How the popover opens. Defaults to "click". */
	openOn?: "click" | "hover";
	triggerClassName?: string;
	/** Controlled open state. Omit to let the popover manage itself. */
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export default function Popover({
	trigger,
	children,
	placement = "bottom",
	openOn = "click",
	triggerClassName = "",
	open: controlledOpen,
	onOpenChange,
}: PopoverProps) {
	const [internalOpen, setInternalOpen] = useState(false);

	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : internalOpen;

	const setOpen = (next: boolean) => {
		if (!isControlled) setInternalOpen(next);
		onOpenChange?.(next);
	};

	const { refs, floatingStyles, context } = useFloating({
		placement,
		open,
		onOpenChange: setOpen,
		middleware: [offset(8), flip(), shift({ padding: 8 })],
		whileElementsMounted: autoUpdate,
	});

	const hover = useHover(context, {
		enabled: openOn === "hover",
		delay: { open: 100, close: 150 },
		handleClose: safePolygon(),
	});
	const click = useClick(context, { enabled: openOn === "click" });
	const dismiss = useDismiss(context);
	const role = useRole(context, { role: "dialog" });

	const { getReferenceProps, getFloatingProps } = useInteractions([
		hover,
		click,
		dismiss,
		role,
	]);

	return (
		<>
			<div
				ref={refs.setReference}
				className={["popover-trigger", triggerClassName]
					.filter(Boolean)
					.join(" ")}
				{...getReferenceProps()}
			>
				{trigger}
			</div>

			{open && (
				<FloatingPortal>
					<div
						ref={refs.setFloating}
						style={floatingStyles}
						className="popover-panel"
						{...getFloatingProps()}
					>
						{children}
					</div>
				</FloatingPortal>
			)}
		</>
	);
}
