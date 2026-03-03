import sharp from "sharp";
import { exec } from "child_process";
import util from "util";
import path from "path";
import fs from "fs/promises";

// export async function convertSVGtoRaster(inputPath, outputFormat) {
//   const outputPath = inputPath + "." + outputFormat;
//   await sharp(inputPath).toFormat(outputFormat).toFile(outputPath);
//   return outputPath;
// }

// services/svg.service.js


const execAsync = util.promisify(exec);

/**
 * Convert an SVG into a raster format (png, jpeg, avif, webp, etc.)
 * Prefers ImageMagick for full format coverage, with sharp as a fallback.
 */
// export async function convertSVGtoRaster(inputPath, outputFormat) {
//   const absInput = path.resolve(inputPath);
//   const absOutput = absInput + "." + outputFormat;

//   // 1. Try ImageMagick
//   const magickCmd = `magick "${absInput}" "${absOutput}"`;
//   try {
//     const { stderr } = await execAsync(magickCmd);
//     if (stderr) console.warn("ImageMagick stderr:", stderr);

//     await fs.access(absOutput); // confirm file exists
//     return absOutput;
//   } catch (magickErr) {
//     console.warn(`[SVG->${outputFormat}] ImageMagick failed:`, magickErr.message);
//   }

//   // 2. Fallback to sharp
//   try {
//     const svgBuffer = await fs.readFile(absInput);
//     await sharp(svgBuffer).toFormat(outputFormat).toFile(absOutput);
//     return absOutput;
//   } catch (sharpErr) {
//     throw new Error(
//       `SVG → ${outputFormat} conversion failed. ImageMagick error: ${magickErr?.message || "n/a"}; sharp error: ${sharpErr.message}`
//     );
//   }
// }


export async function convertSVGtoRaster(inputPath, outputFormat) {
  const outputPath = inputPath + "." + outputFormat;
  
  try {
    // Read SVG content to determine if it has dimensions
    const svgContent = await fs.readFile(inputPath, 'utf8');
    
    // Sharp configuration for SVG conversion
    const sharpConfig = {
      density: 300, // High DPI for better quality
    };
    
    // Check if SVG has width/height attributes
    const hasViewBox = svgContent.includes('viewBox');
    const hasWidthHeight = svgContent.includes('width=') && svgContent.includes('height=');
    
    let sharpInstance = sharp(inputPath, sharpConfig);
    
    // If SVG doesn't have proper dimensions, set a default size
    if (!hasViewBox && !hasWidthHeight) {
      sharpInstance = sharpInstance.resize(1024, 1024, {
        fit: 'inside',
        withoutEnlargement: false
      });
    }
    
    // Handle different output formats with specific options
    switch (outputFormat.toLowerCase()) {
      case 'png':
        await sharpInstance
          .png({ compressionLevel: 6, adaptiveFiltering: false })
          .toFile(outputPath);
        break;
        
      case 'jpeg':
      case 'jpg':
        await sharpInstance
          .jpeg({ quality: 90, progressive: true })
          .toFile(outputPath);
        break;
        
      case 'webp':
        await sharpInstance
          .webp({ quality: 90, effort: 4 })
          .toFile(outputPath);
        break;
        
      case 'avif':
        await sharpInstance
          .avif({ quality: 80, effort: 4 })
          .toFile(outputPath);
        break;
        
      case 'tiff':
      case 'tif':
        await sharpInstance
          .tiff({ compression: 'lzw' })
          .toFile(outputPath);
        break;
        
      case 'bmp':
        await sharpInstance
          .toFormat('bmp')
          .toFile(outputPath);
        break;
        
      default:
        await sharpInstance
          .toFormat(outputFormat)
          .toFile(outputPath);
    }
    
    return outputPath;
    
  } catch (error) {
    console.error(`SVG to ${outputFormat} conversion failed:`, error);
    
    // If Sharp fails, try a fallback approach with basic Sharp
    try {
      console.log(`Attempting fallback conversion for SVG to ${outputFormat}`);
      await sharp(inputPath)
        .resize(2048, 2048, { 
          fit: 'inside', 
          withoutEnlargement: false,
          background: { r: 255, g: 255, b: 255, alpha: 1 } 
        })
        .toFormat(outputFormat)
        .toFile(outputPath);
      
      return outputPath;
    } catch (fallbackError) {
      console.error(`SVG fallback conversion also failed:`, fallbackError);
      throw new Error(`Failed to convert SVG to ${outputFormat}: ${fallbackError.message}`);
    }
  }
}
