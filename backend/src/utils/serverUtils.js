// backend/src/utils/serverUtils.js
import { cleanupManager } from "./cache/cleanupManager.js";
import { fileTracker } from "./cache/fileTracker.js";

// Health check functionality
export async function getHealthStatus() {
  try {
    const cleanupStats = cleanupManager.getStats(fileTracker.getProcessedImages());
    const cacheStats = fileTracker.getCacheStats();
    const memoryUsage = process.memoryUsage();
    
    const memUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      memory: memUsageMB,
      cleanup: cleanupStats,
      cache: cacheStats,
      activeOperations: fileTracker.getActiveOperations()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Manual cleanup endpoint handler
export async function handleManualCleanup(cleanupType = 'full') {
  try {
    let result;
    const processedImages = fileTracker.getProcessedImages();
    
    switch (cleanupType) {
      case 'cache':
        result = await cleanupManager.cleanupCache(processedImages);
        break;
      case 'temp':
        result = await cleanupManager.cleanupTempFiles();
        break;
      case 'emergency':
        result = await cleanupManager.emergencyCleanup(processedImages);
        break;
      default:
        result = await cleanupManager.runFullCleanup(processedImages, 'manual');
    }
    
    return {
      success: true,
      type: cleanupType,
      result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      type: cleanupType,
      timestamp: new Date().toISOString()
    };
  }
}

// Memory monitoring functionality
export function startMemoryMonitoring() {
  const MEMORY_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes
  const HIGH_MEMORY_THRESHOLD = 500; // 500MB
  const CRITICAL_MEMORY_THRESHOLD = 1000; // 1GB

  const memoryMonitor = setInterval(() => {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    // Log high memory usage
    if (memUsageMB.heapUsed > HIGH_MEMORY_THRESHOLD) {
      console.log(`📊 High memory usage detected:`, memUsageMB, 'MB');
    }
    
    // Emergency cleanup for critical memory usage
    if (memUsageMB.heapUsed > CRITICAL_MEMORY_THRESHOLD) {
      console.warn(`⚠️ Critical memory usage detected, running emergency cleanup...`);
      cleanupManager.emergencyCleanup(fileTracker.getProcessedImages()).catch(error => {
        console.error(`Emergency cleanup failed:`, error.message);
      });
    }
  }, MEMORY_CHECK_INTERVAL);

  return memoryMonitor;
}

// Graceful shutdown handler
export async function handleGracefulShutdown(server, signal) {
  console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
  
  const shutdownTimeout = 45000; // 45 seconds
  const shutdownTimer = setTimeout(() => {
    console.log(`⚠️ Graceful shutdown timeout, forcing exit...`);
    process.exit(1);
  }, shutdownTimeout);

  try {
    // Stop accepting new connections
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else {
          console.log(`🔒 HTTP server closed`);
          resolve();
        }
      });
    });

    // Stop cleanup scheduler
    cleanupManager.stopPeriodicCleanup();

    const processedImages = fileTracker.getProcessedImages();
    const cacheSize = processedImages.size;
    if (cacheSize > 0) {
      console.log(`🧹 Clearing ${cacheSize} cache entries before shutdown...`);
      processedImages.clear();
      console.log(`✅ Cache cleared`);
    }
    
    // Wait for active operations to complete
    const maxWaitTime = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (fileTracker.getActiveOperations().length > 0 && (Date.now() - startTime) < maxWaitTime) {
      const activeOps = fileTracker.getActiveOperations();
      console.log(`⏳ Waiting for ${activeOps.length} active operations to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const remainingOps = fileTracker.getActiveOperations();
    if (remainingOps.length > 0) {
      console.warn(`⚠️ Forced shutdown with ${remainingOps.length} active operations`);
    }

    // Run final cleanup
    const cleanupResult = await cleanupManager.shutdown(fileTracker.getProcessedImages());
    console.log(`🧹 Cleanup completed:`, cleanupResult.total);
    console.log(`✅ Graceful shutdown completed`);
    
    clearTimeout(shutdownTimer);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Graceful shutdown error:`, error.message);
    clearTimeout(shutdownTimer);
    process.exit(1);
  }
}

// Error handlers setup
export function setupErrorHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    // Try emergency cleanup before exit
    cleanupManager.emergencyCleanup(fileTracker.getProcessedImages()).finally(() => {
      process.exit(1);
    });
  });

  // Handle unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit on unhandled rejection, just log it
  });
}

// Startup initialization
// export async function initializeServer() {
//   try {
//     // Setup error handlers
//     setupErrorHandlers();
    
//     // Start memory monitoring
//     const memoryMonitor = startMemoryMonitoring();
    
//     // Start periodic cleanup
//     const processedImages = fileTracker.getProcessedImages();
//     const cleanupInterval = cleanupManager.startPeriodicCleanup(processedImages);
    
//     // Run initial cleanup
//     const startupCleanup = await cleanupManager.runFullCleanup(processedImages, 'startup');
//     console.log(`🧹 Startup cleanup completed:`, startupCleanup.total);
    
//     return {
//       memoryMonitor,
//       cleanupInterval,
//       startupCleanup
//     };
//   } catch (error) {
//     console.error(`❌ Server initialization failed:`, error.message);
//     throw error;
//   }
// }


export async function initializeServer() {
  try {
    // Setup error handlers
    setupErrorHandlers();
    
    const processedImages = fileTracker.getProcessedImages();
    
    // ✅ NEW: Clear all in-memory cache on startup
    // (files may have been deleted when server was down)
    const cacheSize = processedImages.size;
    if (cacheSize > 0) {
      console.log(`🧹 Clearing ${cacheSize} stale cache entries from previous session...`);
      processedImages.clear();
    }
    
    // Start memory monitoring
    const memoryMonitor = startMemoryMonitoring();
    
    // Start periodic cleanup
    const cleanupInterval = cleanupManager.startPeriodicCleanup(processedImages);
    
    // Run initial cleanup
    const startupCleanup = await cleanupManager.runFullCleanup(processedImages, 'startup');
    console.log(`🧹 Startup cleanup completed:`, startupCleanup.total);
    
    return {
      memoryMonitor,
      cleanupInterval,
      startupCleanup
    };
  } catch (error) {
    console.error(`❌ Server initialization failed:`, error.message);
    throw error;
  }
}

// Get server configuration
export function getServerConfig() {
  return {
    maxCacheSize: cleanupManager.MAX_CACHE_SIZE,
    cacheLifetimeMs: cleanupManager.CACHE_LIFETIME_MS,
    tempLifetimeMs: cleanupManager.TEMP_FILE_LIFETIME_MS,
    cleanupIntervalMs: 30 * 60 * 1000 // 30 minutes default
  };
}