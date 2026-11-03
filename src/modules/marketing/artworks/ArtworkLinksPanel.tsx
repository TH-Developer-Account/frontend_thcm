// artworks/ArtworkLinksPanel.tsx
// The marketing team's links, shown on the proposer's own form view (the CRF
// tab of the EPC page). Read-only and self-contained: give it an EPC id and
// it fetches GET /artworks/by-epc/:epcId itself.
//
//   - no artwork request for the EPC, no access, or still loading → renders nothing
//   - otherwise: a card listing each requested artwork with its link, or
//     "Awaiting link from the marketing team"
//
// This is the only artworks component other modules import (see index.ts).

import { ExternalLink } from "lucide-react";

import Card from "../../../components/common/Card";
import { useArtworkByEpcQuery } from "./artworks.api";
import { ArtworkCustomBadge, ArtworkStatusBadge } from "./ArtworkBadges";
import { formatArtworkDateTime, formatArtworkSize } from "./artworks.format";
import "./artworks.css";

export type ArtworkLinksPanelProps = {
	epcId: string;
	/** Card heading. */
	title?: string;
};

export default function ArtworkLinksPanel({
	epcId,
	title = "Artwork links",
}: ArtworkLinksPanelProps) {
	const { data: request } = useArtworkByEpcQuery(epcId);
	if (!request) return null;

	return (
		<Card
			title={title}
			subtitle={`${request.sharedCount} of ${request.itemCount} links shared by the marketing team`}
			actions={<ArtworkStatusBadge status={request.status} />}
			padding="compact"
		>
			<ul className="artwork-links-list">
				{request.items.map((item) => (
					<li key={item.id} className="artwork-links-row">
						<div className="artwork-event-cell">
							<strong>
								{item.title} {item.isCustom ? <ArtworkCustomBadge /> : null}
							</strong>
							{item.isCustom && item.description ? (
								<small>Brief: {item.description}</small>
							) : null}
							<small>
								{[
									formatArtworkSize(item.width, item.height, item.unit),
									`Qty ${item.quantity}`,
								]
									.filter((part) => part !== "--")
									.join(" · ")}
							</small>
						</div>

						{item.link ? (
							<div className="artwork-links-value">
								<a
									className="artwork-link-anchor"
									href={item.link}
									target="_blank"
									rel="noopener noreferrer"
								>
									Open artwork
									<ExternalLink size={14} aria-hidden="true" />
								</a>
								{item.sharedAt ? (
									<small>
										Shared {formatArtworkDateTime(item.sharedAt)}
										{item.sharedByName ? ` by ${item.sharedByName}` : ""}
									</small>
								) : null}
							</div>
						) : (
							<span className="artwork-link-missing">
								Awaiting link from the marketing team
							</span>
						)}
					</li>
				))}
			</ul>
		</Card>
	);
}
