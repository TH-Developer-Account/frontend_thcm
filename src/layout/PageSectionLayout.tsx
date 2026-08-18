import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type PageSectionLayoutProps<TElement extends ElementType = "section"> = {
	children: ReactNode;
	className?: string;
	as?: TElement;
} & Omit<ComponentPropsWithoutRef<TElement>, "children" | "className" | "as">;

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
) => classNames.filter(Boolean).join(" ");

const PageSectionLayout = <TElement extends ElementType = "section">({
	children,
	className = "",
	as,
	...restProps
}: PageSectionLayoutProps<TElement>) => {
	const Component = as ?? "section";

	return (
		<Component
			className={joinClassNames("page-section-layout", className)}
			{...restProps}
		>
			<div className="page-section-layout-inner">{children}</div>
		</Component>
	);
};

export default PageSectionLayout;
