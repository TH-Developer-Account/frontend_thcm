/**
 * ArtworkRequestsPanel — CRF form VIEW. One row per requested artwork, with
 * the link from the artwork team (Open in new tab / Copy), Request edits for
 * the requester, and — for the artwork team — an inline link input that
 * saves each line independently.
 */
import { useState } from "react";
import { Check, Copy, ExternalLink, Link2, Pencil, Send } from "lucide-react";
import {
  useArtworksQuery,
  useRemind,
  useRequestEdit,
  useSubmitLink,
} from "./artwork.api";
import type { ArtworkRequest } from "./artwork.types";

const STATUS_LABEL: Record<ArtworkRequest["status"], string> = {
  REQUESTED: "In artwork queue",
  LINK_SHARED: "Link shared",
  EDIT_REQUESTED: "Edit requested",
};
const STATUS_STYLE: Record<ArtworkRequest["status"], string> = {
  REQUESTED: "bg-gray-100 text-gray-700",
  LINK_SHARED: "bg-green-100 text-green-800",
  EDIT_REQUESTED: "bg-amber-100 text-amber-800",
};

const msg = (e: unknown) =>
  (e as any)?.response?.data?.message ?? (e as Error)?.message ?? "Something went wrong";

function LinkRow({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can still select the text */
    }
  };
  return (
    <div className="flex items-center gap-2">
      <input readOnly value={link} className="min-w-0 flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm" />
      <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-xs hover:bg-gray-50">
        <ExternalLink size={13} /> Open
      </a>
      <button type="button" onClick={copy} className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-xs hover:bg-gray-50">
        {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function Row({
  crfId,
  item,
  canRequestEdit,
  canSubmitLink,
  maxRounds,
}: {
  crfId: string;
  item: ArtworkRequest;
  canRequestEdit: boolean;
  canSubmitLink: boolean;
  maxRounds: number;
}) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [url, setUrl] = useState(item.linkUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const edit = useRequestEdit(crfId);
  const submit = useSubmitLink(crfId);
  const remind = useRemind(crfId);

  const waiting = item.status !== "LINK_SHARED";
  const openRound = item.editRounds.find((r) => !r.resolvedAt);

  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{item.label}</p>
          <p className="text-xs text-gray-500">
            {item.productName} · {item.artworkType} · {item.width} × {item.height} {item.unit}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[item.status]}`}>
          {STATUS_LABEL[item.status]}
        </span>
      </div>

      {item.description && <p className="mt-2 text-sm text-gray-700">{item.description}</p>}

      {item.attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.attachments.map((a) => (
            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" title={a.description ?? a.fileName}>
              <img src={a.url} alt={a.description ?? a.fileName} className="h-14 w-14 rounded border border-gray-200 object-cover" />
            </a>
          ))}
        </div>
      )}

      {openRound && (
        <p className="mt-3 rounded-md bg-amber-50 p-2 text-xs text-amber-900">
          <strong>Requested change:</strong> {openRound.note}
        </p>
      )}

      {/* Requester view: show the shared link */}
      {item.linkUrl && !canSubmitLink && (
        <div className="mt-3"><LinkRow link={item.linkUrl} /></div>
      )}

      {/* Artwork team view: one input, saved per line */}
      {canSubmitLink && (
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            submit.mutate({ artworkId: item.id, url }, { onError: (x) => setError(msg(x)) });
          }}
        >
          <Link2 size={14} className="text-gray-400" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste artwork link"
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          {item.linkUrl && (
            <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-700 underline">Open</a>
          )}
          <button disabled={!url.trim() || submit.isPending} className="rounded-md bg-orange-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">
            {item.status === "LINK_SHARED" ? "Update link" : item.status === "EDIT_REQUESTED" ? "Submit updated link" : "Submit link"}
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {canRequestEdit && item.status === "LINK_SHARED" && !editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={item.editRounds.length >= maxRounds}
          className="mt-3 inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
        >
          <Pencil size={12} /> Request edits
        </button>
      )}

      {canRequestEdit && editing && (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-medium text-gray-700">What should change?</label>
          <textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={note.trim().length < 5 || edit.isPending}
              onClick={() =>
                edit.mutate(
                  { artworkId: item.id, note },
                  { onSuccess: () => { setEditing(false); setNote(""); setError(null); }, onError: (x) => setError(msg(x)) },
                )
              }
              className="inline-flex items-center gap-1 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              <Send size={12} /> Send edit request
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs">Cancel</button>
          </div>
          <p className="text-xs text-gray-500">The artwork team is emailed automatically.</p>
        </div>
      )}

      {canRequestEdit && waiting && (
        <button
          type="button"
          onClick={() => remind.mutate(item.id, { onError: (x) => setError(msg(x)) })}
          disabled={remind.isPending}
          className="mt-3 text-xs text-gray-600 underline disabled:opacity-50"
        >
          Remind artwork team
        </button>
      )}
    </li>
  );
}

export function ArtworkRequestsPanel({ crfId }: { crfId: string }) {
  const { data, isLoading, error } = useArtworksQuery(crfId);
  if (isLoading) return <p className="text-sm text-gray-500">Loading artworks…</p>;
  if (error || !data) return <p className="text-sm text-red-600">Couldn't load artworks.</p>;
  if (data.items.length === 0) return null; // nothing requested — keep the view clean

  const { summary, permissions } = data;
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Artwork requests</h4>
        <span className="text-xs text-gray-500">
          {summary.withLink} of {summary.total} links shared
        </span>
      </div>
      <ul className="space-y-3">
        {data.items.map((item) => (
          <Row
            key={item.id}
            crfId={crfId}
            item={item}
            canRequestEdit={permissions.canRequestEdit}
            canSubmitLink={permissions.canSubmitLink}
            maxRounds={permissions.maxEditRounds}
          />
        ))}
      </ul>
    </section>
  );
}
