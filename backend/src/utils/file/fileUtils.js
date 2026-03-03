import fs from "fs/promises";

/**
 * Safely delete a file with retries and delay handling.
 * - Retries on EBUSY (Windows lock issues)
 * - Ignores ENOENT (already deleted)
 *
 * @param {string} filepath - Path to the file
 * @param {object} [options]
 * @param {string} [options.label] - For logging context
 * @param {number} [options.retries=2] - Number of retries on failure
 * @param {number} [options.delay=100] - Delay between retries (ms)
 */
export async function safeDeleteFile(filepath, {
  label = "file",
  retries = 2,
  delay = 100
} = {}) {
  if (!filepath) return false;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(res => setTimeout(res, delay));
      }
      await fs.unlink(filepath);
      console.log(`✅ ${label} deleted: ${filepath}`);
      return true;
    } catch (err) {
      if (err.code === "ENOENT") {
        console.log(`⚠️ ${label} already gone: ${filepath}`);
        return true;
      }
      if (err.code === "EBUSY" && attempt < retries) {
        console.warn(`⚠️ ${label} busy, retrying (${attempt + 1}/${retries}) → ${filepath}`);
        continue;
      }
      console.error(`❌ Failed deleting ${label}:`, err.message || err);
      return false;
    }
  }
  return false;
}
