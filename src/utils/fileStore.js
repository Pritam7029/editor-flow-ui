/**
 * fileStore.js
 *
 * A module-level singleton that holds File Object URLs during a browser session.
 * Object URLs created via URL.createObjectURL() are zero-copy — the browser
 * streams directly from the file on disk, so there is NO file-size limit and
 * NO memory overhead from reading the whole file into JS.
 *
 * Limitation: Object URLs do NOT survive a page refresh.
 * Files uploaded in a previous session will show a "Re-attach" prompt.
 * Files whose dataUrl is stored (small images) work across refreshes as normal.
 */

/** @type {Map<string, string>} fileId → Object URL */
const store = new Map();

/** Register an Object URL for a file id (called from addFiles). */
export function setObjectUrl(fileId, url) {
  store.set(fileId, url);
}

/**
 * Return the best playable URL for a file object.
 * Prefers an in-memory Object URL (large files), falls back to stored dataUrl.
 * Returns null when neither is available (file needs re-attaching).
 */
export function getFileUrl(file) {
  if (store.has(file.id)) return store.get(file.id);
  return file.dataUrl || null;
}

/** True if the file has a usable URL right now. */
export function hasFileUrl(file) {
  return store.has(file.id) || Boolean(file.dataUrl);
}

/**
 * Revoke the Object URL to free browser memory.
 * Should be called when a file is deleted.
 */
export function revokeObjectUrl(fileId) {
  const url = store.get(fileId);
  if (url) {
    URL.revokeObjectURL(url);
    store.delete(fileId);
  }
}
