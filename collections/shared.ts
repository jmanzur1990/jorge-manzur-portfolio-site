import type { FieldHook, Validate } from "payload";

const SLUG_RE = /^[a-z0-9-]+$/;
const HTTPS_URL_RE = /^https:\/\/[^\s]+$/;

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const slugFieldHook: FieldHook = ({ originalDoc, siblingData, value }) => {
  const current = typeof value === "string" && value.trim() ? value.trim() : undefined;
  const fromTitle = typeof siblingData?.title === "string" ? slugify(siblingData.title) : undefined;
  const next = current || fromTitle;

  if (!next || !SLUG_RE.test(next)) {
    throw new Error("Slug must match ^[a-z0-9-]+$.");
  }

  if (originalDoc?.slug && originalDoc.slug !== next) {
    throw new Error("Slug cannot be changed after creation.");
  }

  return next;
};

export const validateYear: Validate<string> = (value) =>
  typeof value === "string" && /^\d{4}$/.test(value) ? true : "Year must be a 4-digit string.";

export const validateHttpsUrl: Validate<string> = (value) =>
  typeof value === "string" && HTTPS_URL_RE.test(value) ? true : "URL must start with https://.";

export const validateNonEmptyStack: Validate<unknown[]> = (value) =>
  Array.isArray(value) && value.length > 0 ? true : "Stack must contain at least one item.";

export const validatePositiveNumber: Validate<number> = (value) =>
  typeof value === "number" && value > 0 ? true : "Value must be greater than zero.";
