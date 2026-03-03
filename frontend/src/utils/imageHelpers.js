// src/utils/imageHelpers.js
import heicPreview from "../assets/heicPreview.png";
import tiffPreview from "../assets/tiffPreview.png";

/**
 * Centralized helper utilities:
 * - PREVIEW_MAP for HEIC/TIFF placeholders (single source of truth)
 * - formatOptions, getExtension, isAcceptedFormat
 * - generateSignature(files) -> deterministic signature (order-insensitive)
 * - localStorage-backed conversion cache (getCachedConversion / setCachedConversion)
 * - getPreviewUrl(item) -> returns placeholder or url or entry.preview
 */

// Preview mapping
export const PREVIEW_MAP = {
  heic: heicPreview,
  heif: heicPreview,
  tif: tiffPreview,
  tiff: tiffPreview,
};

// formats supported (central source)
export const formatOptions = [
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
  "tiff",
  "heic",
  "avif",
  "svg",
  "ico",
];

// get extension from filename string
export function getExtension(filename = "") {
  if (!filename) return "";
  const parts = String(filename).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

// basic acceptance check (treat jpg equivalent to jpeg)
export function isAcceptedFormat(ext = "") {
  if (!ext) return false;
  if (ext === "jpg") ext = "jpeg";
  return formatOptions.includes(ext);
}

/**
 * Deterministic signature for one-or-more File objects (or objects with
 * name/size/lastModified). Sorting applied so order doesn't matter.
 */
export function generateSignature(files) {
  if (!files) return "";
  const arr = Array.isArray(files) ? files : [files];
  const normalized = arr.map((f) => {
    if (!f) return "";
    // If it's a simple object with name/size/lastModified
    const name = f.name || "";
    const size = f.size || 0;
    const lm = f.lastModified || 0;
    return `${name}|${size}|${lm}`;
  });
  normalized.sort();
  return normalized.join("||");
}

// localStorage cache for conversions
const CACHE_KEY = "desipix_conversion_cache_v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days TTL (adjustable)

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (e) {
    console.warn("Failed to read conversion cache", e);
    return {};
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn("Failed to write conversion cache", e);
  }
}

/**
 * Returns cached entry { files:[{name,url}], ts } or null
 */
export function getCachedConversion(signature, format) {
  if (!signature || !format) return null;
  const cache = loadCache();
  const key = `${signature}::${format}`;
  const entry = cache[key];
  if (!entry) return null;
  // TTL enforcement
  if (entry.ts && Date.now() - entry.ts > CACHE_TTL_MS) {
    // expired — remove
    delete cache[key];
    saveCache(cache);
    return null;
  }
  return entry;
}

/**
 * Save to cache: files should be array of { name, url }
 */
export function setCachedConversion(signature, format, files) {
  if (!signature || !format || !files) return;
  const cache = loadCache();
  const key = `${signature}::${format}`;
  cache[key] = { files, ts: Date.now() };
  saveCache(cache);
}

export function clearConversionCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.warn("Failed to clear conversion cache", e);
  }
}

/**
 * getPreviewUrl(item)
 * - If item.preview exists, return it (ImageInput creates/controls objectURLs)
 * - Else if item.url exists (server result), return placeholder for non-displayable types or the url
 * - Else returns empty string (ImageInput will provide preview)
 *
 * Important: this util DOES NOT create object URLs for raw File objects.
 * ImageInput is responsible for creating and revoking object URLs (so we can manage lifecycle).
 */
export function getPreviewUrl(item) {
  if (!item) return "";

  // explicit preview property (preferred)
  if (item.preview) return item.preview;

  // server-side converted file or file-like object with url
  if (item.url) {
    const name = item.name || "";
    const ext = getExtension(name) || getExtension(item.url);
    if (PREVIEW_MAP[ext]) return PREVIEW_MAP[ext];
    return item.url;
  }

  // fallback: if an object with name & url-like fields, handle placeholders
  if (item.name) {
    const ext = getExtension(item.name);
    if (PREVIEW_MAP[ext]) return PREVIEW_MAP[ext];
  }

  return "";
}
