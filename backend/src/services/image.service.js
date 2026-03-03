// services/image.service.js
// function cleanupCache() {

import fs from "fs";
import crypto from "crypto";
import path from "path";
import mime from "mime-types";
import { waitForFile } from "../utils/file/fileWait.js";
import { safeDeleteFile  } from "../utils/file/fileUtils.js";
import { universalConvert } from "./conversion/universalConvert.service.js";
import { cleanupManager } from "../utils/cache/cleanupManager.js";
import { fileTracker } from "../utils/cache/fileTracker.js";

const CACHE_LIFETIME_MS = 60 * 60 * 1000;
const processedImages = new Map();



//   const now = Date.now();
//   for (const [uniqueKey, { outputPath, expiresAt }] of processedImages.entries()) {
//     if (expiresAt < now) {
//       safeUnlink(outputPath, "converted file (cache expired)");
//       processedImages.delete(uniqueKey);
//     }
//   }
// }

// const getFileHash = (filepath) => {
//   const fileBuffer = fs.readFileSync(filepath);
//   return crypto.createHash("sha256").update(fileBuffer).digest("hex");
// };
// export const imageService = {
//   async convert(file, format) {
//     const originalExt = file.originalname.split(".").pop().toLowerCase();
//     const normOriginalExt = originalExt === "jpg" ? "jpeg" : originalExt;
//     const normFormat =
//       format.toLowerCase() === "jpg" ? "jpeg" : format.toLowerCase();

//     if (normOriginalExt === normFormat) {
//       safeUnlink(file.path, "uploaded file");
//       throw new Error(
//         "Source and target format are the same. Choose a different format."
//       );
//     }

//     const fileHash = getFileHash(file.path);
//     const uniqueKey = `${fileHash}_${normFormat}`;

//     cleanupCache();

//     const cachedEntry = processedImages.get(uniqueKey);

//     if (
//   cachedEntry &&
//   cachedEntry.expiresAt > Date.now() &&
//   fs.existsSync(cachedEntry.outputPath)
// ) {
//   safeUnlink(file.path, "uploaded file");
//   // Return info for already converted, cached file
//   return {
//     filePath: null,
//     outputPath: cachedEntry.outputPath,
//     uniqueKey,
//     url: `/uploads/${path.basename(cachedEntry.outputPath)}`,
//     fromCache: true,
//   };
//   }
    

//     // if (processedImages.has(uniqueKey)) {
//     //   safeUnlink(file.path, "uploaded file");
//     //   throw new Error("Image already converted to this format.");
//     // }

//     // if (processedImages.has(uniqueKey)) {
//     //   // Check if file still exists!
//     //   if (fs.existsSync(absoluteOutputPath)) {
//     //     // File is there, return download info
//     //     return {
//     //       stream,
//     //       mimeType,
//     //       uniqueKey,
//     //       filePath,
//     //       outputPath: absoluteOutputPath,
//     //     };
//     //   } else {
//     //     // File was cleaned, allow re-conversion
//     //     processedImages.delete(uniqueKey);
//     //     // Proceed to convert as normal...
//     //   }
//     // }
//     // ...convert as normal if not cached


// // Cleanup any expired cache entries before checking










//     const outputPath = await universalConvert(file.path, normFormat);
//     const absoluteOutputPath = path.resolve(outputPath);

//     processedImages.set(uniqueKey, {
//   outputPath: absoluteOutputPath,
//   expiresAt: Date.now() + CACHE_LIFETIME_MS,
// });

//     if (!fs.existsSync(absoluteOutputPath)) {
//       throw new Error("Conversion failed: output file not found.");
//     }

//     // processedImages.add(uniqueKey);
//     processedImages.set(uniqueKey, {
//       outputPath: absoluteOutputPath,
//       expiresAt: Date.now() + CACHE_LIFETIME_MS,
//     });

//     safeUnlink(file.path, "uploaded file");

//     const mimeType = mime.lookup(normFormat) || "application/octet-stream";
//     const stream = fs.createReadStream(absoluteOutputPath);

//     return {
//   stream,
//   mimeType,
//   uniqueKey,
//   filePath: null,
//   outputPath: absoluteOutputPath,
//   url: `/uploads/${path.basename(absoluteOutputPath)}`,
//   fromCache: false,
// };

//     // return {
//     //   stream,
//     //   mimeType,
//     //   uniqueKey,
//     //   filePath: file.path,
//     //   outputPath: absoluteOutputPath,
//     // };
//   },

//   cleanup(filePath, outputPath, uniqueKey, reason) {
//     safeUnlink(filePath, "uploaded file");
//     safeUnlink(outputPath, "converted file");
//     processedImages.delete(uniqueKey);
//     console.log(`🧹 Cleanup after ${reason} request for ${uniqueKey}`);
//   },
// };
// Cleanup expired cache files and remove entries from Map
// function cleanupCache() {
//   const now = Date.now();
//   for (const [uniqueKey, { outputPath, expiresAt }] of processedImages.entries()) {
//     if (expiresAt < now) {
//       safeUnlink(outputPath, "converted file (cache expired)");
//       processedImages.delete(uniqueKey);
//       console.log(`🧹 Cache expired, cleaned: ${outputPath}`);
//     }
//   }
// }

// Hash file content to generate unique key per image
// const getFileHash = (filepath) => {
//   const fileBuffer = fs.readFileSync(filepath);
//   return crypto.createHash("sha256").update(fileBuffer).digest("hex");
// };

// export const imageService = {
//   async convert(file, format) {
//     const originalExt = file.originalname.split(".").pop().toLowerCase();
//     const normOriginalExt = originalExt === "jpg" ? "jpeg" : originalExt;
//     const normFormat = format.toLowerCase() === "jpg" ? "jpeg" : format.toLowerCase();

//     // Reject conversion if source and target are the same fmt
//     if (normOriginalExt === normFormat) {
//       safeUnlink(file.path, "uploaded file");
//       throw new Error("Source and target format are the same. Choose a different format.");
//     }

//     // Generate hash key for cache lookup
//     const fileHash = getFileHash(file.path);
//     const uniqueKey = `${fileHash}_${normFormat}`;

//     // Cleanup expired files before processing
//     cleanupCache();

//     // Check if cached converted file exists and is valid
//     const cachedEntry = processedImages.get(uniqueKey);
//     if (cachedEntry && cachedEntry.expiresAt > Date.now() && fs.existsSync(cachedEntry.outputPath)) {
//       safeUnlink(file.path, "uploaded file"); // Cleanup uploaded original
//       return {
//         stream: fs.createReadStream(cachedEntry.outputPath),
//         mimeType: mime.lookup(normFormat) || "application/octet-stream",
//         uniqueKey,
//         filePath: null,
//         outputPath: cachedEntry.outputPath,
//         url: `/uploads/${path.basename(cachedEntry.outputPath)}`,
//         fromCache: true,
//       };
//     }

//     // Not cached or cache expired, so perform actual conversion
//     const outputPath = await universalConvert(file.path, normFormat);
//     const absoluteOutputPath = path.resolve(outputPath);

//     if (!fs.existsSync(absoluteOutputPath)) {
//       throw new Error("Conversion failed: output file not found.");
//     }

//     // Update cache with new converted file info and expiry
//     processedImages.set(uniqueKey, {
//       outputPath: absoluteOutputPath,
//       expiresAt: Date.now() + CACHE_LIFETIME_MS,
//     });

//     // Cleanup uploaded source file after conversion
//     safeUnlink(file.path, "uploaded file");

//     return {
//       stream: fs.createReadStream(absoluteOutputPath),
//       mimeType: mime.lookup(normFormat) || "application/octet-stream",
//       uniqueKey,
//       filePath: null,
//       outputPath: absoluteOutputPath,
//       url: `/uploads/${path.basename(absoluteOutputPath)}`,
//       fromCache: false,
//     };
//   },

//   // Manual cleanup method, useful for explicit deletes (e.g., aborted requests)
//   cleanup(filePath, outputPath, uniqueKey, reason) {
//     safeUnlink(filePath, "uploaded file");
//     safeUnlink(outputPath, "converted file");
//     processedImages.delete(uniqueKey);
//     console.log(`🧹 Cleanup after ${reason} request for ${uniqueKey}`);
//   },
// };

// backend/src/services/image.service.js (UPDATED)


// Generate hash for file content


const getFileHash = (filepath) => {
  try {
    const fileBuffer = fs.readFileSync(filepath);
    return crypto.createHash("sha256").update(fileBuffer).digest("hex");
  } catch (error) {
    throw new Error(`Failed to generate file hash: ${error.message}`);
  }
};

export const imageService = {
  async convert(file, format) {
    const conversionId = crypto.randomBytes(8).toString('hex');
    
    try {
      const originalExt = file.originalname.split(".").pop().toLowerCase();
      const normOriginalExt = originalExt === "jpg" ? "jpeg" : originalExt;
      const normFormat = format.toLowerCase() === "jpg" ? "jpeg" : format.toLowerCase();

      // Validate conversion request
      if (normOriginalExt === normFormat) {
        await cleanupManager.safeDeleteFile(file.path, "uploaded file (same format)");
        throw new Error("Source and target format are the same. Choose a different format.");
      }

      // Generate cache key
      const fileHash = getFileHash(file.path);
      const uniqueKey = `${fileHash}_${normFormat}`;

      // Register active operation
      fileTracker.registerOperation(conversionId, uniqueKey, file.path);

      // Check for cached result first
      const cachedResult = await fileTracker.checkCache(uniqueKey, file.path);
      if (cachedResult) {
        console.log(`✅ Using cached result for ${uniqueKey}`);
        fileTracker.removeOperation(conversionId);
        return cachedResult;
      }

      // Mark file as active during conversion
      fileTracker.markFileActive(uniqueKey);

      console.log(`🔄 Starting conversion ${conversionId}: ${normOriginalExt} → ${normFormat}`);
      
      // Perform conversion
      const outputPath = await universalConvert(file.path, normFormat);
      const absoluteOutputPath = path.resolve(outputPath);
      const fileReady = await waitForFile(absoluteOutputPath, 3000, 50);
if (!fileReady) {
  throw new Error("Conversion finished but output file not found (timing/race issue—waited 3s).");
}

      // Verify conversion success
      if (!fs.existsSync(absoluteOutputPath)) {
        throw new Error("Conversion failed: output file not found.");
      }

      // Register converted file with tracker
      fileTracker.registerFile(uniqueKey, absoluteOutputPath, 'converted');
      
      // Mark as no longer actively converting
      fileTracker.markFileInactive(uniqueKey);

      // Cleanup input file
      await cleanupManager.safeDeleteFile(file.path, "uploaded file");

      // Remove from active operations
      fileTracker.removeOperation(conversionId);

      // Enforce cache size limits
      await fileTracker.enforceCacheSize();

      const result = {
        stream: fs.createReadStream(absoluteOutputPath),
        mimeType: mime.lookup(normFormat) || "application/octet-stream",
        uniqueKey,
        filePath: null,
        outputPath: absoluteOutputPath,
        url: `/uploads/${path.basename(absoluteOutputPath)}`,
        fromCache: false,
      };

      console.log(`✅ Conversion ${conversionId} completed successfully`);
      return result;

        } catch (error) {
      // Cleanup on error
      const operation = fileTracker.activeOperations.get(conversionId);
      if (operation) {
        await cleanupManager.safeDeleteFile(operation.inputPath, "uploaded file (error)");
        fileTracker.markFileInactive(operation.uniqueKey);
        fileTracker.removeOperation(conversionId);
      }

      console.error(`❌ Conversion ${conversionId} failed: ${error.message}`);
      throw error;
    }
  },
};
