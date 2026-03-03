// services/svgFallback.service.js
import fs from "fs/promises";
import sharp from "sharp";
import { convertWithImageMagick } from "./imagick.service.js";

/**
 * Create an embedded SVG from a raster image
 * This embeds the raster image as base64 inside an SVG container
 */
export async function createEmbeddedSvg(inputPath) {
  const outputPath = inputPath + ".svg";
  
  try {
    // Convert to PNG first for consistent base64 encoding
    const tempPngPath = inputPath + ".temp_for_svg.png";
    
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;
    
    // Convert to PNG
    await sharp(inputPath)
      .png()
      .toFile(tempPngPath);
    
    // Read as base64
    const imageBuffer = await fs.readFile(tempPngPath);
    const base64Image = imageBuffer.toString('base64');
    
    // Create SVG with embedded image
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <image x="0" y="0" width="${width}" height="${height}" href="data:image/png;base64,${base64Image}"/>
</svg>`;
    
    // Write SVG file
    await fs.writeFile(outputPath, svgContent);
    
    // Cleanup temp PNG
    try {
      await fs.unlink(tempPngPath);
    } catch (e) {}
    
    console.log("Embedded SVG created successfully:", outputPath);
    return outputPath;
    
  } catch (error) {
    console.error("Embedded SVG creation failed:", error);
    throw error;
  }
}

/**
 * Try ImageMagick for SVG conversion
 */
export async function imageMagickToSvg(inputPath) {
  try {
    return await convertWithImageMagick(inputPath, 'svg');
  } catch (error) {
    console.error("ImageMagick SVG conversion failed:", error);
    throw error;
  }
}