import { z } from "zod";
import {
  ARTWORK_TYPES,
  ARTWORK_UNITS,
  ARTWORK_MAX_IMAGE_BYTES,
  ARTWORK_MAX_IMAGES,
  ARTWORK_IMAGE_TYPES,
} from "./artwork.types";

export const ARTWORK_MESSAGES = {
  product: "Select a product",
  type: "Select a type of artwork",
  unit: "Select a unit",
  size: "Enter a size greater than 0",
  label: "Label is required",
  labelMax: "Label must be 120 characters or fewer",
  descMax: "Description must be 1000 characters or fewer",
  imageType: "Only JPEG, PNG or WebP images are allowed",
  imageSize: "Image must be 5 MB or smaller",
  imageCount: `Up to ${ARTWORK_MAX_IMAGES} images per artwork`,
};

export const artworkDraftSchema = z.object({
  productId: z.string().min(1, ARTWORK_MESSAGES.product),
  artworkType: z.enum(ARTWORK_TYPES, { message: ARTWORK_MESSAGES.type }),
  unit: z.enum(ARTWORK_UNITS, { message: ARTWORK_MESSAGES.unit }),
  width: z.coerce.number({ message: ARTWORK_MESSAGES.size }).positive(ARTWORK_MESSAGES.size),
  height: z.coerce.number({ message: ARTWORK_MESSAGES.size }).positive(ARTWORK_MESSAGES.size),
  label: z.string().trim().min(1, ARTWORK_MESSAGES.label).max(120, ARTWORK_MESSAGES.labelMax),
  description: z.string().max(1000, ARTWORK_MESSAGES.descMax),
});

export type ArtworkDraftErrors = Partial<Record<keyof z.infer<typeof artworkDraftSchema>, string>>;

export function validateArtworkDraft(values: Record<string, unknown>): ArtworkDraftErrors {
  const r = artworkDraftSchema.safeParse(values);
  if (r.success) return {};
  const out: ArtworkDraftErrors = {};
  for (const issue of r.error.issues) {
    const k = issue.path[0] as keyof ArtworkDraftErrors;
    if (k && !out[k]) out[k] = issue.message;
  }
  return out;
}

export function validateImage(file: File, currentCount: number): string | null {
  if (!ARTWORK_IMAGE_TYPES.includes(file.type)) return ARTWORK_MESSAGES.imageType;
  if (file.size > ARTWORK_MAX_IMAGE_BYTES) return ARTWORK_MESSAGES.imageSize;
  if (currentCount >= ARTWORK_MAX_IMAGES) return ARTWORK_MESSAGES.imageCount;
  return null;
}
