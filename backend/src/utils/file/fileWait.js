// utils/fileWait.js
import fs from "fs/promises";

export async function waitForFile(filePath, timeoutMs = 3000, intervalMs = 50) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fs.access(filePath);
      return true;
    } catch (e) {
      await new Promise(res => setTimeout(res, intervalMs));
    }
  }
  return false;
}
