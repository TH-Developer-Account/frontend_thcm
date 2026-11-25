import { MASTER_DEFS } from "./masters.config";
import type { MasterKey } from "./masters.types";

type MasterHubProps = {
	activeKey: MasterKey;
	/** Record count per master, worked out from the GET /master-data response. */
	counts: Partial<Record<MasterKey, number>>;
	isLoading: boolean;
	onSelect: (key: MasterKey) => void;
};

/** Grid of master cards (desktop) / stacked list (mobile). */
export const MasterHub = ({ activeKey, counts, isLoading, onSelect }: MasterHubProps) => (
	<nav className="mh-hub" aria-label="Masters">
		{MASTER_DEFS.map((def) => {
			const count = counts[def.key];
			const isActive = def.key === activeKey;

			return (
				<button
					key={def.key}
					type="button"
					className={`mh-card${isActive ? " is-active" : ""}`}
					aria-pressed={isActive}
					onClick={() => onSelect(def.key)}
				>
					<span className="mh-card-top">
						<span className="mh-card-title">{def.label}</span>
						<span className="mh-card-count" aria-label={`${count ?? 0} records`}>
							{count ?? (isLoading ? "…" : "–")}
						</span>
					</span>
					<span className="mh-card-meta">{def.fieldsSummary}</span>
					<span className="mh-card-chevron" aria-hidden="true">
						›
					</span>
				</button>
			);
		})}
	</nav>
);
