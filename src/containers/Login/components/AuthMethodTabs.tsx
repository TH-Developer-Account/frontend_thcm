import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";

export type AuthMethod = "email" | "mobile";

const METHODS: Array<{ value: AuthMethod; label: string }> = [
	{ value: "email", label: "Email" },
	{ value: "mobile", label: "Mobile" },
];

type AuthMethodTabsProps = {
	value: AuthMethod;
	onChange: (value: AuthMethod) => void;
	children: ReactNode;
	label?: string;
};

/**
 * Email / Mobile switch on the staff and guest login pages.
 * WAI-ARIA tabs: roving tabindex, Arrow/Home/End keys, linked tabpanel.
 */
export const AuthMethodTabs = ({
	value,
	onChange,
	children,
	label = "Login method",
}: AuthMethodTabsProps) => {
	const baseId = useId();
	const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

	const tabId = (method: AuthMethod) => `${baseId}-tab-${method}`;
	const panelId = `${baseId}-panel`;

	const select = (index: number) => {
		const next = METHODS[(index + METHODS.length) % METHODS.length];
		onChange(next.value);
		tabRefs.current[METHODS.indexOf(next)]?.focus();
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
		switch (event.key) {
			case "ArrowRight":
			case "ArrowDown":
				event.preventDefault();
				select(index + 1);
				break;
			case "ArrowLeft":
			case "ArrowUp":
				event.preventDefault();
				select(index - 1);
				break;
			case "Home":
				event.preventDefault();
				select(0);
				break;
			case "End":
				event.preventDefault();
				select(METHODS.length - 1);
				break;
		}
	};

	return (
		<>
			<div className="auth-tabs" role="tablist" aria-label={label}>
				{METHODS.map((method, index) => {
					const isActive = method.value === value;

					return (
						<button
							key={method.value}
							ref={(node) => {
								tabRefs.current[index] = node;
							}}
							id={tabId(method.value)}
							type="button"
							role="tab"
							aria-selected={isActive}
							aria-controls={panelId}
							tabIndex={isActive ? 0 : -1}
							className={["auth-tab", isActive ? "auth-tab-active" : ""]
								.filter(Boolean)
								.join(" ")}
							onClick={() => onChange(method.value)}
							onKeyDown={(event) => handleKeyDown(event, index)}
						>
							{method.label}
						</button>
					);
				})}
			</div>

			<div
				id={panelId}
				className="auth-tab-panel"
				role="tabpanel"
				aria-labelledby={tabId(value)}
			>
				{children}
			</div>
		</>
	);
};

export default AuthMethodTabs;
