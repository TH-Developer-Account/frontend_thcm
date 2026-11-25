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
import {
	cloneElement,
	isValidElement,
	type ReactElement,
	type ReactNode,
	type Ref,
	useState,
} from "react";

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

	// A native <button>/<a> trigger gets the ARIA state and ref itself.
	// Anything else is wrapped in a focusable role="button": the old plain
	// <div> carried aria-expanded (invalid on a div) and could not be
	// reached or opened from the keyboard.
	const nativeTrigger =
		isValidElement(trigger) &&
		(trigger.type === "button" || trigger.type === "a")
			? (trigger as ReactElement<Record<string, unknown> & { ref?: Ref<Element> }>)
			: null;

	return (
		<>
			{nativeTrigger ? (
				cloneElement(nativeTrigger, {
					ref: refs.setReference,
					...getReferenceProps(nativeTrigger.props),
				})
			) : (
				<div
					ref={refs.setReference}
					role="button"
					tabIndex={0}
					className={["popover-trigger", triggerClassName]
						.filter(Boolean)
						.join(" ")}
					{...getReferenceProps()}
				>
					{trigger}
				</div>
			)}

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
