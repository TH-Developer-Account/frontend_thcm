/**
 * ArtworkRequestForm — the "request artwork" block for the Artworks tab.
 * Controlled: parent owns `drafts` (useArtworkDrafts) and decides when to
 * flush them (after the CRF is created). Rendered ABOVE the existing
 * catalogue tiles, which stay untouched.
 */
import { useRef, useState } from "react";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import {
  ARTWORK_TYPES,
  ARTWORK_UNITS,
  ARTWORK_MAX_IMAGE_BYTES,
  type ArtworkDraft,
} from "./artwork.types";
import { validateArtworkDraft, validateImage, type ArtworkDraftErrors } from "./artwork.schema";

type ProductOption = { value: string; label: string };
type Props = {
  products: ProductOption[];
  drafts: ArtworkDraft[];
  onAdd: (d: ArtworkDraft) => void;
  onRemove: (key: string) => void;
  disabled?: boolean;
};

const blank = () => ({
  productId: "",
  artworkType: "",
  unit: "px",
  width: "",
  height: "",
  label: "",
  description: "",
});

const field =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none disabled:bg-gray-50";
const err = "mt-1 text-xs text-red-600";

export function ArtworkRequestForm({ products, drafts, onAdd, onRemove, disabled }: Props) {
  const [v, setV] = useState(blank());
  const [files, setFiles] = useState<ArtworkDraft["files"]>([]);
  const [errors, setErrors] = useState<ArtworkDraftErrors>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  const pickFiles = (list: FileList | null) => {
    if (!list) return;
    let next = [...files];
    let message: string | null = null;
    for (const file of Array.from(list)) {
      const m = validateImage(file, next.length);
      if (m) message = `${file.name}: ${m}`;
      else next = [...next, { file, description: "" }];
    }
    setFiles(next);
    setFileError(message);
    if (input.current) input.current.value = "";
  };

  const add = () => {
    const found = validateArtworkDraft(v);
    setErrors(found);
    if (Object.keys(found).length) return;
    onAdd({
      ...v,
      key: crypto.randomUUID(),
      productName: products.find((p) => p.value === v.productId)?.label ?? "",
      files,
    });
    setV(blank());
    setFiles([]);
    setErrors({});
    setFileError(null);
  };

  return (
    <section className="crf-artwork-form rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">Request artwork</h3>
      <p className="mb-4 text-xs text-gray-500">
        Add one artwork at a time. You can request several before saving.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Product</label>
          <select className={field} value={v.productId} onChange={set("productId")} disabled={disabled}>
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {errors.productId && <p className={err}>{errors.productId}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Type of artwork</label>
          <select className={field} value={v.artworkType} onChange={set("artworkType")} disabled={disabled || !v.productId}>
            <option value="">{v.productId ? "Select type" : "Select a product first"}</option>
            {ARTWORK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.artworkType && <p className={err}>{errors.artworkType}</p>}
        </div>
      </div>

      {v.artworkType && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Unit</label>
              <select className={field} value={v.unit} onChange={set("unit")}>
                {ARTWORK_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              {errors.unit && <p className={err}>{errors.unit}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Width</label>
              <input className={field} inputMode="decimal" value={v.width} onChange={set("width")} />
              {errors.width && <p className={err}>{errors.width}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Height</label>
              <input className={field} inputMode="decimal" value={v.height} onChange={set("height")} />
              {errors.height && <p className={err}>{errors.height}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Label</label>
            <input className={field} maxLength={120} value={v.label} onChange={set("label")} placeholder="e.g. Bangalore expo main banner" />
            {errors.label && <p className={err}>{errors.label}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
            <textarea className={field} rows={3} maxLength={1000} value={v.description} onChange={set("description")} />
            {errors.description && <p className={err}>{errors.description}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Attachments <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <p className="mb-2 text-xs text-gray-500">
              Want a custom artwork? Attach reference images — JPEG, PNG or WebP, up to{" "}
              {ARTWORK_MAX_IMAGE_BYTES / 1024 / 1024} MB each, with a short note for each.
            </p>
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-600 hover:border-orange-500"
            >
              <ImagePlus size={16} /> Add images
            </button>
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => pickFiles(e.target.files)} />
            {fileError && <p className={err}>{fileError}</p>}
            <ul className="mt-2 space-y-2">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2 rounded-md border border-gray-200 p-2">
                  <span className="max-w-[10rem] truncate text-xs text-gray-700">{f.file.name}</span>
                  <input
                    className={`${field} flex-1 py-1`}
                    placeholder="Describe this image"
                    maxLength={300}
                    value={f.description}
                    onChange={(e) =>
                      setFiles((s) => s.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))
                    }
                  />
                  <button type="button" aria-label="Remove image" onClick={() => setFiles((s) => s.filter((_, j) => j !== i))}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={add}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            <Plus size={14} /> Add artwork to request
          </button>
        </div>
      )}

      {drafts.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Artworks requested ({drafts.length})
          </h4>
          <ul className="space-y-2">
            {drafts.map((d) => (
              <li key={d.key} className="flex items-start justify-between gap-3 rounded-md bg-gray-50 p-3">
                <div className="min-w-0 text-sm">
                  <p className="truncate font-medium text-gray-900">{d.label}</p>
                  <p className="text-xs text-gray-500">
                    {d.productName} · {d.artworkType} · {d.width} × {d.height} {d.unit}
                    {d.files.length > 0 && ` · ${d.files.length} image${d.files.length > 1 ? "s" : ""}`}
                  </p>
                </div>
                <button type="button" aria-label="Remove artwork" onClick={() => onRemove(d.key)} className="text-gray-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function useArtworkDrafts() {
  const [drafts, setDrafts] = useState<ArtworkDraft[]>([]);
  return {
    drafts,
    add: (d: ArtworkDraft) => setDrafts((s) => [...s, d]),
    remove: (key: string) => setDrafts((s) => s.filter((d) => d.key !== key)),
    clear: () => setDrafts([]),
  };
}
