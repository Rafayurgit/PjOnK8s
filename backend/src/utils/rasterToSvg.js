// utils/rasterToSvg.js
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { createEmbeddedSvg } from "../services/conversion/svgFallback.service.js";
import { imageMagickToSvg } from "../services/conversion/svgFallback.service.js";

export const SvgConversionMode = {
  VECTOR_FIRST: "vector_first",   // Prefer potrace
  STABLE_FIRST: "stable_first",   // Prefer IM fallback
};

export async function rasterToSvg(inputPath, mode = SvgConversionMode.VECTOR_FIRST) {
  console.log(`🚀 Starting raster→SVG conversion in mode: ${mode}`);

  // === Step 1. Vectorization with Potrace ===
  const tryPotrace = async () => {
    let potrace;
    try {
      potrace = await import("potrace");
      potrace = potrace.default || potrace;
    } catch (err) {
      throw new Error(`Potrace not installed: ${err.message}`);
    }

    if (!potrace?.trace) {
      throw new Error("Potrace module has no trace() function");
    }

    const outputPath = inputPath + ".svg";
    const tempPng = inputPath + ".temp.png";

    // Always normalize raster input to PNG before tracing
    await sharp(inputPath).png().toFile(tempPng);

    return await new Promise((resolve, reject) => {
      potrace.trace(
        tempPng,
        {
          threshold: 128,
          color: "black",
          background: "transparent",
          turdSize: 2,
          optCurve: true,
          optTolerance: 0.2,
          alphaMax: 1.0,
        },
        async (err, svg) => {
          try { await fs.unlink(tempPng); } catch {}

          if (err) return reject(new Error(`Potrace failed: ${err.message}`));

          try {
            await fs.writeFile(outputPath, svg);
            console.log("✅ Potrace SVG created:", outputPath);
            resolve(outputPath);
          } catch (writeErr) {
            reject(new Error(`Failed to write Potrace SVG: ${writeErr.message}`));
          }
        }
      );
    });
  };

  // === Step 2. ImageMagick fallback ===
  const tryImageMagick = async () => {
    console.log("⚙️ Falling back to ImageMagick SVG conversion...");
    return await imageMagickToSvg(inputPath);
  };

  // === Step 3. Raster embed fallback ===
  const tryEmbed = async () => {
    console.log("⚠️ Final fallback: embedding raster into SVG");
    return await createEmbeddedSvg(inputPath);
  };

  // === Choose pipeline order ===
  const pipeline =
    mode === SvgConversionMode.VECTOR_FIRST
      ? [tryPotrace, tryImageMagick, tryEmbed]
      : [tryImageMagick, tryPotrace, tryEmbed];

  // Run pipeline in sequence until success
  for (const step of pipeline) {
    try {
      return await step();
    } catch (err) {
      console.warn(`❌ ${step.name} failed: ${err.message}`);
    }
  }

  throw new Error("All raster→SVG conversion strategies failed");
}
