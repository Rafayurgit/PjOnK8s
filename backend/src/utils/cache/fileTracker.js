// backend/src/utils/fileTracker.js
import fs from "fs/promises";
import path from "path";
import mime from "mime-types";
import { cleanupManager } from "./cleanupManager.js";

// class FileTracker {
//   constructor() {
//     this.processedImages = new Map();
//     this.activeOperations = new Map();
//     this.CACHE_LIFETIME_MS = 60 * 60 * 1000; // 1 hour
//   }

//   // Register a converted file
//   registerFile(uniqueKey, outputPath, type = 'converted') {
//     const now = Date.now();
    
//     this.processedImages.set(uniqueKey, {
//       outputPath,
//       type,
//       createdAt: now,
//       expiresAt: now + this.CACHE_LIFETIME_MS,
//       accessCount: 0,
//       lastAccessed: now,
//       isActive: false
//     });

//     console.log(`📝 Registered file: ${uniqueKey} -> ${path.basename(outputPath)}`);
//   }

//   // Mark file as being actively used
//   markFileActive(uniqueKey) {
//     const entry = this.processedImages.get(uniqueKey);
//     if (entry) {
//       entry.isActive = true;
//       entry.lastAccessed = Date.now();
//       entry.accessCount++;
//       console.log(`🔄 Marked file active: ${uniqueKey}`);
//     }
//   }

//   // Mark file as no longer active
//   markFileInactive(uniqueKey) {
//     const entry = this.processedImages.get(uniqueKey);
//     if (entry) {
//       entry.isActive = false;
//       console.log(`✅ Marked file inactive: ${uniqueKey}`);
//     }
//   }

//   // Check for cached converted file
//   async checkCache(uniqueKey, inputPath) {
//     const cachedEntry = this.processedImages.get(uniqueKey);
    
//     if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
//       try {
//         // Verify file still exists
//         await fs.access(cachedEntry.outputPath);
        
//         // Mark as accessed
//         this.markFileActive(uniqueKey);
//         setTimeout(() => this.markFileInactive(uniqueKey), 5000); // 5 sec active window
        
//         console.log(`🎯 Cache hit for ${uniqueKey}`);
        
//         // Cleanup input file since we're using cached version
//         try {
//           await cleanupManager.safeDeleteFile(inputPath, "uploaded file (cache hit)");
//         } catch (error) {
//           console.warn(`Failed to cleanup input file: ${error.message}`);
//         }
        
//         return {
//           stream: await this.createFileStream(cachedEntry.outputPath),
//           mimeType: mime.lookup(path.extname(cachedEntry.outputPath).slice(1)) || "application/octet-stream",
//           uniqueKey,
//           filePath: null,
//           outputPath: cachedEntry.outputPath,
//           url: `/uploads/${path.basename(cachedEntry.outputPath)}`,
//           fromCache: true,
//         };
//       } catch (error) {
//         // File doesn't exist, remove from cache
//         console.warn(`🗑️ Cached file missing, removing from cache: ${uniqueKey}`);
//         this.processedImages.delete(uniqueKey);
//         return null;
//       }
//     }

//     return null;
//   }

//   // Create file stream with error handling
//   async createFileStream(filePath) {
//     try {
//       const fs = await import('fs');
//       return fs.default.createReadStream(filePath);
//     } catch (error) {
//       throw new Error(`Failed to create file stream: ${error.message}`);
//     }
//   }

//   // Register active operation
//   registerOperation(operationId, uniqueKey, inputPath) {
//     this.activeOperations.set(operationId, {
//       uniqueKey,
//       inputPath,
//       startTime: Date.now()
//     });
//   }

//   // Remove active operation
//   removeOperation(operationId) {
//     this.activeOperations.delete(operationId);
//   }

//   // Get active operations
//   getActiveOperations() {
//     const now = Date.now();
//     return Array.from(this.activeOperations.entries()).map(([id, operation]) => ({
//       id,
//       uniqueKey: operation.uniqueKey,
//       duration: now - operation.startTime,
//       inputPath: path.basename(operation.inputPath)
//     }));
//   }

//   // Enforce cache size by removing least recently used files
//   async enforceCacheSize() {
//     const maxSize = cleanupManager.MAX_CACHE_SIZE;
//     if (this.processedImages.size <= maxSize) return;

//     const entries = Array.from(this.processedImages.entries())
//       .filter(([_, entry]) => !entry.isActive)
//       .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

//     const toRemove = entries.slice(0, this.processedImages.size - maxSize);

//     for (const [uniqueKey, entry] of toRemove) {
//       try {
//         await cleanupManager.safeDeleteFile(entry.outputPath, `LRU cached file (${uniqueKey})`);
//         this.processedImages.delete(uniqueKey);
//         console.log(`🗑️ Removed LRU file: ${uniqueKey}`);
//       } catch (error) {
//         console.error(`Failed to remove LRU file ${uniqueKey}:`, error.message);
//       }
//     }
//   }

//   // Manual cleanup method
//   async cleanup(filePath, outputPath, uniqueKey, reason) {
//     console.log(`🧹 Manual cleanup requested for ${uniqueKey}: ${reason}`);

//     const cleanupPromises = [];

//     if (filePath) {
//       cleanupPromises.push(cleanupManager.safeDeleteFile(filePath, "uploaded file"));
//     }

//     if (outputPath) {
//       cleanupPromises.push(cleanupManager.safeDeleteFile(outputPath, "converted file"));
//     }

//     if (uniqueKey) {
//       this.markFileInactive(uniqueKey);
//       this.processedImages.delete(uniqueKey);
//     }

//     try {
//       await Promise.all(cleanupPromises);
//       console.log(`✅ Manual cleanup completed for ${uniqueKey}`);
//     } catch (error) {
//       console.error(`❌ Manual cleanup failed for ${uniqueKey}:`, error.message);
//     }
//   }

//   // Get cache statistics
//   getCacheStats() {
//     const now = Date.now();
//     let activeCount = 0;
//     let expiredCount = 0;

//     for (const entry of this.processedImages.values()) {
//       if (entry.isActive) activeCount++;
//       if (entry.expiresAt < now) expiredCount++;
//     }

//     return {
//       totalFiles: this.processedImages.size,
//       activeFiles: activeCount,
//       expiredFiles: expiredCount,
//       activeOperations: this.activeOperations.size
//     };
//   }

//   // Clear expired entries
//   clearExpired() {
//     const now = Date.now();
//     const expired = [];

//     for (const [uniqueKey, entry] of this.processedImages.entries()) {
//       if (entry.expiresAt < now && !entry.isActive) {
//         expired.push(uniqueKey);
//       }
//     }

//     expired.forEach(key => this.processedImages.delete(key));
//     return expired.length;
//   }

//   // Get processed images map (for cleanup manager)
//   getProcessedImages() {
//     return this.processedImages;
//   }
// }

// Export singleton instance

class FileTracker {
  constructor() {
    this.processedImages = new Map();
    this.activeOperations = new Map();
    this.CACHE_LIFETIME_MS = 60 * 60 * 1000; // 1 hour
  }

  // Register a converted file
  registerFile(uniqueKey, outputPath, type = 'converted') {
    const now = Date.now();
    
    this.processedImages.set(uniqueKey, {
      outputPath,
      type,
      createdAt: now,
      expiresAt: now + this.CACHE_LIFETIME_MS,
      accessCount: 0,
      lastAccessed: now,
      isActive: false
    });

    console.log(`📝 Registered file: ${uniqueKey} -> ${path.basename(outputPath)}`);
  }

  // Mark file as being actively used
  markFileActive(uniqueKey) {
    const entry = this.processedImages.get(uniqueKey);
    if (entry) {
      entry.isActive = true;
      entry.lastAccessed = Date.now();
      entry.accessCount++;
      console.log(`🔄 Marked file active: ${uniqueKey}`);
    }
  }

  // Mark file as no longer active
  markFileInactive(uniqueKey) {
    const entry = this.processedImages.get(uniqueKey);
    if (entry) {
      entry.isActive = false;
      console.log(`✅ Marked file inactive: ${uniqueKey}`);
    }
  }

  // ✅ FIX: Check for cached converted file WITH FILE EXISTENCE VERIFICATION
  async checkCache(uniqueKey, inputPath) {
    const cachedEntry = this.processedImages.get(uniqueKey);
    
    // No cache entry at all
    if (!cachedEntry) {
      console.log(`❌ Cache miss: No entry for ${uniqueKey}`);
      return null;
    }

    console.log(`🔍 Cache check for ${uniqueKey}:`);
  console.log(`   Entry exists: ✅`);
  console.log(`   Expected path: ${cachedEntry.outputPath}`);
  console.log(`   Created: ${new Date(cachedEntry.createdAt).toISOString()}`);
  console.log(`   Expires: ${new Date(cachedEntry.expiresAt).toISOString()}`);

    
    // Cache entry exists, check if expired
    if (cachedEntry.expiresAt <= Date.now()) {
      console.log(`⏰ Cache expired for ${uniqueKey}`);
      this.processedImages.delete(uniqueKey);
      return null;
    }
    
    // ✅ CRITICAL FIX: Verify file actually exists on disk
    try {
      await fs.access(cachedEntry.outputPath);
      const stats = await fs.stat(cachedEntry.outputPath);

      console.log(`   File exists: ✅ (${stats.size} bytes)`);
      
      if (stats.size === 0) {
        console.warn(`⚠️ Cached file is empty, removing from cache: ${uniqueKey}`);
        this.processedImages.delete(uniqueKey);
        return null;
      }
      
      // File exists and is valid! Mark as accessed
      this.markFileActive(uniqueKey);
      setTimeout(() => this.markFileInactive(uniqueKey), 5000); // 5 sec active window
      
      console.log(`🎯 Cache hit for ${uniqueKey} (file verified on disk)`);
      
      // Cleanup input file since we're using cached version
      try {
        await cleanupManager.safeDeleteFile(inputPath, "uploaded file (cache hit)");
      } catch (error) {
        console.warn(`Failed to cleanup input file: ${error.message}`);
      }
      
      return {
        stream: await this.createFileStream(cachedEntry.outputPath),
        mimeType: mime.lookup(path.extname(cachedEntry.outputPath).slice(1)) || "application/octet-stream",
        uniqueKey,
        filePath: null,
        outputPath: cachedEntry.outputPath,
        url: `/uploads/${path.basename(cachedEntry.outputPath)}`,
        fromCache: true,
      };
      
    } catch (error) {
      // ✅ File doesn't exist on disk - remove stale cache entry
      console.warn(`🗑️ Cached file missing on disk, removing stale cache entry: ${uniqueKey}`);
      console.warn(`   Expected path: ${cachedEntry.outputPath}`);
      this.processedImages.delete(uniqueKey);
      return null;
    }
  }

  // Create file stream with error handling
  async createFileStream(filePath) {
    try {
      const fs = await import('fs');
      return fs.default.createReadStream(filePath);
    } catch (error) {
      throw new Error(`Failed to create file stream: ${error.message}`);
    }
  }

  // Register active operation
  registerOperation(operationId, uniqueKey, inputPath) {
    this.activeOperations.set(operationId, {
      uniqueKey,
      inputPath,
      startTime: Date.now()
    });
  }

  // Remove active operation
  removeOperation(operationId) {
    this.activeOperations.delete(operationId);
  }

  // Get active operations
  getActiveOperations() {
    const now = Date.now();
    return Array.from(this.activeOperations.entries()).map(([id, operation]) => ({
      id,
      uniqueKey: operation.uniqueKey,
      duration: now - operation.startTime,
      inputPath: path.basename(operation.inputPath)
    }));
  }

  // ✅ FIX: Enforce cache size with file existence check
  async enforceCacheSize() {
    const maxSize = cleanupManager.MAX_CACHE_SIZE;
    if (this.processedImages.size <= maxSize) return;

    console.log(`🧹 Cache size (${this.processedImages.size}) exceeds max (${maxSize}), enforcing limit...`);

    // ✅ First, remove any stale entries (files that don't exist)
    const staleEntries = [];
    for (const [uniqueKey, entry] of this.processedImages.entries()) {
      if (entry.isActive) continue; // Skip active files
      
      try {
        await fs.access(entry.outputPath);
      } catch {
        // File doesn't exist - mark as stale
        staleEntries.push(uniqueKey);
      }
    }

    // Remove stale entries
    for (const key of staleEntries) {
      this.processedImages.delete(key);
      console.log(`🗑️ Removed stale cache entry (file missing): ${key}`);
    }

    // Check if we still need to enforce limit after removing stale entries
    if (this.processedImages.size <= maxSize) {
      console.log(`✅ Cache within limit after removing ${staleEntries.length} stale entries`);
      return;
    }

    // ✅ Still over limit - use LRU to remove oldest
    const entries = Array.from(this.processedImages.entries())
      .filter(([_, entry]) => !entry.isActive)
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    const toRemove = entries.slice(0, this.processedImages.size - maxSize);

    for (const [uniqueKey, entry] of toRemove) {
      try {
        await cleanupManager.safeDeleteFile(entry.outputPath, `LRU cached file (${uniqueKey})`);
        this.processedImages.delete(uniqueKey);
        console.log(`🗑️ Removed LRU file: ${uniqueKey}`);
      } catch (error) {
        console.error(`Failed to remove LRU file ${uniqueKey}:`, error.message);
      }
    }

    console.log(`✅ Cache enforcement complete: ${this.processedImages.size}/${maxSize} entries`);
  }

  // Manual cleanup method
  async cleanup(filePath, outputPath, uniqueKey, reason) {
    console.log(`🧹 Manual cleanup requested for ${uniqueKey}: ${reason}`);

    const cleanupPromises = [];

    if (filePath) {
      cleanupPromises.push(cleanupManager.safeDeleteFile(filePath, "uploaded file"));
    }

    if (outputPath) {
      cleanupPromises.push(cleanupManager.safeDeleteFile(outputPath, "converted file"));
    }

    if (uniqueKey) {
      this.markFileInactive(uniqueKey);
      this.processedImages.delete(uniqueKey);
    }

    try {
      await Promise.all(cleanupPromises);
      console.log(`✅ Manual cleanup completed for ${uniqueKey}`);
    } catch (error) {
      console.error(`❌ Manual cleanup failed for ${uniqueKey}:`, error.message);
    }
  }

  // Get cache statistics
  getCacheStats() {
    const now = Date.now();
    let activeCount = 0;
    let expiredCount = 0;

    for (const entry of this.processedImages.values()) {
      if (entry.isActive) activeCount++;
      if (entry.expiresAt < now) expiredCount++;
    }

    return {
      totalFiles: this.processedImages.size,
      activeFiles: activeCount,
      expiredFiles: expiredCount,
      activeOperations: this.activeOperations.size
    };
  }

  // ✅ FIX: Clear expired entries WITH file existence check
  async clearExpired() {
    const now = Date.now();
    const expired = [];

    for (const [uniqueKey, entry] of this.processedImages.entries()) {
      // Skip active files
      if (entry.isActive) continue;
      
      // Check if expired OR if file doesn't exist
      let shouldRemove = entry.expiresAt < now;
      
      if (!shouldRemove) {
        try {
          await fs.access(entry.outputPath);
        } catch {
          // File doesn't exist - mark for removal
          shouldRemove = true;
        }
      }
      
      if (shouldRemove) {
        expired.push(uniqueKey);
      }
    }

    expired.forEach(key => this.processedImages.delete(key));
    
    if (expired.length > 0) {
      console.log(`🧹 Cleared ${expired.length} expired/missing cache entries`);
    }
    
    return expired.length;
  }

  // Get processed images map (for cleanup manager)
  getProcessedImages() {
    return this.processedImages;
  }
}

export const fileTracker = new FileTracker();