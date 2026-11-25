type SkipLinkProps = {
	targetId: string;
	label?: string;
};

/**
 * First focusable element on app pages (WCAG 2.4.1 Bypass Blocks).
 * Visually hidden until it receives keyboard focus.
 */
export const SkipLink = ({
	targetId,
	label = "Skip to main content",
}: SkipLinkProps) => (
	<a
		href={`#${targetId}`}
		className="skip-link"
		onClick={(event) => {
			const target = document.getElementById(targetId);
			if (!target) return;
			event.preventDefault();
			target.focus();
			target.scrollIntoView({ block: "start" });
		}}
	>
		{label}
	</a>
);

export default SkipLink;
