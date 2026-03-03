// backend/src/utils/cleanupManager.js
import fs from "fs/promises";
import path from "path";
import { safeDeleteFile } from "../file/fileUtils.js";

// Format timestamp in 24-hour format with AM/PM
function getFormattedTimestamp() {
  const date = new Date();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const ampm = date.getHours() < 12 ? "AM" : "PM";

  const datePart = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `${datePart} ${hours}:${minutes}:${seconds} ${ampm}`;
}

// Centralized logger
function log(message, level = "info") {
  const prefix = `[${getFormattedTimestamp()}]`;
  switch (level) {
    case "warn":
      console.warn(`${prefix} ⚠️ ${message}`);
      break;
    case "error":
      console.error(`${prefix} ❌ ${message}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}

class CleanupManager {
  constructor() {
    this.CACHE_LIFETIME_MS = 60 * 60 * 1000; // 1 hour
    this.MAX_CACHE_SIZE = 100;
    this.TEMP_FILE_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes
    this.tempFiles = new Set();
    this.cleanupInterval = null;
    this.isCleaning = false; // lock for periodic cleanup
  }

  

  // Check if file exists
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Register temporary file for tracking
  registerTempFile(filePath, createdAt = Date.now()) {
    this.tempFiles.add({
      path: filePath,
      createdAt,
      expiresAt: createdAt + this.TEMP_FILE_LIFETIME_MS,
    });
  }

  // Generic cleanup handler
  async performCleanup(items, deleteFn, type = "file") {
    const errors = [];
    let cleaned = 0;

    for (const item of items) {
      try {
        await deleteFn(item);
        cleaned++;
      } catch (error) {
        errors.push({ item, error: error.message });
        log(`Failed to cleanup ${type}: ${item.path || item.outputPath}`, "error");
      }
    }

    return { cleaned, errors };
  }

  // Cleanup temporary files
  async cleanupTempFiles() {
    const now = Date.now();
    const expired = [];

    if (!cleanupManager.safeDeleteFile) {
    cleanupManager.safeDeleteFile = async (filePath) => {
        try { await fs.promises.unlink(filePath); } 
        catch (err) { /* silently ignore missing files */ }
    };
}

    log(`🧹 [Temp Cleanup] Current temp files: ${this.tempFiles.size}`);

    for (const tempFile of this.tempFiles) {
      const exists = await this.fileExists(tempFile.path);
      if (tempFile.expiresAt < now || !exists) {
        expired.push(tempFile);
      }
    }

    const results = await this.performCleanup(
      expired,
      async (file) => {
        await safeDeleteFile(file.path, { label: "temp file" });
        this.tempFiles.delete(file);
        log(`Cleaned temp file: ${path.basename(file.path)}`);
      },
      "temp file"
    );

    log(`✅ Temp cleanup finished → Removed: ${results.cleaned}, Remaining: ${this.tempFiles.size}`);
    return results;
  }

  // Cleanup cache files
  async cleanupCache(processedImages) {
    if (!processedImages || typeof processedImages.entries !== "function") {
      log("Invalid processedImages Map provided to cleanupCache", "warn");
      return { cleaned: 0, errors: 0 };
    }

    const now = Date.now();
    const toDelete = [];

    log(`🧹 [Cache Cleanup] Cache before: ${processedImages.size} files`);

    for (const [uniqueKey, entry] of processedImages.entries()) {
      const exists = await this.fileExists(entry.outputPath);
      const lruCondition =
        processedImages.size > this.MAX_CACHE_SIZE &&
        entry.lastAccessed < now - 30 * 60 * 1000;

      const shouldDelete = entry.expiresAt < now || !exists || lruCondition;

      if (shouldDelete && !entry.isActive) {
        toDelete.push({ uniqueKey, entry });
      }
    }

    toDelete.sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);

    const results = await this.performCleanup(
      toDelete,
      async ({ uniqueKey, entry }) => {
        let reason = "expired";
        const exists = await this.fileExists(entry.outputPath);
        if (!exists) reason = "missing";
        else if (processedImages.size > this.MAX_CACHE_SIZE) reason = "LRU";

        await safeDeleteFile(entry.outputPath, { label: "cached file" });
        processedImages.delete(uniqueKey);
        log(`🗑️ Removed: ${path.basename(entry.outputPath)} (${reason})`);
      },
      "cache file"
    );

  
    // log(`   • Removed: ${results.cleaned}, Errors: ${results.errors.length}`);
    // log(`   • Cache after: ${processedImages.size} files`);
    // return results;

    let orphanedInCache = 0;
  for (const [uniqueKey, entry] of processedImages.entries()) {
    const exists = await this.fileExists(entry.outputPath);
    if (!exists && !entry.isActive) {
      processedImages.delete(uniqueKey);
      orphanedInCache++;
      log(`🗑️ Removed orphaned cache entry (file missing): ${uniqueKey}`);
    }
  }

  log(`   • Removed: ${results.cleaned}, Errors: ${results.errors.length}`);
  log(`   • Orphaned cache entries cleaned: ${orphanedInCache}`);
  log(`   • Cache after: ${processedImages.size} files`);
  
  return {
    cleaned: results.cleaned + orphanedInCache,
    errors: results.errors
  };
  }


  // Full cleanup
  async runFullCleanup(processedImages, reason = "manual") {
    const startTime = Date.now();
    log(`🧹 [Full Cleanup] (${reason})`);

    try {
      const [cacheResults, tempResults] = await Promise.all([
        this.cleanupCache(processedImages),
        this.cleanupTempFiles(),
      ]);

      
      const orphanRemoved = await this.cleanupOrphanFiles(processedImages);
      const totalCleaned = cacheResults.cleaned + tempResults.cleaned + orphanRemoved;
    //   const totalCleaned = cacheResults.cleaned + tempResults.cleaned;
      const totalErrors = cacheResults.errors.length + tempResults.errors.length;
      const duration = Date.now() - startTime;

      log(`✅ Full cleanup done in ${duration}ms`);
      log(`   • Total cleaned: ${totalCleaned}, Errors: ${totalErrors}`);

      return {
        success: true,
        duration,
        cache: cacheResults,
        temp: tempResults,
        total: { cleaned: totalCleaned, errors: totalErrors },
      };
    } catch (error) {
      log(`Full cleanup failed: ${error.message}`, "error");
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }

    


  }

  // Orphan cleanup (files in /uploads not tracked in processedImages)
// async cleanupOrphanFiles(processedImages) {
//   const uploadsDir = path.join(process.cwd(), "uploads");
//   let removed = 0;

//   try {
//     const files = await fs.readdir(uploadsDir);
//     for (const file of files) {
//       const fullPath = path.join(uploadsDir, file);

//       // check if file is tracked in processedImages
//       // const isTracked = Array.from(processedImages.values())
//       //   .some(entry => entry.outputPath === fullPath);
//       // const isTracked = Array.from(processedImages.values())
//       //   .some(entry =>
//       //     entry.outputPath === fullPath &&
//       //     entry.expiresAt > Date.now()
//       //   );

//       if (isTracked && fs.existsSync(fullPath)) {
//   return res.sendFile(fullPath);
// }

// // cache entry exists BUT file deleted by cleanup
// processedImages.delete(cacheKey);

//       if (!isTracked) {
//         await safeDeleteFile(fullPath, { label: "orphan file" });
//         removed++;
//       }


//     }

//     if (removed > 0) {
//       log(`🗑️ Orphan cleanup removed ${removed} untracked files`);
//     }
//   } catch (err) {
//     log(`Failed orphan cleanup: ${err.message}`, "error");
//   }

//   return removed;
// }

// backend/src/utils/cleanupManager.js
// Fix the cleanupOrphanFiles function:

async cleanupOrphanFiles(processedImages) {
  const uploadsDir = path.join(process.cwd(), "uploads");
  let removed = 0;

  try {
    const files = await fs.readdir(uploadsDir);
    
    for (const file of files) {
      const fullPath = path.join(uploadsDir, file);

      // ✅ FIX: Properly check if file is tracked
      const isTracked = Array.from(processedImages.values())
        .some(entry => {
          const entryBasename = path.basename(entry.outputPath);
          return entryBasename === file;
        });

      if (!isTracked) {
        try {
          await safeDeleteFile(fullPath, { label: "orphan file" });
          removed++;
          log(`🗑️ Removed orphan file: ${file}`);
        } catch (err) {
          log(`Failed to remove orphan file ${file}: ${err.message}`, "error");
        }
      }
    }

    if (removed > 0) {
      log(`🗑️ Orphan cleanup removed ${removed} untracked files`);
    }
  } catch (err) {
    log(`Failed orphan cleanup: ${err.message}`, "error");
  }

  return removed;
}


  // Emergency cleanup
  async emergencyCleanup(processedImages) {
    log(`🚨 Starting emergency cleanup`);

    let cleaned = 0;
    let errors = 0;

    if (processedImages && typeof processedImages.entries === "function") {
      for (const [uniqueKey, entry] of processedImages.entries()) {
        if (!entry.isActive) {
          try {
            await safeDeleteFile(entry.outputPath, { label: `emergency cached file (${uniqueKey})` });
            processedImages.delete(uniqueKey);
            cleaned++;
          } catch (error) {
            errors++;
            log(`Emergency cleanup failed for ${uniqueKey}: ${error.message}`, "error");
          }
        }
      }
    }

    for (const tempFile of this.tempFiles) {
      try {
        await safeDeleteFile(tempFile.path, { label: "emergency temp file" });
        this.tempFiles.delete(tempFile);
        cleaned++;
      } catch (error) {
        errors++;
        log(`Emergency temp cleanup failed for ${tempFile.path}: ${error.message}`, "error");
      }
    }

    log(`🚨 Emergency cleanup completed. Cleaned: ${cleaned}, Errors: ${errors}`);
    return { cleaned, errors };
  }

  // Start periodic cleanup with lock
  startPeriodicCleanup(processedImages, intervalMs = 30 * 60 * 1000) {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(async () => {
      if (this.isCleaning) return; // prevent overlapping
      this.isCleaning = true;
      try {
        await this.runFullCleanup(processedImages, "periodic");
      } catch (err) {
        log(`Periodic cleanup failed: ${err.message}`, "error");
      } finally {
        this.isCleaning = false;
      }
    }, intervalMs);

    log(`🕒 Periodic cleanup scheduled every ${intervalMs / 1000}s`);
    return this.cleanupInterval;
  }

  stopPeriodicCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      log(`🛑 Periodic cleanup stopped`);
    }
  }

  getStats(processedImages) {
    const now = Date.now();
    let activeCount = 0;
    let expiredCount = 0;

    if (processedImages && typeof processedImages.values === "function") {
      for (const entry of processedImages.values()) {
        if (entry.isActive) activeCount++;
        if (entry.expiresAt < now) expiredCount++;
      }
    }

    return {
      cachedFiles: processedImages ? processedImages.size : 0,
      tempFiles: this.tempFiles.size,
      activeFiles: activeCount,
      expiredFiles: expiredCount,
      maxCacheSize: this.MAX_CACHE_SIZE,
      cacheLifetimeMs: this.CACHE_LIFETIME_MS,
      tempLifetimeMs: this.TEMP_FILE_LIFETIME_MS,
    };
  }

  async shutdown(processedImages) {
    log(`🔄 Starting graceful cleanup shutdown`);

    this.stopPeriodicCleanup();

    try {
      const results = await this.runFullCleanup(processedImages, "shutdown");
      log(`✅ Graceful shutdown cleanup completed`);
      return results;
    } catch (error) {
      log(`Graceful shutdown cleanup failed: ${error.message}`, "error");
      return await this.emergencyCleanup(processedImages);
    }
  }
}


// Export singleton instance
export const cleanupManager = new CleanupManager();
