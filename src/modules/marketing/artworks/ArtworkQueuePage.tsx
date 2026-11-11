/** Artwork team bucket: every CRF that still has lines waiting for a link. */
import { Link } from "react-router-dom";
import { useArtworkQueueQuery } from "./artwork.api";
import { ArtworkRequestsPanel } from "./ArtworkRequestsPanel";

export default function ArtworkQueuePage() {
  const { data, isLoading, error } = useArtworkQueueQuery();
  if (isLoading) return <p className="p-6 text-sm text-gray-500">Loading queue…</p>;
  if (error) return <p className="p-6 text-sm text-red-600">You may not have access to the artwork queue.</p>;
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <h1 className="text-lg font-semibold text-gray-900">Artwork queue</h1>
      {!data?.length && <p className="text-sm text-gray-500">Nothing waiting — all artworks have links.</p>}
      {data?.map((g) => (
        <div key={g.crfId} className="space-y-2">
          <Link to={`/marketing/activity-planner/${g.epcId}`} className="text-xs text-orange-700 underline">
            Open EPC
          </Link>
          {/* Panel shows ALL lines of the CRF so done ones stay visible; the queue only lists CRFs with pending lines. */}
          <ArtworkRequestsPanel crfId={g.crfId} />
        </div>
      ))}
    </div>
  );
}
