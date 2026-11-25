// components/ui/DetailPageLayout.tsx
// Reusable page layout made of named sections. Import it, then put your
// content inside each section:
//
//   <DetailPageLayout>
//     <DetailPageLayout.Header title="…" badge={…} subtitle="…" back={…}>
//       {tabs}                       ← optional, shown on the right
//     </DetailPageLayout.Header>
//
//     <DetailPageLayout.Body>
//       <DetailPageLayout.Main>…</DetailPageLayout.Main>
//       <DetailPageLayout.Side>…</DetailPageLayout.Side>   ← optional
//     </DetailPageLayout.Body>
//   </DetailPageLayout>
//
// Layout only — all styling lives in ./detail-page-layout.css (.dpl-*).
// Omit <Side> and Main fills the width; below 1024px Side stacks under Main.
import type { CSSProperties, ReactNode } from "react";

const cx = (...parts: Array<string | false | null | undefined>) =>
	parts.filter(Boolean).join(" ");

/* ── Root ─────────────────────────────────────────────────────────────────── */

type RootProps = { children: ReactNode; className?: string };

const Root = ({ children, className }: RootProps) => (
	<div className={cx("dpl", className)}>{children}</div>
);

/* ── Header: back + title/badge/subtitle (left) · children (right) ────────── */

type HeaderProps = {
	title: ReactNode;
	badge?: ReactNode;
	subtitle?: ReactNode;
	/** e.g. <NavigateButton direction="back" /> */
	back?: ReactNode;
	/** Right side of the header, e.g. <TabsBar />. */
	children?: ReactNode;
	className?: string;
};

const Header = ({
	title,
	badge,
	subtitle,
	back,
	children,
	className,
}: HeaderProps) => (
	<header className={cx("dpl-header", className)}>
		<div className="dpl-header-copy">
			{back}

			<div className="dpl-title-block">
				<div className="dpl-title-row">
					<h2 className="dpl-title">{title}</h2>
					{badge}
				</div>

				{subtitle != null && <p className="dpl-subtitle">{subtitle}</p>}
			</div>
		</div>

		{children && <div className="dpl-header-end">{children}</div>}
	</header>
);

/* ── Body / Main ──────────────────────────────────────────────────────────── */

type SectionProps = { children: ReactNode; className?: string };

const Body = ({ children, className }: SectionProps) => (
	<div className={cx("dpl-body", className)}>{children}</div>
);

const Main = ({ children, className }: SectionProps) => (
	<div className={cx("dpl-main", className)}>{children}</div>
);

/* ── Side column ──────────────────────────────────────────────────────────── */

type SideProps = SectionProps & {
	/** aria-label for the landmark. */
	label?: string;
	/** Pin while the main column scrolls. Default true. */
	sticky?: boolean;
	/** Fixed width from 1024px up (any CSS length). Default: 18rem–22rem range. */
	width?: string;
};

const Side = ({
	children,
	className,
	label = "Side panel",
	sticky = true,
	width,
}: SideProps) => (
	<aside
		aria-label={label}
		className={cx("dpl-side", !sticky && "dpl-side--static", className)}
		// The body's grid reads these, so a custom width applies to the column.
		style={
			width
				? ({
						"--dpl-side-min": width,
						"--dpl-side-max": width,
					} as CSSProperties)
				: undefined
		}
	>
		{children}
	</aside>
);

/* ── Export as one namespaced component ───────────────────────────────────── */

const DetailPageLayout = Object.assign(Root, { Header, Body, Main, Side });

export default DetailPageLayout;
